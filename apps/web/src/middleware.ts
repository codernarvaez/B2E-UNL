import { defineMiddleware } from "astro:middleware";
import { isSessionExpired } from "@/lib/auth/session-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PROTECTED_PREFIXES = ["/dashboard", "/auth/completar-empresa"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return next();
  }

  const supabase = createSupabaseServerClient(cookies);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (isSessionExpired(session)) {
    await supabase.auth.signOut();
    return redirect(
      `/auth/login?redirect=${encodeURIComponent(pathname)}&reason=session_expired`,
    );
  }

  return next();
});
