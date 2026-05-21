import {
  fetchChallenge,
  fetchProposalsForChallenge,
  publishChallenge,
  updateChallengeStatus,
  type ChallengeMine,
} from "@/lib/api/challenges";
import {
  challengeStatusHelp,
  challengeStatusLabels,
  publicationLabel,
} from "@/lib/challenges/labels";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUS_TRANSITIONS: Record<string, { status: string; label: string; publish?: boolean }[]> = {
  open: [
    { status: "under_review", label: "Pasar a evaluación" },
    { status: "closed", label: "Cerrar reto" },
  ],
  under_review: [
    { status: "in_development", label: "En desarrollo" },
    { status: "open", label: "Volver a abierto" },
    { status: "closed", label: "Cerrar reto" },
  ],
  in_development: [
    { status: "under_review", label: "Volver a evaluación" },
    { status: "closed", label: "Cerrar reto" },
  ],
  closed: [],
};

const proposalStatusLabels: Record<string, string> = {
  draft: "Borrador",
  submitted: "Enviada",
  under_review: "En revisión",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await createSupabaseBrowserClient().auth.getSession();
  return session?.access_token ?? null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderChallengeMeta(root: HTMLElement, challenge: ChallengeMine) {
  root.querySelector("[data-status-label]")!.textContent =
    challengeStatusLabels[challenge.status] ?? challenge.status;
  const help = root.querySelector("[data-status-help]");
  if (help) {
    help.textContent = challengeStatusHelp[challenge.status] ?? "";
  }
  root.querySelector("[data-publication-label]")!.textContent = publicationLabel(
    challenge.published_at,
  );
  root.querySelector("[data-created-at]")!.textContent = formatDate(challenge.created_at);
  root.querySelector("[data-updated-at]")!.textContent = formatDate(challenge.updated_at);
}

function renderActions(
  root: HTMLElement,
  challenge: ChallengeMine,
  onAction: (ev: Event) => void,
) {
  const container = root.querySelector("[data-actions]");
  if (!container) return;
  container.innerHTML = "";

  if (!challenge.published_at) {
    const pub = document.createElement("button");
    pub.type = "button";
    pub.className =
      "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700";
    pub.textContent = "Publicar en tablero";
    pub.dataset.action = "publish";
    pub.addEventListener("click", (ev) => void onAction(ev));
    container.appendChild(pub);
  }

  const transitions = STATUS_TRANSITIONS[challenge.status] ?? [];
  for (const t of transitions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
    btn.textContent = t.label;
    btn.dataset.action = "status";
    btn.dataset.status = t.status;
    btn.addEventListener("click", (ev) => void onAction(ev));
    container.appendChild(btn);
  }
}

function renderProposals(root: HTMLElement, proposals: Awaited<ReturnType<typeof fetchProposalsForChallenge>>) {
  const list = root.querySelector("[data-proposals-list]");
  if (!list) return;

  if (proposals.length === 0) {
    list.innerHTML = `<li class="text-sm text-slate-500">Aún no hay propuestas para este reto.</li>`;
    return;
  }

  list.innerHTML = proposals
    .map(
      (p) => `
      <li class="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p class="font-medium text-slate-800">${escapeHtml(p.title)}</p>
        <p class="mt-1 text-xs text-slate-500">
          ${escapeHtml(proposalStatusLabels[p.status] ?? p.status)} · ${formatDate(p.created_at)}
        </p>
      </li>`,
    )
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function initCompanyChallengeManage(root: HTMLElement) {
  const challengeId = root.dataset.challengeId?.trim() ?? "";
  const errorEl = root.querySelector<HTMLElement>("[data-action-error]");
  let current: ChallengeMine | null = null;

  const reload = async () => {
    const token = await getAccessToken();
    if (!token) {
      window.location.href = `/auth/login?redirect=/dashboard/empresa/${challengeId}`;
      return;
    }
    current = await fetchChallenge(token, challengeId);
    renderChallengeMeta(root, current);
    renderActions(root, current, handleAction);

    const proposals = await fetchProposalsForChallenge(token, challengeId);
    renderProposals(root, proposals);
  };

  const handleAction = async (ev?: Event) => {
    const target = ev?.target as HTMLButtonElement | undefined;
    const action = target?.dataset.action;
    if (!current || !action) return;

    const token = await getAccessToken();
    if (!token) return;

    errorEl?.classList.add("hidden");
    if (target) target.disabled = true;

    try {
      if (action === "publish") {
        current = await publishChallenge(token, challengeId);
      } else if (action === "status" && target?.dataset.status) {
        current = await updateChallengeStatus(token, challengeId, target.dataset.status);
      }
      renderChallengeMeta(root, current);
      renderActions(root, current, handleAction);
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err instanceof Error ? err.message : "Error en la acción";
        errorEl.classList.remove("hidden");
      }
    } finally {
      if (target) target.disabled = false;
    }
  };

  void reload();
}
