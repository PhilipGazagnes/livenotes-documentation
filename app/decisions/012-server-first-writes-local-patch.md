# ADR-012: Writes go to the server first, then patch the local copy

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04
- **Supersedes:** "re-sync the whole project a few seconds after every write" from the Phase 1 implementation ([ADR-004](./004-offline-local-snapshot-dexie.md), offline spec)

## Decision
1. Every change is written to Supabase first.
2. On success, the server returns the saved rows (and the new project version).
3. The app writes those rows into the local copy immediately (update, insert or delete only what changed) and records the new version.
4. If the server refuses the write (offline, no editing flag, validation…), the local copy is not touched.

## Why
- Re-downloading the whole project for one edit is heavy.
- Since the editor holds the project's only editing flag ([ADR-011](./011-project-edit-mode.md)), nobody else changed the project meanwhile: patching the local copy keeps it exactly at the server's version.
- With local-first reads ([ADR-009](./009-local-first-reads.md)), the user must see their own edit right away.

## Consequences
- Every write path needs a matching local update (more code than the blanket re-sync, much lighter at runtime).
- Writes remain online-only: no offline queue.
