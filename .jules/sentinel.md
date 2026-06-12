## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2026-06-12 - [Fix XSS in innerHTML assignments and Astro Inline Scripts]
**Vulnerability:** Unescaped template variables in `.innerHTML` assignments within client-side islands could lead to Stored XSS. Specifically, fallback variables (e.g., `?? u.role`) and HTML attributes (`data-id="${c.id}"`) were injected directly into the DOM.
**Learning:** Astro compiler requires `is:inline` on `<script>` tags that use `set:html` to bypass processing warnings/errors. Furthermore, all dynamic variables injected via `innerHTML` must be escaped regardless of source or location in the markup.
**Prevention:** Use `esc()` or `escapeHtml()` uniformly on all injected strings. Add `is:inline` directive to Astro inline script templates rendering JSON.
