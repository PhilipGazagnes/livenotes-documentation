# ADR-016: Offline startup uses the last signed-in user

- **Status:** Accepted (implemented on `feat/monorepo-offline`)
- **Date:** 2026-10-04

## Context
Supabase access tokens expire after about an hour. Offline, an expired token can't be refreshed, so Supabase reports "no session" (after up to ~30 s of retries). The app then sent users to the login page: offline mode was unusable after an hour. This bug existed in production.

## Decision
- The app remembers the last signed-in user on the device.
- At startup, if the session can't be restored **because of the network** (retryable network error, or no answer within 1.5 s offline / 8 s online), the app starts with the remembered user and reads the local copy.
- Once back online, Supabase refreshes the session normally.
- Any other auth error (revoked session, invalid token) signs the user out as before.
- The remembered user is cleared on sign-out.

## Consequences
- Covered by the offline e2e test "starts offline even when the session token has expired".
- The remembered user (id, email) is stored in the browser, like the Supabase session itself.
