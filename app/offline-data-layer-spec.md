# Offline Data Layer: Spec (Phase 1 + 1b)

- **Status:** Implemented in livenotes-app, on `develop` since 2026-10-11. Database migration `046_project_version_and_edit_mode.sql` is applied on dev; prod gets it with the merge to `main`.
- **Dates:** 2026-10-02 (Phase 1), revised 2026-10-11 (Phase 1b)
- **Decisions:** [ADR-004](./decisions/004-offline-local-snapshot-dexie.md), [ADR-005](./decisions/005-data-access-layer.md), [ADR-009 to ADR-015](./decisions/README.md), [ADR-020](./decisions/020-local-data-per-project.md), [ADR-021](./decisions/021-writes-check-editing-flag-first.md)
- **Issues:** livenotes-app #21 (Phase 1 epic), #34 (Phase 1b epic), #45 (live status, backlog)

## Goal

Screens show a project's **local copy**, instantly, online or offline. The user decides when it changes (Sync). One member at a time edits a project; their edits go to the server first and show at once. What the user sees is exactly what is stored on the device.

## Concepts

| Term | Meaning |
|---|---|
| **Local copy** (snapshot) | One complete copy of a project's raw data (rows of the Supabase tables), with `syncedAt`, `schemaVersion` and the project `version` it matches. One IndexedDB record per project. |
| **Project version** | A number on `projects`, increased by database triggers on any change to the project's data, deletions included. |
| **Sync** | Download all of a project's tables and replace its local copy in one write (all or nothing). Only by the user. |
| **Editing flag** | Held by at most one member per project. Only its holder can write to the project's data (enforced by the database). |
| **Status** | The project's current version and who holds the flag: one small request (`get_project_status`). |

## What's in a local copy

Scoped to one project, fetched with the user's session (RLS applies):

| Field | Source |
|---|---|
| `version` | `get_project_status`, read **before** the data |
| `project` | `projects` row |
| `role` | `project_memberships.role` for the current user |
| `librarySongs` | `library_songs` where `project_id` |
| `songs`, `songArtists`, `artists` | `songs`, `song_artists`, `artists` (shared catalog) reached from the library songs |
| `librarySongTags` | `library_song_tags` of those library songs |
| `notes` | `notes` of those library songs |
| `tags` | `tags` where `project_id` |
| `lists`, `listItems` | `lists` where `project_id`, plus their `list_items` |

About 5 requests (PostgREST embedding), pages of 500 rows. Every request must succeed, otherwise the previous copy is kept.

Online only (not in the copy): members, invitations, public libraries, global song search, uploaded images.

## Where the code lives

```
packages/shared/src/offline/
  snapshot.ts        ProjectSnapshot type, schema version
  store.ts           SnapshotStore interface; dexieStore.ts: IndexedDB adapter (one DB per user)
  fetchSnapshot.ts   download a copy; re-read aggregates after a write
  status.ts          project status and editing-flag results
  patch.ts           apply a write's changed rows to a copy (pure)
  queries.ts         rebuild the app's read shapes from a copy

apps/web/src/lib/offline/
  offlineData.ts     current user's DB, readLocal(), syncProject(), patches, delete per project
  projectStatus.ts   status checks, "copy outdated"
  projectWrites.ts   commitWrite(): flag check, server write, local patch
  supabaseFetch.ts   blocks data requests when offline
apps/web/src/stores/editMode.ts   editing flag UI state, write guard, inactivity countdown
```

## Reads (ADR-009, ADR-020)

```
readLocal(select, projectId = active):
  copy on the device        -> select(copy)
  no copy, deleted by user  -> select(empty copy)     (until the user syncs, ADR-020)
  no copy, offline          -> OfflineDataUnavailableError
  no copy, online           -> download it (first time only), then select(copy)
```

- The project's identity (row, user's role) is fetched online when there is no copy, so the header and project menu stay usable (ADR-020).
- When a copy is replaced as a whole (Sync, delete), stores, open panels and the current page are dropped and read again.

## Sync and staleness (ADR-010)

- The Sync button (Local data panel, or the banner) is the only sync. It covers the active project only.
- The status is checked at app open and project switch, on reconnect, when the app comes back to the foreground, on navigation (at most every 30 s), and after the user's own writes, syncs and editing actions. No polling yet (#45).
- Server version ≠ copy's version → banner "Updated by Alex, 5m ago — Sync". The check never changes the copy.

## Edit mode (ADR-011, ADR-013)

- Viewing is the default. **Start editing** (project menu) calls `start_project_editing(project, copy's version)`: refused if someone else holds the flag ("Being edited by …") or the copy is outdated ("Sync first").
- The flag expires 15 min after the last write or renewal. "Keep editing?" shows 30 s before; no answer releases it. **Stop editing** in the project menu; administrators can **Release** another member's flag. Switching project releases it.
- Header: amber ring and pen badge when you edit; grey pen badge when another member does.
- Edit controls stay visible: disabled with a reason (offline, not editing, being edited by …, sync first). Viewers don't see them.
- Database: restrictive RLS on `library_songs`, `notes`, `library_song_tags`, `tags`, `lists`, `list_items` and project settings (`projects` UPDATE) requires a valid flag. Outside the flag: the shared catalog, members, invitations, public libraries, creating and deleting projects. `update_list_item_positions` checks the flag; `push_note_to_project` refuses a project someone else is editing.

## Writes (ADR-012, ADR-021)

```
commitWrite(write, refresh):
  guard: role + edit mode (else EditNotAllowedError with the reason)
  check the flag on the server (else: nothing sent, "Not saved: you are no longer editing")
  write to Supabase
  re-read the changed aggregates + status
  still holding the flag -> patch the copy, set its version to the server's
  otherwise / re-read failed -> mark the copy outdated (version -1): the banner asks for a sync
```

Aggregates: a library song with its song card, artists, tags and notes; a setlist with its items; the project's tags; the project row; catalog artists. Removals follow the database cascades.

## Storage (ADR-014, ADR-020)

- One IndexedDB database per user: `livenotes-offline-<userId>`, table `snapshots` (key `projectId`).
- Logout keeps local data; another user's data is never readable through the app.
- **Local data** panel (project menu): space used by the project's copy, last sync, Sync now, **Delete local data** (this project only).
- Bumping `SNAPSHOT_SCHEMA_VERSION`, or a copy without a version, makes old copies ignored (downloaded again).

## Service worker and updates (ADR-015)

- Precaches the app shell; no data caching.
- Checks for a new version at start and when the app comes back to the foreground; never reloads by itself. The banner offers "Reload" and can be closed for a day; "Reload app" stays in the project menu.

## Tests

- Unit (`packages/shared`): queries, snapshot download (paging, version, failure atomicity), patches, Dexie adapter, network errors.
- Unit (`apps/web`): local reads, sync, patches, delete per project, `commitWrite` (guard, flag check, patch, outdated), edit-mode store (reasons, start/stop, countdown).
- e2e (Playwright, mocked Supabase): offline reading with disabled controls, offline start with an expired token, no copy offline, logout keeps data, delete per project and Sync, edit mode, another member editing, "sync available".
- Database rules: tested on dev by impersonating users in rolled-back transactions. The real-database e2e suite (`npm run test:e2e`) runs against dev with the account from `.env.test` (ADR-019).
