# ADR-009: Local-first reads

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04
- **Supersedes:** the network-first read strategy of [ADR-004](./004-offline-local-snapshot-dexie.md) (`readThrough`: network first, snapshot as fallback after 8 s)

## Context
At gigs, information must appear immediately. A network that is "up" but slow (venue Wi-Fi, mixing console hotspot) made network-first reads wait up to 8 seconds before falling back to the local copy. The audience doesn't wait.

## Decision
- **Always read from the local copy** of the project.
- If there is no local copy yet: download the project from the server, store it locally, then read from the local copy.
- The network is never on the critical path of a read once a local copy exists.
- Changes made by other members appear only after the user syncs ([ADR-010](./010-manual-sync-staleness-check.md)).

## Consequences
- Instant screens, identical behaviour online and offline.
- The local copy can be stale. This is made visible by the staleness check (ADR-010), not by silently fetching.
- The user's own edits must update the local copy immediately ([ADR-012](./012-server-first-writes-local-patch.md)), otherwise they would see stale data right after editing.
- Still online-only (not part of the project copy): members, invitations, public libraries, global song search.
