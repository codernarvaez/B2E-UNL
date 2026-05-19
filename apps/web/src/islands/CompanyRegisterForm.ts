import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function initCompanyRegisterForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form");
  const errorEl = root.querySelector<HTMLElement>("[data-error]");
  const successEl = root.querySelector<HTMLElement>("[data-success]");
  const submitBtn = root.querySelector<HTMLButtonElement>("button[type=submit]");

  if (!form || !submitBtn) return;

  const get = (id: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl?.classList.add("hidden");
    successEl?.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando…";

    const email = get("email");
    const password = get("password");
    const passwordConfirm = get("password_confirm");

    if (password.length < 8) {
      showError(errorEl, "La contraseña debe tener al menos 8 caracteres.");
      resetBtn(submitBtn);
      return;
    }

    if (password !== passwordConfirm) {
      showError(errorEl, "Las contraseñas no coinciden.");
      resetBtn(submitBtn);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          registration_type: "company",
          full_name: get("full_name"),
          organization_name: get("organization_name"),
          tax_id: get("tax_id"),
          phone: get("phone"),
          address: get("address"),
          website: get("website"),
          business_sector: get("business_sector"),
          contact_email: get("contact_email") || email,
        },
      },
    });

    resetBtn(submitBtn);

    if (error) {
      showError(errorEl, translateAuthError(error.message));
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard/empresa";
      return;
    }

    if (successEl) {
      successEl.textContent =
        "Empresa registrada. Revisa tu correo si se requiere confirmación, o inicia sesión.";
      successEl.classList.remove("hidden");
    }
    form.reset();
  });
}

function showError(el: HTMLElement | null, message: string) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function resetBtn(btn: HTMLButtonElement) {
  btn.disabled = false;
  btn.textContent = "Registrar empresa";
}

function translateAuthError(message: string): string {
  if (message.includes("already registered")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Registro recibido. Confirma tu correo antes de iniciar sesión (revisa tu bandeja).";
  }
  if (message.includes("Password")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  return message;
}
