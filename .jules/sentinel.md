## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2024-06-09 - [Fix] Unescaped dynamic variables in .innerHTML assignments
**Vulnerability:** XSS vulnerability due to embedding unescaped dynamic variables (e.g. `c.id` or `roleLabels[u.role] ?? u.role`) into `.innerHTML` assignments in Astro island scripts (`AdminPanel.ts`, `CompanyChallengeForm.ts`). Even dynamic IDs or fallbacks could be an avenue for XSS if they can be influenced by users.
**Learning:** All string interpolations embedded into an HTML string assigned to `.innerHTML` must be properly escaped using HTML entities, regardless of whether they are HTML content, HTML attributes, or default fallbacks.
**Prevention:** Wrap all dynamic variables (including HTML attributes and fallback strings like `a ?? b`) with the `esc()` or `escapeHtml()` utility functions before injecting them via `.innerHTML` assignments.
