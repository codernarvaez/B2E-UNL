## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2024-05-24 - [Astro set:html is:inline missing and innerHTML XSS]
**Vulnerability:**
- `set:html` directives in Astro without the `is:inline` directive on `<script>` tags can result in script bypassing and improper processing, potentially leading to security issues.
- `innerHTML` assignment was used with unescaped template variables (XSS risk). E.g., `data-id="${c.id}"` or fallback text strings `${roleLabels[u.role] ?? u.role}` without `esc()`.

**Learning:**
- Even structural HTML attributes or non-user fallback strings should be escaped when dynamically building HTML with `.innerHTML` because unexpected states could render unintended HTML fragments.
- Astro script tags with `set:html` require `is:inline` to safely and reliably execute injected scripts such as JSON configurations.

**Prevention:**
- Always add `is:inline` when passing JSON payloads to scripts via `set:html` in Astro templates.
- Consistently wrap *all* dynamic content within template string arrays injected to `innerHTML` using a strict HTML escaper `esc()`/`escapeHtml()`, even if the variable doesn't strictly seem like user input.
