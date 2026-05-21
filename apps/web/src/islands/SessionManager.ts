import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getJwtExpiresAtMs } from "@/lib/auth/jwt";
import {
  SESSION_CHECK_INTERVAL_MS,
  SESSION_IDLE_MS,
  SESSION_LAST_ACTIVITY_KEY,
  SESSION_STARTED_KEY,
  SESSION_WARN_BEFORE_MS,
} from "@/lib/auth/session-config";

export interface SessionBootstrap {
  email: string;
  expiresAtMs: number | null;
  jwtExpiresAtMs: number | null;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min} min ${sec}s`;
  return `${sec}s`;
}

async function performLogout(reason: string) {
  sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
  sessionStorage.removeItem(SESSION_STARTED_KEY);
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = `/auth/login?reason=${encodeURIComponent(reason)}`;
}

export function initSessionManager(bootstrap: SessionBootstrap) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }

  const banner = document.getElementById("session-expiry-banner");
  const messageEl = banner?.querySelector<HTMLElement>("[data-session-message]");
  const extendBtn = banner?.querySelector<HTMLButtonElement>("[data-session-extend]");
  const logoutBtn = banner?.querySelector<HTMLButtonElement>("[data-session-logout]");
  const dismissBtn = banner?.querySelector<HTMLButtonElement>("[data-session-dismiss]");

  let warned = false;
  let checkTimer: ReturnType<typeof setInterval> | null = null;

  const touchActivity = () => {
    sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  };

  if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
    sessionStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
  }
  touchActivity();

  const activityEvents: (keyof WindowEventMap)[] = [
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
  ];
  activityEvents.forEach((ev) => {
    window.addEventListener(ev, touchActivity, { passive: true });
  });

  const getIdleRemainingMs = (): number => {
    const last = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY) ?? Date.now());
    return SESSION_IDLE_MS - (Date.now() - last);
  };

  const getJwtRemainingMs = async (): Promise<number | null> => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return bootstrap.jwtExpiresAtMs
        ? bootstrap.jwtExpiresAtMs - Date.now()
        : bootstrap.expiresAtMs
          ? bootstrap.expiresAtMs - Date.now()
          : null;
    }
    const exp = getJwtExpiresAtMs(session.access_token) ?? bootstrap.jwtExpiresAtMs;
    return exp ? exp - Date.now() : null;
  };

  const hideBanner = () => {
    banner?.classList.add("hidden");
    warned = false;
  };

  const showBanner = (message: string) => {
    if (!banner || !messageEl) return;
    messageEl.textContent = message;
    banner.classList.remove("hidden");
    warned = true;
  };

  const evaluateSession = async () => {
    const idleRemaining = getIdleRemainingMs();

    if (idleRemaining <= 0) {
      await performLogout("idle_timeout");
      return;
    }

    const jwtRemaining = await getJwtRemainingMs();
    const effectiveRemaining =
      jwtRemaining !== null ? Math.min(idleRemaining, jwtRemaining) : idleRemaining;

    if (effectiveRemaining <= 0) {
      await performLogout("session_expired");
      return;
    }

    if (effectiveRemaining <= SESSION_WARN_BEFORE_MS) {
      const label =
        jwtRemaining !== null && jwtRemaining <= idleRemaining
          ? "Tu token de sesión (JWT) vencerá en"
          : "Tu sesión por inactividad terminará en";
      showBanner(
        `${label} ${formatRemaining(effectiveRemaining)}. Extiende la sesión o cierra sesión.`,
      );
    } else if (warned) {
      hideBanner();
    }
  };

  extendBtn?.addEventListener("click", async () => {
    extendBtn.disabled = true;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.refreshSession();
    extendBtn.disabled = false;

    if (error) {
      if (messageEl) {
        messageEl.textContent = `No se pudo renovar la sesión: ${error.message}`;
      }
      return;
    }

    touchActivity();
    hideBanner();
    await evaluateSession();
  });

  logoutBtn?.addEventListener("click", () => {
    const form = document.getElementById("header-logout-form") as HTMLFormElement | null;
    form?.requestSubmit();
  });

  dismissBtn?.addEventListener("click", () => {
    hideBanner();
  });

  checkTimer = setInterval(() => {
    void evaluateSession();
  }, SESSION_CHECK_INTERVAL_MS);

  void evaluateSession();

  window.addEventListener("beforeunload", () => {
    if (checkTimer) clearInterval(checkTimer);
  });
}
