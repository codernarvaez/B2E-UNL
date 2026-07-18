## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2024-05-23 - [Fix] Incomplete HTML Escaping in .innerHTML Assignments
**Vulnerability:** XSS vulnerability in `apps/web/src/islands/AdminPanel.ts` and `apps/web/src/islands/CompanyChallengeForm.ts` where dynamic string interpolation within `.innerHTML` assignments did not escape variables inside HTML attributes or fallback strings (e.g., `data-id="${c.id}"` or `${roleLabels[u.role] ?? u.role}`).
**Learning:** When generating HTML dynamically using template literals for `.innerHTML`, every single variable injected must be escaped, including variables used as HTML attribute values, and those using logical OR/nullish coalescing for fallback values.
**Prevention:** Systematically review all `.innerHTML` assignments to ensure every `${...}` block containing dynamic data is wrapped in `esc()` or `escapeHtml()`.
