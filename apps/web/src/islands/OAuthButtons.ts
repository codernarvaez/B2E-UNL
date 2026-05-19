import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getOAuthRedirectUrl,
  setOAuthIntent,
  type OAuthIntent,
} from "@/lib/auth/oauth";

export function initOAuthButtons(root: HTMLElement) {
  const intent = (root.dataset.intent as OAuthIntent) || "login";
  const errorEl = root.querySelector<HTMLElement>("[data-oauth-error]");

  root.querySelectorAll<HTMLButtonElement>("[data-provider]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.provider as "google" | "github";
      if (!provider) return;

      errorEl?.classList.add("hidden");
      btn.disabled = true;

      setOAuthIntent(intent);
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(intent),
        },
      });

      if (error) {
        btn.disabled = false;
        if (errorEl) {
          errorEl.textContent = error.message;
          errorEl.classList.remove("hidden");
        }
      }
    });
  });
}
