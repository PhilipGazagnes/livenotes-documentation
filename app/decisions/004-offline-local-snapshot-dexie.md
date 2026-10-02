# ADR-004: Offline = read-only local snapshot in IndexedDB (Dexie)

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
Offline is the #1 production problem. The current implementation (`src/sw.ts` + `useOfflineSync.ts`):
- caches **Supabase HTTP responses** by exact URL in a service worker (Workbox `NetworkFirst`)
- "Sync" (`warmUp()`) fires a set of GET requests to fill that cache

Why it's unreliable:
- Any query that differs from the warm-up (filter, sort, search, page size) misses the cache and returns a 503 offline.
- Cached data expires (7 days / 500 entries) and is never reconciled.
- `.catch(() => null)` hides partial failures, so a sync can report "done" with data missing.
- It would not work at all inside an iOS native shell (no service workers in WKWebView/Capacitor).

The required behavior is modest:
- a **Sync** button refreshes local data
- **offline is read-only**
- **editing requires a connection** (no offline write queue)

## Decision
Store **data, not responses**:
1. Sync downloads the project's raw tables (library songs, songs, lists, list items, tags, artists…) into **IndexedDB, via Dexie**.
2. Offline, the app reads from the local tables and filters, sorts and searches locally (Fuse.js is already used for search).
3. Writes stay online-only. After a successful write, update the local copy too so it doesn't go stale.
4. Optional: auto-sync when the app opens with a connection; the button becomes a fallback.
5. Sync errors are surfaced, never swallowed. A sync either completes or reports what failed.
6. The **service worker is kept for the app shell only** (HTML/JS/CSS precache), so the PWA stays installable and opens offline. API response caching is removed.

## Alternatives considered
- **PowerSync** (Postgres→SQLite sync engine, official Supabase partner; web + React Native SDKs; built-in offline write queue). Best candidate if offline writes are needed. Rejected *for now*:
  - Overkill for read-only offline.
  - Extra hosted service. Free tier deactivates after 1 week of inactivity; Pro is $49/month (1,000 peak concurrent clients, then $30 per extra 1,000; data volume isn't a concern for text data).
  - Its sync rules duplicate RLS logic, a new place where data could leak.
- **RxDB:** has a Supabase plugin, but production storage for React Native (and IndexedDB/OPFS) is paid (~$99/month), it needs extra columns on synced tables, and it uses a document model.
- **Electric:** mainly read-sync; writes go through your own API.

## Consequences
- Free, no new service, and RLS keeps applying directly.
- Estimated effort: a few days.
- No offline edits, and no live cross-device updates (sync on demand or on open).
- React Native has no IndexedDB, so mobile will use SQLite (`expo-sqlite`) behind the same data layer (ADR-005).

## Revisit if (switch to PowerSync)
- Offline **editing** becomes a requirement (e.g. reordering a setlist backstage with no signal).
- The mobile app needs "always fresh" data without a sync button.

Switching cost is limited by ADR-005: the storage adapter gets rewritten, the UI doesn't change, and Supabase stays the source of truth (devices just re-download).
