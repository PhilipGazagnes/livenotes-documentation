# Offline Data Layer: Spec (Phase 1)

- **Status:** Implemented on branch `feat/monorepo-offline` (livenotes-app)
- **Date:** 2026-10-02
- **Decisions:** [ADR-004](./decisions/004-offline-local-snapshot-dexie.md), [ADR-005](./decisions/005-data-access-layer.md)
- **Issues:** livenotes-app #21 (epic), #22–#33, #13

## Goal

After one sync, every **read** screen works with no network, with any filter, sort or search. Editing requires a connection. A failed sync never damages the previous local copy. Logging out removes local data.

## Concepts

| Term | Meaning |
|---|---|
| **Snapshot** | One complete copy of a project's raw data (rows of the Supabase tables), plus `syncedAt` and `schemaVersion`. Stored as one IndexedDB record per project. |
| **Sync** | Download all of a project's tables, then replace the snapshot in a single write (all or nothing). |
| **Read-through** | How every read service function works: use the network when it's available, fall back to the snapshot when it isn't. |

## What's in a snapshot

Scoped to one project, fetched with the user's session (so RLS applies):

| Snapshot field | Source |
|---|---|
| `project` | `projects` row |
| `role` | `project_memberships.role` for the current user |
| `librarySongs` | `library_songs` where `project_id` |
| `songs`, `songArtists`, `artists` | `songs_v2`, `song_artists_v2`, `artists_v2` reached from the library songs |
| `librarySongTags` | `library_song_tags` of those library songs |
| `notes` | `notes` of those library songs |
| `tags` | `tags` where `project_id` |
| `lists`, `listItems` | `lists` where `project_id`, plus their `list_items` |

Requests: about 5, using PostgREST embedding (`library_songs` → song → artists, tags, notes; `lists` → items). Pages of 500 rows avoid PostgREST's 1,000-row cap. **Every request must succeed**, otherwise the sync fails and the previous snapshot is kept.

Not included: the global song catalog search, public libraries, members and invitations. Those are online-only features.

## Where the code lives (ADR-005, first step)

```
packages/shared/src/offline/      framework-agnostic, reusable by mobile
  snapshot.ts        ProjectSnapshot type, schema version
  store.ts           SnapshotStore interface (storage adapter)
  dexieStore.ts      Dexie/IndexedDB adapter (web)
  fetchSnapshot.ts   download a project snapshot with a Supabase client
  queries.ts         rebuild the app's read shapes from a snapshot (local joins, sorting, counts)
  network.ts         isNetworkError(), timeouts

apps/web/src/lib/offline/
  offlineData.ts     singleton: current user DB, in-memory cache, sync, readThrough(), auto-sync, dirty tracking
  supabaseFetch.ts   fetch wrapper given to supabase-js: blocks writes when offline, marks data dirty after writes
```

The web services (`src/services/*`) keep their signatures. Each read function becomes `readThrough(remote, local)`. Stores, components and pages are unchanged. Moving all services into `packages/shared` is a later step, done when mobile needs them.

## Read strategy

```
readThrough(remote, local):
  if offline mode (navigator offline OR "force offline" setting):
      snapshot? -> local(snapshot)
      none      -> throw OfflineDataUnavailableError ("Sync this project while online first")
  else:
      try remote()  (if a snapshot exists, give up after 8 s, which handles venue "lie-fi")
      on network error / timeout:
          snapshot? -> local(snapshot)
          none      -> rethrow
      other errors (RLS, validation) -> rethrow (never hidden)
```

Online behaviour stays exactly as before: when the network works, reads are the same Supabase queries as today.

## Writes

- **Offline:** the fetch wrapper rejects every non-GET REST/RPC request immediately with "You are offline. This action requires an internet connection." The main create and edit entry points are disabled from `useOnlineStatus`.
- **Online:** after any successful write (POST/PATCH/PUT/DELETE on `/rest/v1`), the active project is marked dirty, and a debounced background re-sync (4 s) refreshes the snapshot.
  - **Why re-sync instead of patching rows locally:** one code path, so the snapshot can't drift from the server, and there are ~40 write functions that would each need a local patch. A re-sync is ~5 requests.

## When sync happens

1. Manual **Sync now** button (Offline sync drawer).
2. **Auto-sync** after login or app start when online, if there's no snapshot or it's older than 10 minutes.
3. When the connection comes back, under the same staleness rule.
4. Debounced, after writes.

Concurrent syncs for the same project are coalesced into one.

## Storage and security

- One IndexedDB database **per user**: `livenotes-offline-<userId>`, table `snapshots` (key `projectId`).
- **Logout** deletes the current user's database.
- **Login** deletes any other user's `livenotes-offline-*` databases on the device.
- Bumping `SNAPSHOT_SCHEMA_VERSION` invalidates older snapshots (they're ignored and re-synced).

## Service worker

- Keeps precaching the app shell and the SPA navigation fallback, so the PWA stays installable and opens offline.
- The Supabase `/rest/v1` runtime route and the `supabase-data` cache are removed (the old cache is deleted on activate).
- "Force offline" is now an app-level setting read by the data layer. No more SW messages.
- **#13 (refresh in an installed PWA):** the app checks for a new version when it becomes visible and every hour, and reloads automatically when one is activated. The project menu gets a "Reload app" action, because standalone PWAs have no browser reload button.

## Error handling

- The sync never swallows errors. A failed sync reports which step failed, and the previous snapshot stays intact.
- `OfflineDataUnavailableError` has a user-facing message.

## Tests

- Unit (`packages/shared`): query builders vs fixtures (shapes, ordering, counts, tag and list joins), fetcher paging and failure atomicity (mocked client), Dexie adapter (`fake-indexeddb`), network-error detection.
- Unit (`apps/web`): `readThrough` decisions (offline, network error, timeout, real error), write blocking.
- e2e (Playwright `context.setOffline`): sync → offline → browse the library, setlist and song notes → filters and search → editing blocked → logout clears data.
