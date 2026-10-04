# ADR-019: E2E test credentials stay out of the repository

- **Status:** Proposed (not confirmed yet)
- **Date:** 2026-10-04

## Context
`apps/web/e2e/users.ts` contains a test account's password in plain text, committed to git. A real Supabase token was also committed earlier (commit bc2e06b, `e2e/.auth/philip.json`).

## Decision (proposed)
- Read e2e credentials from a gitignored `.env.test` (e.g. `E2E_EMAIL`, `E2E_PASSWORD`), never from source files.
- Change the test account's password.
- Rotate the Supabase token that leaked earlier.
- Rewriting git history is optional once the credentials have been changed.
- `e2e/.auth/` stays ignored at any depth (`**/e2e/.auth/`, done on `feat/monorepo-offline`).
