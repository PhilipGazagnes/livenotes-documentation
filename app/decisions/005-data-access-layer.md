# ADR-005: Single data access layer with swappable storage

- **Status:** Accepted
- **Date:** 2026-10-02

## Decision
- Screens, components and stores never call Supabase or Dexie directly. They go through a data layer in `packages/shared` with methods like `getLibrarySongs()`, `getList(id)`, `saveSong()` and `syncProject(id)`.
- Behind it sits a **storage adapter**:
  - web: Dexie / IndexedDB (ADR-004)
  - mobile: SQLite (`expo-sqlite`)
  - later, if needed: PowerSync
- Remote reads and writes go through Supabase with RLS.

## Why
- Both apps share the same data logic.
- Changing the offline technology means rewriting one adapter, not every screen.
- It's a natural place to fix the inconsistent error handling noted in `livenotes-app/docs/TECHNICAL_DEBT.md`: one convention, no silent `null` swallowing.
