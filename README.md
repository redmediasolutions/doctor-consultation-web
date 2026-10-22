# MedConnect Web (Next.js)

The **server and web consoles** for MedConnect, an in-store doctor teleconsultation system for a 5-store
pharmacy chain. It is the backend the **MedConnect Flutter app** (`medconnect-app`) connects to.

| Part | What it does |
| --- | --- |
| **API** (`/api/*`) | Patient queue, consultations, prescriptions, stores, doctors, PIN logins, and **Agora token signing** for every video call. |
| **Doctor console** (`/doctor`) | Live queue from all stores, Agora video call with the store tablet, patient vitals, prescription pad, in-call chat. |
| **Pharmacy counter** (`/pharmacy`) | Prescriptions for that store arrive instantly; print, dispense. |
| **Owner dashboard** (`/admin`) | Today's numbers, per-store breakdown, consultation log, add doctors and stores. |
| **Printable Rx** (`/prescription/<id>`) | A4 prescription, print or save as PDF. |

Video and audio go through **Agora**. This server only signs a short-lived token per call, so it carries no
media load.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Agora Web SDK · Postgres (Neon) / PGlite.

Demo logins: doctor PIN **1234**, store counter PIN **1111**, owner PIN **0000**.

---

## Deploy to Vercel (≈5 minutes)

1. **Push to GitHub**
   ```bash
   git init && git add . && git commit -m "MedConnect web"
   git branch -M main
   git remote add origin https://github.com/<you>/medconnect-web.git
   git push -u origin main
   ```
   `.env.local` (which holds the Agora certificate) is git-ignored, so it won't be pushed.

2. **Import in Vercel**: vercel.com → *Add New → Project* → pick the repo → **Deploy**.
   No build settings are needed.

3. **Add the database** (one click): in the project open **Storage → Create Database → Neon (Postgres)** →
   *Connect to project*. This adds `DATABASE_URL` automatically. Tables and demo data are created on first use.

4. **Add one secret**: *Settings → Environment Variables*
   | Name | Value |
   | --- | --- |
   | `AGORA_APP_CERTIFICATE` | your Agora **Primary certificate** (it's also in `.env.local`) |

5. **Redeploy** (*Deployments → ⋯ → Redeploy*), then open `https://<your-project>.vercel.app/api/health`:
   ```json
   { "ok": true, "database": "postgres", "agora": { "appId": "91a5…", "certificateConfigured": true } }
   ```

6. In the Flutter app, enter `https://<your-project>.vercel.app` as the server address.

Optional variables: `ADMIN_PIN`, `SESSION_SECRET`, `APP_TIMEZONE` (default `Asia/Kolkata`), `AGORA_APP_ID`.
See `.env.example`.

> **Video needs HTTPS.** Vercel URLs are HTTPS already. On a custom domain, keep HTTPS on.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No database setup is needed locally: an embedded Postgres (PGlite) stores data in `./data/pglite`.
`.env.local` already has the Agora settings.

To use the Flutter app against your computer, run `npm run dev -- -H 0.0.0.0`. Then enter
`http://<your-computer-IP>:3000` as the server address in the app (same Wi-Fi).

## Deploy on your own server (VPS) instead

```bash
npm ci && npm run build
AGORA_APP_CERTIFICATE=... npm start      # port 3000; use pm2/systemd + Nginx/Caddy for HTTPS
```

Without `DATABASE_URL` it uses the embedded database in `./data` (back that folder up). Set `DATABASE_URL` to use
any Postgres.

## How the app and the website connect

```
Store tablet (Flutter, kiosk mode) ──POST /api/consultations──►  medconnect-web  ◄── Doctor (web or Flutter)
              │                                                       │
              └──GET /api/consultations/:id/rtc → Agora token ────────┘
                          both join Agora channel = consultation id
                          (patient uid 1001, doctor uid 2001)
```

Chat during the call uses Agora's data stream. Web and Flutter use the same message format, so a web doctor
can chat with a Flutter kiosk.

## API

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/health` | anyone |
| POST | `/api/auth/login` `{role, id?, pin}` → `{token, profile}` | doctor / staff / admin |
| GET | `/api/stores`, `/api/doctors` | anyone |
| POST | `/api/stores`, `/api/doctors` | admin |
| POST | `/api/doctors/heartbeat` `{status}` | doctor |
| GET | `/api/consultations?status=&today=1&doctorId=me` | doctor / staff / admin |
| POST | `/api/consultations` | kiosk |
| GET / PATCH | `/api/consultations/:id` `{action: accept\|end\|cancel}` | kiosk / doctor |
| GET | `/api/consultations/:id/rtc?as=patient\|doctor` | Agora credentials |
| POST | `/api/consultations/:id/prescription` | assigned doctor |
| GET | `/api/prescriptions?today=1&pending=1` | staff / admin / doctor |
| GET / PATCH | `/api/prescriptions/:id` | kiosk / staff |
| GET | `/api/admin/stats` · POST `/api/admin/reset` | admin |

Staff calls send `Authorization: Bearer <token>`.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/            PIN sign-in (doctor / pharmacy / owner)
│   ├── (dashboard)/doctor|pharmacy|admin
│   ├── prescription/[id]/       printable Rx
│   └── api/                     route handlers
├── components/
│   ├── ui/                      shadcn/ui
│   ├── auth/ export/ forms/ layout/ providers/
│   ├── confirm-dialog.tsx  empty-state.tsx  profile-menu.tsx  theme-toggle.tsx
├── features/
│   ├── consultations/           doctor console, Agora call hook, Rx form (addform/), services/, repository/
│   ├── prescriptions/           pharmacy counter, Rx view, services/, repository/
│   ├── admin/                   owner dashboard, add doctor/store (addform/), services/, repository/
│   └── auth/                    sessions (services/), login (repository/), role guard
├── hooks/                       use-poll, use-session
└── lib/                         config, utils, api-client, server/ (db, env, agora, http, seed)
```

`services/` run on the server (database); `repository/` are the browser-side API calls.

## Before going live

- Change the demo PINs: owner (`ADMIN_PIN`), doctors and stores (owner dashboard / `src/lib/server/seed.ts`).
- Regenerate the Agora certificate if it has been shared anywhere, and update `AGORA_APP_CERTIFICATE`.
- Check teleconsultation prescribing rules for your state with the client's medical advisor.
