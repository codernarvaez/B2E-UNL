## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-07-04 - [Unescaped dynamic fallbacks and HTML attributes in Astro Islands]
**Vulnerability:** XSS vulnerability where dynamic attributes (e.g. `data-id="${c.id}"`) and string fallbacks (e.g. `roleLabels[u.role] ?? u.role`) injected via `.innerHTML` in Astro islands were not wrapped in escape functions.
**Learning:** Developers often remember to escape the primary user input but forget to escape dynamic fallbacks or the HTML attributes themselves. If an unexpected or malicious object circumvents strict typing or validation, it could exploit these unescaped segments when injected into the DOM.
**Prevention:** Ensure *all* dynamic content injected via `.innerHTML` in Astro islands is wrapped in the `esc()` or `escapeHtml()` utility, including attribute values and string fallbacks.
