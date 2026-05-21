import type { Session } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

const BASE64_PREFIX = "base64-";

function supabaseAuthStorageKey(): string | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  if (!url?.startsWith("https://")) return null;
  try {
    const ref = new URL(url).hostname.split(".")[0];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}

function fromBase64URL(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  return globalThis.atob(base64 + pad);
}

function decodeStoredSession(raw: string): string {
  if (raw.startsWith(BASE64_PREFIX)) {
    return fromBase64URL(raw.slice(BASE64_PREFIX.length));
  }
  return raw;
}

function readCookieChunk(cookies: AstroCookies, name: string): string | null {
  const value = cookies.get(name)?.value;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readCombinedCookie(cookies: AstroCookies, key: string): string | null {
  const single = readCookieChunk(cookies, key);
  if (single) return single;

  const parts: string[] = [];
  for (let i = 0; ; i += 1) {
    const chunk = readCookieChunk(cookies, `${key}.${i}`);
    if (!chunk) break;
    parts.push(chunk);
  }
  return parts.length > 0 ? parts.join("") : null;
}

function parseSessionJson(decoded: string): Session | null {
  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") return null;

    if ("access_token" in parsed && "user" in parsed) {
      return parsed as Session;
    }

    if (
      "currentSession" in parsed &&
      parsed.currentSession &&
      typeof parsed.currentSession === "object"
    ) {
      return parsed.currentSession as Session;
    }

    if (
      "session" in parsed &&
      parsed.session &&
      typeof parsed.session === "object"
    ) {
      return parsed.session as Session;
    }
  } catch {
    return null;
  }
  return null;
}

/** Lee la sesión desde cookies sin instanciar el cliente Supabase (evita refresh async en SSR). */
export function readSessionFromCookies(cookies: AstroCookies): Session | null {
  const key = supabaseAuthStorageKey();
  if (!key) return null;

  const raw = readCombinedCookie(cookies, key);
  if (!raw) return null;

  return parseSessionJson(decodeStoredSession(raw));
}
