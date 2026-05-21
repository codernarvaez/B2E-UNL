import { defineMiddleware } from "astro:middleware";
import { isSessionExpired } from "@/lib/auth/session-server";
import { getServerSessionSafe } from "@/lib/supabase/safe-session";

const PROTECTED_PREFIXES = ["/dashboard", "/auth/completar-empresa"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return next();
  }

  const { session, offline } = await getServerSessionSafe(cookies);

  if (offline) {
    return redirect(
      `/auth/login?redirect=${encodeURIComponent(pathname)}&reason=supabase_offline`,
    );
  }

  if (!session) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (isSessionExpired(session)) {
    return redirect(
      `/auth/login?redirect=${encodeURIComponent(pathname)}&reason=session_expired`,
    );
  }

  return next();
});
