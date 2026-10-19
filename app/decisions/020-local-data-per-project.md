# ADR-020: Local data per project: what you see is what is stored

- **Status:** Accepted (implemented in livenotes-app, in production since 2026-10-11)
- **Date:** 2026-10-11
- **Partly supersedes:** [ADR-009](./009-local-first-reads.md) (automatic first download, project identity), [ADR-014](./014-keep-local-data-on-logout.md) (scope and place of "Delete local data")

## Context
Testing Phase 1b showed screens that didn't match the device's local copy:
- after "Delete local data", the list stayed on screen (in-memory stores), and the next tap downloaded the project again;
- after a Sync, screens kept their previous data until a page reload.

## Decision
- **What the user sees is exactly the local copy.** When a project's copy is replaced as a whole (Sync, delete), every in-memory copy is dropped (stores, open panels, the current page) and the screen reads again.
- **"Delete local data" is per project**, in the project's **Local data** panel (renamed from "Sync" in the project menu). It removes that project's copy only; other projects are untouched.
- **After a delete, no automatic download** for that project until the user syncs it, even after a reload (per project, per user, remembered on the device). Screens stay empty and a banner says "This project is not on this device. Sync to download it."
- **The project's identity (name, picture, the user's role) is fetched online when there is no local copy**, so the header and project menu (Local data, Start editing) stay usable. Its content only comes from the local copy. Offline without a copy, nothing can be shown.
- The Local data panel shows the space the project's copy takes on the device, plus the browser's total for the site.
- ADR-009's automatic first download still applies to a project that was never on the device.

## Why
A user who deletes local data expects it gone, and should be able to trust that what is on screen is what will be there offline.
