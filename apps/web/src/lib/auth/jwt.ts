/** Claims mínimos del JWT de Supabase (access_token) */
export interface JwtPayload {
  exp?: number;
  sub?: string;
  email?: string;
  role?: string;
}

/** Decodifica el payload del JWT sin verificar firma (solo lectura de exp en cliente). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = globalThis.atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Fecha de expiración del JWT en milisegundos (UTC). */
export function getJwtExpiresAtMs(accessToken: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isJwtExpired(accessToken: string, skewMs = 0): boolean {
  const exp = getJwtExpiresAtMs(accessToken);
  if (exp === null) return false;
  return Date.now() >= exp - skewMs;
}
