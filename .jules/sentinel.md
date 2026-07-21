## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-07-21 - Escape Dynamic Variables and Attributes in innerHTML
**Vulnerability:** Found unescaped dynamic variables and HTML attributes (e.g. data-id) inside string templates used for `.innerHTML` assignment. This could lead to Cross-Site Scripting (XSS) if the data comes from user input.
**Learning:** Even fallback strings (like `label ?? status`) and HTML attributes must be wrapped with the `escapeHtml()` or `esc()` function when writing to `.innerHTML` because standard template strings do not auto-escape values.
**Prevention:** Always wrap all variables injected into `.innerHTML` templates with an escaping function, including conditional expressions, attributes, and fallbacks.

## 2024-07-21 - Astro/Vite ERESOLVE and Build Conflict
**Vulnerability:** Upstream packages (@astrojs/node) failed to resolve peer dependencies during CI builds, resulting in `npm ci` failures. Additionally, the existing version produced a missing export bug in Vite during production builds.
**Learning:** For Astro >= 6.0 and `@astrojs/node` >= 9.0 on Node.js >= 22, it is occasionally necessary to forcefully bump Astro and its node adapter to the latest versions alongside the `--legacy-peer-deps` flag to circumvent both peer dependency resolution ERESOLVE crashes and buggy internal Vite rollups.
**Prevention:** If `npm ci` or `npm run build` consistently fail inside GitHub Actions with ERESOLVE or Rollup `applyPolyfills` missing export errors, bumping to `@astrojs/node@latest` and `astro@latest` explicitly might be required.
