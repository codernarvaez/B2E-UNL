/** Minutos sin actividad antes de cerrar sesión automáticamente */
const idleMinutes = Number(import.meta.env.PUBLIC_SESSION_IDLE_MINUTES ?? "30");

/** Minutos antes del vencimiento del JWT para mostrar aviso */
const warnBeforeMinutes = Number(import.meta.env.PUBLIC_SESSION_WARN_MINUTES ?? "5");

export const SESSION_IDLE_MS = Math.max(5, idleMinutes) * 60 * 1000;
export const SESSION_WARN_BEFORE_MS = Math.max(1, warnBeforeMinutes) * 60 * 1000;

/** Intervalo de comprobación del estado de sesión (ms) */
export const SESSION_CHECK_INTERVAL_MS = 30_000;

export const SESSION_LAST_ACTIVITY_KEY = "b2e_session_last_activity";
export const SESSION_STARTED_KEY = "b2e_session_started_at";
