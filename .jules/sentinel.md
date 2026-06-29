## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-05-22 - [Fix] XSS Risks in Vanilla JS Islands via Unescaped innerHTML Assignments
**Vulnerability:** XSS vulnerability where Astro properties, fallbacks, or attributes passed through template strings inside vanilla JavaScript `.innerHTML` assignments were not correctly escaped. Unescaped data allows attackers to inject malicious HTML or break out of properties and execute arbitrary code.
**Learning:** Even internal variables, seemingly static fallback values, or template string interpolations in DOM manipulation (like `element.innerHTML = ...`) must be wrapped in HTML escaping functions to prevent XSS payloads from rendering executable code.
**Prevention:** Wrap all dynamic variables and interpolation properties inside JS templates injected via `.innerHTML` using utilities like `esc()` or `escapeHtml()`.
