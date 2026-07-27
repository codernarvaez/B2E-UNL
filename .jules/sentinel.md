## 2026-05-29 - Prevent Information Leakage in JWT Verification

**Vulnerability:** The API returned specific backend infrastructure details ("Supabase Auth" and internal HTTP status codes) to unauthenticated users when JWT verification via the fallback service failed. This is a form of information leakage.
**Learning:** Exception handling paths, particularly those related to authentication and upstream services, must be carefully reviewed to ensure they fail securely and emit generic error messages to the client.
**Prevention:** Avoid embedding internal error states or dependency names (like Supabase Auth, database errors, etc.) in user-facing HTTP response details.

## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.

## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2026-06-02 - [Fix XSS Vulnerability in Template Interpolation]
**Vulnerability:** In frontend island scripts (e.g. `AdminPanel.ts` and `CompanyChallengeForm.ts`), dynamic properties such as IDs, roles, and mapped statuses were injected directly into `.innerHTML` templates without escaping. Even if mapped labels or UUIDs seem safe, injecting them unescaped creates a Cross-Site Scripting (XSS) vulnerability, particularly if backend constraints change or an attacker finds a way to mutate those specific fields.
**Learning:** Relying on the "assumed format" of dynamic variables (like UUIDs or hardcoded role arrays) is insufficient for security. All data retrieved from external sources or the database must be escaped when written to `.innerHTML` strings as a standard defense-in-depth practice.
**Prevention:** Consistently use the existing `esc()` or `escapeHtml()` utility functions on every dynamic variable before concatenating or interpolating it into HTML structures.

## 2024-07-27 - [Information Disclosure via Exception Details in Security Core]
**Vulnerability:** Fast API `HTTPException` detail messages in `apps/api/app/core/security.py` were leaking sensitive internal details. Specifically, missing environment variables (`SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`) and internal dependencies/providers (like "Supabase Auth") were explicitly named when raising 503 and 401 exceptions during JWT fallback verification.
**Learning:** Returning highly descriptive errors can aid developers during setup, but in production, it poses an information disclosure risk. Internal implementation details (such as the auth provider being used or which configuration vars are absent) can assist attackers in reconnaissance and targeting specific vulnerabilities of the disclosed dependencies.
**Prevention:** Always use generic error messages for the `detail` parameter in HTTPExceptions (e.g., "Servicio de autenticación no disponible", "Error en configuración del servicio"). Never expose internal backend infrastructure, dependency names, or missing environment variables to the end user.
