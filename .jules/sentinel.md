## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2026-06-30 - [Escape Dynamic Variables in innerHTML Template Literals]
**Vulnerability:** Dynamic variables used within template literals assigned to `.innerHTML`, such as fallback strings (e.g., `statusLabels[status] ?? status`) and HTML attributes (e.g., `data-id="${id}"`), were not being escaped, introducing a Cross-Site Scripting (XSS) vulnerability.
**Learning:** Even variables that appear "safe" or internal should be escaped before being rendered directly into the DOM via `.innerHTML`. An attacker could potentially manipulate these variables to inject malicious HTML or scripts.
**Prevention:** Always wrap every dynamic variable or expression injected via template literals into `.innerHTML` assignments with an HTML escaping utility function (like `esc()` or `escapeHtml()`).
