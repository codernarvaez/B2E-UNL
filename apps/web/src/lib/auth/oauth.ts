/** Flujos OAuth: login general o registro empresarial */
export type OAuthIntent = "login" | "company";

const FLOW_KEY = "b2e_oauth_intent";

export function setOAuthIntent(intent: OAuthIntent): void {
  sessionStorage.setItem(FLOW_KEY, intent);
}

export function consumeOAuthIntent(): OAuthIntent | null {
  const value = sessionStorage.getItem(FLOW_KEY);
  sessionStorage.removeItem(FLOW_KEY);
  return value === "company" || value === "login" ? value : null;
}

export function getOAuthRedirectUrl(intent: OAuthIntent): string {
  const origin = window.location.origin;
  return `${origin}/auth/callback?intent=${intent}`;
}
