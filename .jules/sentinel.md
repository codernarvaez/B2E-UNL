## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-05-23 - [Prevent XSS in Data Attributes and Fallback Strings]
**Vulnerability:** In Astro islands (`apps/web/src/islands/AdminPanel.ts` and `apps/web/src/islands/CompanyChallengeForm.ts`), dynamic properties like `id`, as well as dictionary lookups/fallbacks such as `roleLabels[u.role] ?? u.role`, were embedded directly into HTML attributes (like `data-id`) and tags via `.innerHTML` without escaping. This creates a potential XSS vulnerability if IDs or unmapped keys are manipulated or somehow user-controlled.
**Learning:** All dynamically injected variables in HTML string templates, even seemingly safe ones like UUIDs or dictionary fallbacks, must be escaped using utility functions like `esc()` or `escapeHtml()` when updating the DOM via `.innerHTML`. It provides defense-in-depth against malicious injections.
**Prevention:** Always wrap all template interpolation variables (attributes, text content, fallbacks) in `.innerHTML` assignments with a robust HTML escaping function.
