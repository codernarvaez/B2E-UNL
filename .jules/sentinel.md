## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2026-06-11 - [Ensure complete coverage of escapeHtml in .innerHTML templates]
**Vulnerability:** Even when using `escapeHtml()` on some user input variables in `.innerHTML` string templates, XSS vulnerabilities remained because fallback values (e.g. `a ?? b`), function returns, and dynamically-inserted HTML attributes were not escaped. An attacker might be able to inject malicious code via seemingly benign variables if they are compromised or mishandled.
**Learning:** Every single dynamic interpolation `${...}` within a string passed to `.innerHTML` must be wrapped in an HTML escaping function (like `esc()` or `escapeHtml()`), regardless of whether the source is considered safe, static, or internal data.
**Prevention:** Wrap all dynamic variables in `.innerHTML` assignments with the `escapeHtml()` or `esc()` utility functions. Do this universally as defense-in-depth.
