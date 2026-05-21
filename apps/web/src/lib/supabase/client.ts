import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: online,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}
