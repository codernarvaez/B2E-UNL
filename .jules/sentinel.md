## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2026-07-07 - [XSS vulnerabilities in unescaped template literals for HTML attributes and string fallbacks]
**Vulnerability:** In Astro islands where HTML is constructed via template literals and injected using `.innerHTML`, some dynamic variables like `c.id` (used in `data-id` attributes) and `statusLabels[c.status] ?? c.status` (string fallbacks) were left unescaped. This allows malicious actors to inject arbitrary scripts if these fields can be manipulated.
**Learning:** All variables injected into HTML structure, whether they are used as attribute values or plain text, must be explicitly escaped. Fallback text elements from dictionary lookups shouldn't be blindly trusted, especially if the keys come from external sources.
**Prevention:** Ensure `esc()` or `escapeHtml()` is applied to all expressions injected into `.innerHTML`, including attribute assignments and ternary/fallback outputs.
