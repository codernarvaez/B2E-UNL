## 2026-05-29 - Prevent Information Leakage in JWT Verification

**Vulnerability:** The API returned specific backend infrastructure details ("Supabase Auth" and internal HTTP status codes) to unauthenticated users when JWT verification via the fallback service failed. This is a form of information leakage.
**Learning:** Exception handling paths, particularly those related to authentication and upstream services, must be carefully reviewed to ensure they fail securely and emit generic error messages to the client.
**Prevention:** Avoid embedding internal error states or dependency names (like Supabase Auth, database errors, etc.) in user-facing HTTP response details.
