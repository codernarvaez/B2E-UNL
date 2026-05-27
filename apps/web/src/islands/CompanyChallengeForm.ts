import {
  createChallenge,
  fetchCategories,
  fetchChallenge,
  updateChallenge,
  type ChallengeCreateBody,
} from "@/lib/api/challenges";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ChallengeSchema } from "@/lib/validation/schemas";

function showError(el: HTMLElement | null, msg: string) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError(el: HTMLElement | null) {
  el?.classList.add("hidden");
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function readForm(root: HTMLElement): ChallengeCreateBody | null {
  const get = (id: string) =>
    root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? "";

  const title = get("title");
  const description = get("description");
  const summary = get("impact_summary");
  const expected_metric = get("expected_metric");
  const metric_unit = get("metric_unit");

  const categoryIds = [
    ...root.querySelectorAll<HTMLInputElement>('input[name="category_ids"]:checked'),
  ].map((el) => el.value);

  if (categoryIds.length === 0) {
    return null;
  }

  const deadlineRaw = get("deadline");

  const baseline = get("baseline_situation");
  const success = get("success_criteria");
  const scope = get("technical_scope");

  return {
    title,
    description,
    category_ids: categoryIds,
    deadline: deadlineRaw || null,
    environmental_impact: {
      summary,
      expected_metric,
      metric_unit,
      baseline_situation: baseline || null,
      success_criteria: success || null,
      technical_scope: scope || null,
    },
  };
}

function validateBody(body: ChallengeCreateBody): string | null {
  if (body.title.length < 5) return "El título debe tener al menos 5 caracteres.";
  if (body.description.length < 20) return "La descripción debe tener al menos 20 caracteres.";
  if (body.environmental_impact.summary.length < 10) {
    return "El resumen de impacto debe tener al menos 10 caracteres.";
  }
  if (!body.environmental_impact.expected_metric) return "Indica la métrica objetivo.";
  if (!body.environmental_impact.metric_unit) return "Indica la unidad de la métrica.";
  return null;
}

async function renderCategories(root: HTMLElement, selectedIds: Set<string>) {
  const container = root.querySelector("#category-list");
  if (!container) return;

  try {
    const categories = await fetchCategories();
    container.removeAttribute("data-categories-loading");
    container.innerHTML = categories
      .map(
        (cat) => `
        <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-brand-300">
          <input type="checkbox" name="category_ids" value="${cat.id}" class="mt-1"
            ${selectedIds.has(cat.id) ? "checked" : ""} />
          <span>
            <span class="font-medium text-slate-800">${escapeHtml(cat.name_es)}</span>
            ${cat.description_es ? `<span class="mt-0.5 block text-xs text-slate-500">${escapeHtml(cat.description_es)}</span>` : ""}
          </span>
        </label>`,
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err instanceof Error ? err.message : "Error al cargar categorías")}</p>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillForm(root: HTMLElement, challenge: Awaited<ReturnType<typeof fetchChallenge>>) {
  const set = (id: string, value: string) => {
    const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`);
    if (el) el.value = value;
  };

  set("title", challenge.title);
  set("description", challenge.description);
  set("impact_summary", challenge.environmental_impact.summary ?? "");
  set("expected_metric", challenge.environmental_impact.expected_metric ?? "");
  set("metric_unit", challenge.environmental_impact.metric_unit ?? "");
  set("baseline_situation", challenge.environmental_impact.baseline_situation ?? "");
  set("success_criteria", challenge.environmental_impact.success_criteria ?? "");
  set("technical_scope", challenge.environmental_impact.technical_scope ?? "");
  if (challenge.deadline) set("deadline", challenge.deadline.slice(0, 10));

  const selected = new Set(challenge.categories.map((c) => c.id));
  void renderCategories(root, selected);
}

export function initCompanyChallengeForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form");
  const errorEl = root.querySelector<HTMLElement>("[data-error]");
  const submitBtn = root.querySelector<HTMLButtonElement>("button[type=submit]");
  const mode = root.dataset.mode === "edit" ? "edit" : "create";
  const challengeId = root.dataset.challengeId?.trim() ?? "";

  if (!form || !submitBtn) return;

  if (mode === "edit" && challengeId) {
    submitBtn.textContent = "Guardar cambios";
    void (async () => {
      const token = await getAccessToken();
      if (!token) {
        window.location.href = `/auth/login?redirect=/dashboard/empresa/${challengeId}`;
        return;
      }
      try {
        const challenge = await fetchChallenge(token, challengeId);
        fillForm(root, challenge);
      } catch (err) {
        showError(errorEl, err instanceof Error ? err.message : "No se pudo cargar el reto");
      }
    })();
  } else {
    void renderCategories(root, new Set());
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError(errorEl);

    const body = readForm(root);
    if (!body) {
      showError(errorEl, "Selecciona al menos una categoría de sustentabilidad.");
      return;
    }

    const validation = validateBody(body);
    if (validation) {
      showError(errorEl, validation);
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      window.location.href = "/auth/login?redirect=/dashboard/empresa";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando…";

    try {
      if (mode === "edit" && challengeId) {
        await updateChallenge(token, challengeId, body);
        window.location.href = `/dashboard/empresa/${challengeId}?saved=1`;
      } else {
        const created = await createChallenge(token, body);
        window.location.href = `/dashboard/empresa/${created.id}?created=1`;
      }
    } catch (err) {
      showError(errorEl, err instanceof Error ? err.message : "Error al guardar");
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "edit" ? "Guardar cambios" : "Guardar borrador";
    }
  });
}
