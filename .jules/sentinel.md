## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2024-07-05 - [High] Fix XSS Vulnerabilities in Template Literals via innerHTML

**Vulnerability:**
Cross-Site Scripting (XSS) vulnerabilities were present in `apps/web/src/islands/AdminPanel.ts` and `apps/web/src/islands/CompanyChallengeForm.ts` because dynamic properties retrieved from the database (e.g., `c.id`, `u.role`, `u.approval_status`, `cat.id`) were injected unescaped into template literals that were subsequently rendered onto the DOM using `.innerHTML`.

**Learning:**
Even properties that seem non-malicious (like IDs, roles, or statuses) should be correctly escaped when injected via `.innerHTML`. A malicious user with database access could potentially modify these fields and execute arbitrary JavaScript.

**Prevention:**
Always wrap all dynamic variables, including attributes and supposedly "safe" fields, in the `esc()` or `escapeHtml()` utilities before using `.innerHTML` to insert template literals into the DOM.
