## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2024-05-22 - [Fix] Escape JSON.stringify output inside set:html
**Vulnerability:** XSS vulnerability due to embedding `JSON.stringify` directly in `<script>` tags using `set:html` in Astro components without escaping characters.
**Learning:** Browsers process `</script>` tags directly even if they are within a JavaScript string / JSON content, ending the script execution context prematurely and executing whatever follows. This allows executing arbitrary injected javascript.
**Prevention:** Use `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")` whenever writing `JSON.stringify` results to inline script tags in HTML to prevent XSS breakout.

## 2024-07-16 - Prevent XSS via Unescaped Variables in innerHTML Fallback Strings and Attributes
**Vulnerability:** Dynamic variables used as HTML attributes (like IDs) and fallback strings (e.g., `a ?? b`) inside string literals assigned to `.innerHTML` were unescaped, allowing for potential Cross-Site Scripting (XSS) if the data source contains malicious payloads.
**Learning:** Even when the primary value is escaped or looks safe (like an ID), all dynamic inputs directly injected into `.innerHTML` must be escaped. Fallback strings are particularly susceptible because the default or fallback value is often assumed to be safe but could be derived from user input or database records.
**Prevention:** Always wrap all dynamic variables, including HTML attributes and fallback strings, with an escaping utility function (e.g., `esc()` or `escapeHtml()`) before injecting them via `.innerHTML` assignments to prevent XSS vulnerabilities.
