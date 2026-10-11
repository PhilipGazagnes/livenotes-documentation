# ADR-021: Writes check the editing flag on the server first

- **Status:** Accepted (implemented in livenotes-app, on `develop` since 2026-10-11)
- **Date:** 2026-10-11
- **Completes:** [ADR-012](./012-server-first-writes-local-patch.md), [ADR-011](./011-project-edit-mode.md)

## Context
The screen learns that the editing flag was released (by an administrator, or by expiry) only at its next status check (see ADR-010's note). Meanwhile a save was sent. The database silently ignores updates and deletes that its rules refuse (no error, 0 rows), so the app reported a success, then marked the local copy outdated although nothing had changed.

## Decision
- Before every project write, the app fetches the project status (one small request) and checks that the user still holds the flag.
- If not, nothing is sent: one error ("Not saved: you are no longer editing this project"), edit mode ends quietly, the local copy is left as is.
- The rare case of the flag lost *during* the write keeps ADR-012's rule: the copy is marked outdated and the user is asked to sync.

## Consequences
- One extra small request per write; writes are infrequent.
- The database rules (ADR-011) remain the real protection; this check is about telling the user the truth.
