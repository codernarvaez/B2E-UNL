## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-05-22 - [Escape Variable Fallbacks and Missing Attributes in HTML]
**Vulnerability:** XSS vulnerability where previously unescaped attributes (e.g. `c.id` inside a button `data-id` attribute) and fallback variable usages (e.g. `roleLabels[u.role] ?? u.role`) in Astro islands using `.innerHTML` allowed for potential HTML injection if the string variables or keys were manipulated.
**Learning:** All dynamically rendered inputs, even variables providing a fallback via logical operators (like `a ?? b`) and values destined for attributes must be strictly escaped to prevent XSS.
**Prevention:** Wrap all dynamic variables, including HTML attributes and fallback strings, with the `esc()` or `escapeHtml()` utility functions before injecting them via `.innerHTML` assignments.
