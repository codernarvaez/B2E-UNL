## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.

## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-05-30 - Fix set:html warning and XSS risk with is:inline
**Vulnerability:** While Astro normally escapes variables, `set:html` directly injects unsanitized strings as HTML. When used on a `<script>` tag *without* the `is:inline` directive, it also attempts to evaluate it using internal component bundle logic or issues warnings about unavailable features since it hasn't processed the script content.
**Learning:** For scripts that you intentionally render raw JSON into using `set:html`, you must pair it with `is:inline` so Astro properly bypasses its own processing and correctly emits the raw `<script>` tag.
**Prevention:** Whenever generating inline data scripts (like JSON payloads for islands), always use `<script type="application/json" set:html={data} is:inline />` to avoid bundling/processing warnings and to ensure proper execution contexts.
