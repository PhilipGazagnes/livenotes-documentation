# ADR-017: Offline end-to-end tests run against a mocked Supabase

- **Status:** Accepted (implemented on `feat/monorepo-offline`)
- **Date:** 2026-10-04

## Decision
- Offline behaviour is tested end to end on the **production build** (service worker included) with Playwright, against a **mocked Supabase** (auth and REST requests answered in the test), so the tests need no database and no test account.
- Command: `npm run test:e2e:offline` (config `apps/web/playwright.offline.config.ts`, tests in `apps/web/e2e/offline/`).
- The existing real-database e2e suite stays, for flows that need the real backend.

## Why
- Offline scenarios (network cut, expired session, data cleanup) are hard to reproduce against a shared real database.
- Runs anywhere, fast and deterministic.

## Consequences
- The mock answers by table and requested columns: when a read query's shape changes, the mock may need updating.
- The tests were verified to fail when the offline behaviour is broken.
