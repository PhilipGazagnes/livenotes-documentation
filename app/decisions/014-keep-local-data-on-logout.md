# ADR-014: Local data is kept on logout; deleting it is a user action

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04
- **Supersedes:** the logout and login cleanup of the Phase 1 implementation ([ADR-004](./004-offline-local-snapshot-dexie.md), offline spec)

## Decision
- **Logout never deletes local data.**
- Local data stays **scoped per user**: one local database per user id (`livenotes-offline-<userId>`). A user only ever reads their own copy. Logging in as another user doesn't delete the previous user's data.
- A **"Delete local data"** button in the user menu, next to Sync, deletes this user's local data on this device.

## Why
Re-downloading after every logout is a cost for 99% of users, who use their own device. Users who care (shared device) can delete explicitly.

## Consequences
- Another person using the same device can't read the data through the app (per-user scoping), but the data stays on the device until deleted. Accepted trade-off.
