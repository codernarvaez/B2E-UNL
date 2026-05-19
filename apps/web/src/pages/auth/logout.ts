import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST: APIRoute = async ({ cookies, redirect, url }) => {
  const reason = url.searchParams.get("reason") ?? "logged_out";
  const supabase = createSupabaseServerClient(cookies);
  await supabase.auth.signOut();
  return redirect(`/auth/login?reason=${encodeURIComponent(reason)}`, 303);
};
