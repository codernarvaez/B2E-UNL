## 2026-06-26 - [XSS via Missing Escape in Dynamic Variables & Attributes before .innerHTML]
**Vulnerability:** XSS vulnerability where dynamically interpolated values from objects (like `roleLabels[u.role] ?? u.role` and HTML attributes like `data-id="${c.id}"`) were injected directly into template literals and assigned via `.innerHTML` without using the available `esc()` utility.
**Learning:** Developers often remember to escape user-provided free-text fields (like `full_name` or `description`) but forget that all interpolated values in a string to be assigned to `.innerHTML`—including dictionary lookups, IDs, and HTML attributes—must also be wrapped in the escape utility.
**Prevention:** Every single template variable interpolation `${...}` used in a string bound for `.innerHTML` assignment must be wrapped in `esc()` or `escapeHtml()`, unless the variable represents safe, already-escaped HTML.

## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
