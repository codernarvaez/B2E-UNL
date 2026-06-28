## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-05-23 - [Fix] Escape fallback values in template literals assigned to innerHTML
**Vulnerability:** XSS vulnerability due to unescaped fallback values in template literals assigned to `innerHTML`. For example, using `${labels[key] ?? key}` where `key` is unescaped user input (e.g., `u.role` or `c.status`) can allow arbitrary script execution if the key is not found in the dictionary and defaults to the raw input.
**Learning:** All dynamic values, including dictionary fallbacks (`obj[key] ?? key`) and primary keys (`c.id`), must be explicitly passed through an escape function (like `esc()` or `escapeHtml()`) before being injected into the DOM via `.innerHTML`, even if they are expected to only contain safe data types like UUIDs or known role strings.
**Prevention:** Always wrap all variables (including fallbacks) with `esc()` or `escapeHtml()` when constructing HTML strings for `.innerHTML` assignments in frontend islands.
