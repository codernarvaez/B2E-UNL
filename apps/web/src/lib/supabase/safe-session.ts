import type { Session } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import { readSessionFromCookies } from "@/lib/supabase/cookie-session";

export interface SafeSessionResult {
  session: Session | null;
  offline: boolean;
  errorMessage: string | null;
}

function isNetworkFailure(message: string): boolean {
  const blob = message.toLowerCase();
  return (
    blob.includes("fetch failed") ||
    blob.includes("eai_again") ||
    blob.includes("enotfound") ||
    blob.includes("network") ||
    blob.includes("getaddrinfo")
  );
}

async function probeSupabaseReachable(
  url: string,
  anonKey: string,
): Promise<{ ok: boolean; message: string | null }> {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: { apikey: anonKey },
    });
    if (res.ok || res.status === 401 || res.status === 404) {
      return { ok: true, message: null };
    }
    return { ok: false, message: `Supabase respondió HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

/** Lee sesión desde cookies sin cliente auth (no dispara refresh ni escritura tardía de cookies). */
export async function getServerSessionSafe(
  cookies: AstroCookies,
): Promise<SafeSessionResult> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.startsWith("https://") || !key || key === "your-anon-key") {
    return {
      session: null,
      offline: true,
      errorMessage:
        "Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en el .env de la raíz del monorepo.",
    };
  }

  const session = readSessionFromCookies(cookies);

  const { ok, message } = await probeSupabaseReachable(url, key);
  if (!ok && message) {
    return {
      session,
      offline: isNetworkFailure(message),
      errorMessage: message,
    };
  }

  return { session, offline: false, errorMessage: null };
}
