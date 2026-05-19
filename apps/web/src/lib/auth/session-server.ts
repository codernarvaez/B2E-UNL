import type { Session } from "@supabase/supabase-js";
import { getJwtExpiresAtMs, isJwtExpired } from "@/lib/auth/jwt";

export interface ServerSessionInfo {
  email: string;
  expiresAtMs: number | null;
  jwtExpiresAtMs: number | null;
}

export function getServerSessionInfo(session: Session): ServerSessionInfo {
  const jwtExpiresAtMs = session.access_token
    ? getJwtExpiresAtMs(session.access_token)
    : null;
  const expiresAtMs = session.expires_at ? session.expires_at * 1000 : jwtExpiresAtMs;

  return {
    email: session.user.email ?? "Usuario",
    expiresAtMs,
    jwtExpiresAtMs,
  };
}

export function isSessionExpired(session: Session): boolean {
  if (session.access_token && isJwtExpired(session.access_token)) {
    return true;
  }
  if (session.expires_at && Date.now() >= session.expires_at * 1000) {
    return true;
  }
  return false;
}
