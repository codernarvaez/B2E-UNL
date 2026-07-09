## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.
## 2025-02-14 - Fix DOM-based XSS in Astro Islands
**Vulnerability:** Dynamic variables were injected directly into `.innerHTML` assignments in frontend components without being escaped.
**Learning:** Bypassing standard templating (e.g., using `innerHTML` instead of textContent or a virtual DOM) requires explicit escaping of all user-controlled data to prevent script injection.
**Prevention:** Always wrap variables with `escapeHtml()` or `esc()` functions before inserting them into HTML string templates meant for `.innerHTML`.
## 2025-05-22 - Fix Astro Build Error `applyPolyfills is not exported`
**Vulnerability:** Not a vulnerability, but a critical build failure breaking CI/CD pipelines. The build fails due to `applyPolyfills` not being exported from `astro/app/node`.
**Learning:** This is a known incompatibility/bug between `@astrojs/node` and newer versions of `astro`. When updating dependencies is not an option (due to constraints or breaking changes), an inline Vite plugin can be used to inject the missing export and bypass the error.
**Prevention:** In `astro.config.mjs`, create a custom Vite plugin that intercepts `astro/dist/core/app/entrypoints/node.js` and appends `export const applyPolyfills = () => {};` to the code during the build process.
