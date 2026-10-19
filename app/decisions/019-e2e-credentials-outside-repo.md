# ADR-019: E2E test credentials stay out of the repository

- **Status:** Accepted (implemented in livenotes-app, in production since 2026-10-19, #48)
- **Date:** 2026-10-04

## Context
`apps/web/e2e/users.ts` contains a test account's password in plain text, committed to git. A real Supabase token was also committed earlier (commit bc2e06b, `e2e/.auth/philip.json`).

## Decision
- Read e2e credentials from a gitignored `.env.test` (e.g. `E2E_EMAIL`, `E2E_PASSWORD`), never from source files.
- Change the test account's password.
- Rotate the Supabase token that leaked earlier.
- Rewriting git history is optional once the credentials have been changed.
- `e2e/.auth/` stays ignored at any depth (`**/e2e/.auth/`, done on `feat/monorepo-offline`).

## Outcome (2026-10-19)
- Credentials are read from `.env.test` at the repo root (gitignored); `.env.test.example` documents it. Never commit real values. The repository is public.
- Leaked token: every session of the affected account was signed out in prod and dev, so it can no longer be used.
- The account in the old `users.ts` existed in neither database, so the leaked password protected nothing.
- New dev-only test account `e2e-test@livenotes.test` with its own project; its password exists only in the local `.env.test`. `npm run test:e2e` runs against dev again.
- Git history was not rewritten (optional, see above).
