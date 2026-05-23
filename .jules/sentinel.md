## 2025-05-21 - [Escape Single Quotes in HTML Content]
**Vulnerability:** The HTML escape functions `esc` and `escapeHtml` in the frontend code (`apps/web/src/islands/AdminPanel.ts`, `apps/web/src/islands/CompanyChallengeManage.ts`, `apps/web/src/islands/CompanyChallengeForm.ts`) were only escaping `&`, `<`, `>`, and `"`. This left single quotes (`'`) unescaped, which can be an XSS vulnerability when user input is injected into an attribute that uses single quotes.
**Learning:** Even if it seems that single quotes are not used for attributes in the current templates, escaping them is a standard defense-in-depth practice.
**Prevention:** Update HTML escape functions to also escape single quotes as `&#39;`.
## 2025-05-23 - [Escape JSON Injected in Script Tags]
**Vulnerability:** XSS vulnerability when directly embedding JSON data (like `adminJson` or `sessionBootstrapJson`) inside a `<script>` tag using `set:html={json}`. An attacker might include a `</script>` string within the data, prematurely terminating the script block and executing subsequent malicious markup.
**Learning:** Always escape sensitive HTML characters in serialized JSON before injecting it directly into script tags on the server.
**Prevention:** Apply `.replace(/</g, "\u003c")` to the `JSON.stringify()` output before rendering it with `set:html` in Astro templates.
