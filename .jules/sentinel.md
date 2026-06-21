## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2025-02-20 - Unescaped Values in innerHTML Templates
**Vulnerability:** Found multiple Cross-Site Scripting (XSS) vulnerabilities where user-controlled strings, attributes (like IDs), and fallback values in ternary/nullish coalescing operators were interpolated into `.innerHTML` templates without being wrapped in an escaping function (e.g., `escapeHtml()`).
**Learning:** Even internal ID fields (`c.id`), statically matched values combined with user input, and results from utility functions (like `badgeClass()`) can pose risks or lead to invalid HTML generation if they are dynamically evaluated and bypass sanitization inside Astro islands.
**Prevention:** In client-side TS/JS files managing Astro islands, any dynamic variable injected into a `.innerHTML` template MUST be wrapped with an escaping function like `esc()` or `escapeHtml()`, especially when fallback strings are used (e.g. `esc(obj[key] ?? key)`).
