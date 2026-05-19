import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminChallengeRow, AdminProposalRow, AdminStats } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/profile";

interface AdminData {
  stats: AdminStats;
  profiles: ProfileRow[];
  challenges: AdminChallengeRow[];
  proposals: AdminProposalRow[];
}

const roleLabels: Record<string, string> = {
  company: "Empresa",
  academic: "Académico",
  admin: "Administrador",
};

const approvalLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const statusLabels: Record<string, string> = {
  open: "Abierto",
  under_review: "En evaluación",
  in_development: "En desarrollo",
  closed: "Cerrado",
};

export function initAdminPanel(root: HTMLElement) {
  const raw = document.getElementById("admin-data")?.textContent;
  if (!raw) return;

  let data: AdminData;
  try {
    data = JSON.parse(raw) as AdminData;
  } catch {
    return;
  }

  const tabs = root.querySelectorAll<HTMLButtonElement>("[data-tab]");
  const panels = root.querySelectorAll<HTMLElement>("[data-panel]");
  const toast = root.querySelector<HTMLElement>("[data-toast]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle("border-brand-600", t.dataset.tab === id);
        t.classList.toggle("text-brand-700", t.dataset.tab === id);
        t.classList.toggle("border-transparent", t.dataset.tab !== id);
        t.classList.toggle("text-slate-500", t.dataset.tab !== id);
      });
      panels.forEach((p) => {
        p.classList.toggle("hidden", p.dataset.panel !== id);
      });
    });
  });

  root.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    const supabase = createSupabaseBrowserClient();
    btn.disabled = true;

    try {
      if (action === "approve-company") {
        const { error } = await supabase
          .from("profiles")
          .update({ approval_status: "approved" })
          .eq("id", id)
          .eq("role", "company");
        if (error) throw error;
        showToast(toast, "Empresa aprobada correctamente");
      } else if (action === "reject-company") {
        const { error } = await supabase
          .from("profiles")
          .update({ approval_status: "rejected" })
          .eq("id", id)
          .eq("role", "company");
        if (error) throw error;
        showToast(toast, "Empresa rechazada");
      } else if (action === "challenge-status") {
        const status = btn.dataset.status;
        if (!status) return;
        const publish = btn.dataset.publish === "true";
        const payload: Record<string, unknown> = { status };
        if (publish) payload.published_at = new Date().toISOString();
        const { error } = await supabase.from("challenges").update(payload).eq("id", id);
        if (error) throw error;
        showToast(toast, `Reto actualizado: ${statusLabels[status] ?? status}`);
      }
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error en la operación";
      showToast(toast, msg, true);
      btn.disabled = false;
    }
  });

  renderCompanies(root.querySelector('[data-panel="companies"]')!, data.profiles);
  renderAccounts(root.querySelector('[data-panel="accounts"]')!, data.profiles);
  renderChallenges(root.querySelector('[data-panel="challenges"]')!, data.challenges);
  renderProposals(root.querySelector('[data-panel="proposals"]')!, data.proposals);
}

function showToast(el: HTMLElement | null, message: string, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.className = `mt-4 rounded-lg p-3 text-sm ${isError ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  el.classList.remove("hidden");
}

function renderCompanies(container: HTMLElement, profiles: ProfileRow[]) {
  const list = container.querySelector("[data-list]");
  if (!list) return;
  const companies = profiles.filter((p) => p.role === "company");
  const pending = companies.filter((p) => p.approval_status === "pending");

  if (pending.length === 0) {
    list.innerHTML = `<p class="text-sm text-slate-500">No hay empresas pendientes de aprobación.</p>`;
    return;
  }

  list.innerHTML = pending
    .map(
      (c) => `
    <article class="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">${esc(c.organization_name ?? c.full_name)}</h3>
          <p class="text-sm text-slate-600">RUC: ${esc(c.tax_id ?? "—")} · ${esc(c.business_sector ?? "")}</p>
          <p class="text-sm text-slate-500">${esc(c.address ?? "")} · Tel: ${esc(c.phone ?? "")}</p>
          <p class="text-sm text-slate-500">Contacto: ${esc(c.contact_email ?? "")}</p>
        </div>
        <div class="flex gap-2">
          <button type="button" data-action="approve-company" data-id="${c.id}"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            Aprobar
          </button>
          <button type="button" data-action="reject-company" data-id="${c.id}"
            class="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            Rechazar
          </button>
        </div>
      </div>
    </article>`,
    )
    .join("");
}

function renderAccounts(container: HTMLElement, profiles: ProfileRow[]) {
  const list = container.querySelector("[data-list]");
  if (!list) return;
  list.innerHTML = profiles
    .map(
      (u) => `
    <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <div>
        <p class="font-medium">${esc(u.full_name)}</p>
        <p class="text-slate-500">${roleLabels[u.role] ?? u.role}${u.organization_name ? ` · ${esc(u.organization_name)}` : ""}</p>
      </div>
      ${u.role === "company" ? `<span class="rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(u.approval_status)}">${approvalLabels[u.approval_status] ?? u.approval_status}</span>` : ""}
    </li>`,
    )
    .join("");
}

function renderChallenges(container: HTMLElement, challenges: AdminChallengeRow[]) {
  const list = container.querySelector("[data-list]");
  if (!list) return;
  if (challenges.length === 0) {
    list.innerHTML = `<p class="text-sm text-slate-500">No hay retos registrados.</p>`;
    return;
  }
  list.innerHTML = challenges
    .map(
      (c) => `
    <article class="rounded-lg border border-slate-200 bg-white p-4">
      <h3 class="font-semibold">${esc(c.title)}</h3>
      <p class="mt-1 text-sm text-slate-500">${esc(c.organization_name ?? "—")} · ${statusLabels[c.status] ?? c.status}${c.published_at ? " · Publicado" : " · Sin publicar"}</p>
      <p class="mt-2 line-clamp-2 text-sm text-slate-600">${esc(c.description)}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" data-action="challenge-status" data-id="${c.id}" data-status="under_review"
          class="rounded border px-2 py-1 text-xs hover:bg-slate-50">En evaluación</button>
        <button type="button" data-action="challenge-status" data-id="${c.id}" data-status="in_development"
          class="rounded border px-2 py-1 text-xs hover:bg-slate-50">En desarrollo</button>
        <button type="button" data-action="challenge-status" data-id="${c.id}" data-status="open" data-publish="true"
          class="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700">Publicar</button>
        <button type="button" data-action="challenge-status" data-id="${c.id}" data-status="closed"
          class="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Cerrar</button>
      </div>
    </article>`,
    )
    .join("");
}

function renderProposals(container: HTMLElement, proposals: AdminProposalRow[]) {
  const list = container.querySelector("[data-list]");
  if (!list) return;
  if (proposals.length === 0) {
    list.innerHTML = `<p class="text-sm text-slate-500">No hay propuestas.</p>`;
    return;
  }
  list.innerHTML = proposals
    .map(
      (p) => `
    <li class="rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <p class="font-medium">${esc(p.title)}</p>
      <p class="text-slate-500">Reto: ${esc(p.challenge_title ?? "—")} · Académico: ${esc(p.academic_name)} · ${esc(p.status)}</p>
    </li>`,
    )
    .join("");
}

function badgeClass(status: string): string {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
