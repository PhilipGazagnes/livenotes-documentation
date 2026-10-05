# ADR-010: Manual sync only, with a project version check

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04
- **Supersedes:** the automatic syncs of [ADR-004](./004-offline-local-snapshot-dexie.md) (on login/open when older than 10 minutes, on reconnect, after every write)

## Decision
- **The only sync is the Sync button**, pressed by the user. No automatic download of project data.
- **Sync covers the active project only** (decided 2026-10-05). Other projects keep their own local copy, synced when they are active and the user presses Sync.
- Each project has a **version**: a number increased by database triggers on *any* change to the project's data (library songs, notes, tags, setlists and their items, project settings), deletions included. Stored with who made the last change and when.
- The local copy remembers the version it was synced at.
- **Staleness check:** while reading locally with a network available, the app fetches only the project's current version (one tiny request), at app open, on reconnect, and when navigating (throttled). If the server version is newer, a toast invites the user to sync, showing who changed what and when ("Updated by Alex, 5 min ago — Sync").
- Checking is informative only: it never changes the local copy.

## Why
- The musician decides when data changes on screen: nothing moves under their eyes during a gig.
- No background downloads of a whole project (data usage, battery, surprises).
- One project-level version catches every kind of change, including deletions, which per-row timestamps can't (`library_songs` and `list_items` have no "updated" column).

## Alternatives considered
- **A timestamp per note only:** misses setlist, tag and library changes, and deletions.
- **Automatic background sync** (previous behaviour): rejected, see above.

