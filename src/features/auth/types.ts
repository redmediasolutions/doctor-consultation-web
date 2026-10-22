/** Staff roles. "staff" = pharmacy counter of one store. */
export type Role = "doctor" | "staff" | "admin";

export interface Session {
  role: Role;
  /** doctorId, storeId or "admin" */
  subject: string;
}

export interface LoginResult<P = unknown> {
  token: string;
  profile: P;
}
