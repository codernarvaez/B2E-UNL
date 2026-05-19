import {
  SESSION_LAST_ACTIVITY_KEY,
  SESSION_STARTED_KEY,
} from "@/lib/auth/session-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function initLoginForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form");
  const emailInput = root.querySelector<HTMLInputElement>("#email");
  const passwordInput = root.querySelector<HTMLInputElement>("#password");
  const errorEl = root.querySelector<HTMLElement>("[data-error]");
  const submitBtn = root.querySelector<HTMLButtonElement>("button[type=submit]");

  if (!form || !emailInput || !passwordInput || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl?.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.textContent = "Ingresando…";

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Ingresar";

    if (error) {
      if (errorEl) {
        errorEl.textContent = translateAuthError(error.message);
        errorEl.classList.remove("hidden");
      }
      return;
    }

    const now = String(Date.now());
    sessionStorage.setItem(SESSION_STARTED_KEY, now);
    sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, now);

    window.location.href = "/dashboard";
  });
}

function translateAuthError(message: string): string {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "El correo no está confirmado. Revisa tu bandeja o contacta al administrador de la plataforma.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  return message;
}
