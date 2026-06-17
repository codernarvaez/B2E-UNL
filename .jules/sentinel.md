## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-05-24 - [Fix] Escape all dynamic variables inside `.innerHTML` strings in Astro islands
**Vulnerability:** XSS vulnerability due to unescaped fallback strings (e.g. `a ?? b`) and values used in HTML attributes inside template literals passed to `.innerHTML` in Astro islands (e.g. `AdminPanel.ts`, `CompanyChallengeForm.ts`).
**Learning:** Even if it seems a variable might only contain a fallback string or a UUID, it must be escaped if it goes into the DOM to enforce defense in depth and prevent regressions. All dynamic inputs within `.innerHTML` string assignments must be sanitized.
**Prevention:** Always wrap all dynamic variables with the `esc()` or `escapeHtml()` utility functions before injecting them via `.innerHTML` assignments to prevent Cross-Site Scripting (XSS) vulnerabilities.
