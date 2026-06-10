## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-05-18 - [XSS] Missing HTML Escaping in Astro Islands
**Vulnerability:** Several front-end Astro island components (`AdminPanel.ts`, `CompanyChallengeForm.ts`, `CompanyChallengeManage.ts`) assigned unescaped dynamic variables (such as UUIDs, status variables, role names, and fallback variables) directly to `container.innerHTML`. This presents a Cross-Site Scripting (XSS) vulnerability if any of those variables can be maliciously crafted.
**Learning:** Even internal identifiers or fallback values must be sanitized when constructing HTML strings manually via `.innerHTML`. A single missed variable interpolation breaks defense in depth.
**Prevention:** All string interpolations `${var}` within template literals assigned to `.innerHTML` must be wrapped in an escaping utility (e.g., `escapeHtml(var)` or `esc(var)`), without exceptions.
