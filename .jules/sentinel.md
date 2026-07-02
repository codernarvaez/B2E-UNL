## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2024-05-23 - [Critical Learning] XSS via Unescaped Variables in Astro Islands `.innerHTML`
**Vulnerability:** Cross-Site Scripting (XSS) due to unescaped dynamic variables in `.innerHTML` assignments within Astro islands (client-side scripts).
**Learning:** In Astro islands, when modifying the DOM using `.innerHTML`, all dynamic variables (including HTML attributes, class names, fallback strings like `a ?? b`, and function outputs) must be wrapped with an escape function (`esc()` or `escapeHtml()`). Relying on Astro's server-side escaping is insufficient for client-side DOM manipulations.
**Prevention:** Always wrap all dynamic variables with an escape utility function before injecting them via `.innerHTML` assignments in frontend scripts to prevent XSS vulnerabilities.
