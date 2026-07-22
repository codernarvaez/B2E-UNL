## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2026-06-05 - [High] Incomplete Output Escaping in Template Literals and Astro script tags
**Vulnerability:** XSS and script processing risks due to dynamic variables injected via `.innerHTML` without escaping (e.g. `c.id`, `u.role`), and `set:html` JSON scripts lacking `is:inline` in Astro.
**Learning:** Even non-user-generated fields like enums (role, status) or IDs should be consistently escaped when directly injected via `.innerHTML` to follow defense-in-depth and ensure robust XSS protection. Additionally, Astro will incorrectly process `<script type="application/json">` tags using `set:html` unless explicitly told to ignore them with `is:inline`.
**Prevention:** Consistently use the utility functions `esc()` or `escapeHtml()` for ANY dynamic interpolation inside template strings passed to `.innerHTML`. Always add `is:inline` when passing raw JSON to script tags via `set:html` in Astro templates.
