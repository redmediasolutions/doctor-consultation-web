import "server-only";

import { env } from "./env";
import { seedData } from "./seed";

/**
 * Database access.
 *  - DATABASE_URL set (Vercel + Neon, or any Postgres) → node-postgres pool
 *  - otherwise → PGlite, a real Postgres engine embedded in the app, stored in ./data/pglite
 * Both run the same SQL, so behaviour is identical locally and in production.
 */

export type Row = Record<string, unknown>;

export interface Sql {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Sql {
  /** Runs [fn] inside BEGIN/COMMIT; rolls back if it throws. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}

export class DatabaseNotConfiguredError extends Error {}

const SCHEMA = `
create table if not exists mc_stores (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists mc_doctors (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists mc_consultations (
  id text primary key,
  store_id text not null,
  doctor_id text,
  status text not null,
  created_at timestamptz not null,
  data jsonb not null
);
create index if not exists mc_consultations_status_idx on mc_consultations (status);
create index if not exists mc_consultations_created_idx on mc_consultations (created_at);
create table if not exists mc_prescriptions (
  id text primary key,
  store_id text not null,
  doctor_id text not null,
  dispensed boolean not null default false,
  created_at timestamptz not null,
  data jsonb not null
);
create index if not exists mc_prescriptions_created_idx on mc_prescriptions (created_at);
create table if not exists mc_counters (
  name text primary key,
  value integer not null
);
`;

type Global = { __mcDb?: Promise<Db> };
const g = globalThis as unknown as Global;

async function createPg(): Promise<Db> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: env.databaseUrl, max: 5, idleTimeoutMillis: 10_000 });
  return {
    async query<T>(text: string, params?: unknown[]) {
      const r = await pool.query(text, params as unknown[]);
      return r.rows as T[];
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const result = await fn({
          async query<R>(text: string, params?: unknown[]) {
            const r = await client.query(text, params as unknown[]);
            return r.rows as R[];
          },
        });
        await client.query("commit");
        return result;
      } catch (e) {
        await client.query("rollback").catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function createPglite(): Promise<Db> {
  if (env.isVercel) {
    throw new DatabaseNotConfiguredError(
      "No database connected. In Vercel open Storage → Create Database → Neon, connect it to this project, then redeploy.",
    );
  }
  const fs = await import("node:fs");
  fs.mkdirSync(env.dataDir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(env.dataDir);
  await db.waitReady;
  return {
    async query<T>(text: string, params?: unknown[]) {
      const r = await db.query(text, params);
      return r.rows as T[];
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>) {
      return db.transaction(async (tx) =>
        fn({
          async query<R>(text: string, params?: unknown[]) {
            const r = await tx.query(text, params);
            return r.rows as R[];
          },
        }),
      );
    },
  };
}

async function migrateAndSeed(db: Db) {
  for (const statement of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.query(statement);
  }
  const [{ count }] = await db.query<{ count: string | number }>("select count(*) as count from mc_stores");
  if (Number(count) === 0) await seed(db);
}

export async function seed(db: Sql) {
  const data = seedData();
  for (const s of data.stores) {
    await db.query("insert into mc_stores (id, data) values ($1, $2::jsonb) on conflict (id) do nothing", [
      s.id,
      JSON.stringify(s),
    ]);
  }
  for (const d of data.doctors) {
    await db.query("insert into mc_doctors (id, data) values ($1, $2::jsonb) on conflict (id) do nothing", [
      d.id,
      JSON.stringify(d),
    ]);
  }
  for (const name of ["token", "rx"]) {
    await db.query("insert into mc_counters (name, value) values ($1, 0) on conflict (name) do nothing", [name]);
  }
}

/** Shared database handle (one per server instance). Creates tables and demo data on first use. */
export function getDb(): Promise<Db> {
  if (!g.__mcDb) {
    g.__mcDb = (async () => {
      const db = env.databaseUrl ? await createPg() : await createPglite();
      await migrateAndSeed(db);
      return db;
    })().catch((e) => {
      g.__mcDb = undefined;
      throw e;
    });
  }
  return g.__mcDb;
}

/** Atomically increments a named counter and returns the new value. */
export async function nextCounter(tx: Sql, name: string): Promise<number> {
  const rows = await tx.query<{ value: number }>(
    "update mc_counters set value = value + 1 where name = $1 returning value",
    [name],
  );
  return Number(rows[0]?.value ?? 1);
}

/** Wipes all data and restores the demo stores/doctors. */
export async function resetDatabase() {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const t of ["mc_prescriptions", "mc_consultations", "mc_doctors", "mc_stores", "mc_counters"]) {
      await tx.query(`delete from ${t}`);
    }
    await seed(tx);
  });
}

/** SQL fragment: row's created_at falls on today's date in the app time zone. Uses one param. */
export function todaySql(column: string, paramIndex: number) {
  return `(${column} at time zone $${paramIndex})::date = (now() at time zone $${paramIndex})::date`;
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
