## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2026-06-13 - [Escape All Dynamic Variables in innerHTML]
**Vulnerability:** Found unescaped dynamic variables in `AdminPanel.ts` and `CompanyChallengeForm.ts` when assigning to `.innerHTML`. Variables like `c.id`, `u.role`, `u.approval_status`, and `cat.id` were injected directly into template literals, presenting XSS vulnerabilities.
**Learning:** Even internal IDs, hardcoded string lookups with fallback strings (`roleLabels[u.role] ?? u.role`), and attributes (`data-id="${c.id}"`) can be vectors for XSS if an attacker manages to manipulate the database or if the underlying data changes to include malicious payloads. All dynamic content injected into `.innerHTML` must be escaped.
**Prevention:** Always use an escaping function (like `esc()` or `escapeHtml()`) for ALL dynamic variables injected via `.innerHTML`, including HTML attributes and fallback strings.
