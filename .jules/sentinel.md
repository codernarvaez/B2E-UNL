## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-05-24 - [Fix] Missing fallback escapes and Astro is:inline directives
**Vulnerability:** XSS vulnerabilities due to missing `esc()` around default fallback strings (like `statusLabels[c.status] ?? c.status`) or ID attributes (`data-id="${c.id}"`) when generating DOM via `.innerHTML`. Additionally, `is:inline` missing on Astro scripts using `set:html={json}`.
**Learning:** Even internal UUIDs or fallback status labels should be explicitly escaped when interpolated into `.innerHTML` to prevent injection. In Astro, JSON injection inside script blocks with `set:html` requires `is:inline` so Astro doesn't aggressively process the script contents which can lead to unescaped characters bleeding in.
**Prevention:** Always wrap all interpolated strings in an `.innerHTML` assignment with an `escapeHtml()` function. In Astro templates, ensure `<script type="application/json" set:html={data} is:inline />` is strictly enforced.
