import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";

function safeSetCookie(
  cookies: AstroCookies,
  key: string,
  value: string,
  options: CookieOptions,
): void {
  try {
    cookies.set(key, value, options);
  } catch {
    /* Respuesta ya enviada: el refresh de token se maneja en el cliente. */
  }
}

function safeRemoveCookie(
  cookies: AstroCookies,
  key: string,
  options: CookieOptions,
): void {
  try {
    cookies.delete(key, options);
  } catch {
    /* Respuesta ya enviada */
  }
}

/**
 * Cliente Supabase para rutas que escriben cookies (callback, logout, formularios).
 * En layouts/páginas de solo lectura usar readSessionFromCookies().
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          safeSetCookie(cookies, key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          safeRemoveCookie(cookies, key, options);
        },
      },
    },
  );
}
