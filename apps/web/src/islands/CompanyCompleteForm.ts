import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function initCompanyCompleteForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form");
  const errorEl = root.querySelector<HTMLElement>("[data-error]");
  const submitBtn = root.querySelector<HTMLButtonElement>("button[type=submit]");

  if (!form || !submitBtn) return;

  const get = (id: string) =>
    root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl?.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando…";

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/auth/login?redirect=/auth/completar-empresa";
      return;
    }

    const contactEmail = get("contact_email") || session.user.email || "";

    const { error } = await supabase.rpc("register_company_profile", {
      p_full_name: get("full_name"),
      p_organization_name: get("organization_name"),
      p_tax_id: get("tax_id"),
      p_phone: get("phone"),
      p_address: get("address"),
      p_website: get("website") || null,
      p_business_sector: get("business_sector"),
      p_contact_email: contactEmail,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Completar registro";

    if (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.remove("hidden");
      }
      return;
    }

    window.location.href = "/dashboard/empresa";
  });
}
