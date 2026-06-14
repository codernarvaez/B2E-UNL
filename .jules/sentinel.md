## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-05-23 - [Fix] Escape dynamic fallback text in HTML islands
**Vulnerability:** XSS vulnerability in Astro islands using `.innerHTML` to insert fallback values that are not wrapped with escaping functions. Even fallback text or lookup mappings like `statusLabels[c.status] ?? c.status` can be vulnerable if `c.status` is directly derived from user input or modified.
**Learning:** All dynamically constructed inputs embedded via `.innerHTML`, even if they are fallback values or mappings expected to be safe, should be wrapped with an escaping function (like `esc()`) as a defense-in-depth measure to prevent XSS.
**Prevention:** Always wrap any dynamic variable with the `esc()` or `escapeHtml()` utility functions before injecting them via `.innerHTML` assignments in frontend code.
