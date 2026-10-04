# ADR-015: PWA updates: a closeable banner, never an automatic reload

- **Status:** Accepted (partly implemented: banner and "Reload app" exist; closing for a day is not done yet)
- **Date:** 2026-10-04
- **Issue:** livenotes-app #13

## Context
An installed PWA serves its cached copy of the app (that's what lets it open offline), so newly deployed code only arrives when the service worker updates. A standalone PWA has no browser reload button.

## Decision
- The app checks for a new version at startup and whenever it comes back to the foreground.
- It **never reloads by itself**: a reload in the middle of a gig would lose the screen the musician is reading.
- When a new version is ready, a **banner** offers "Reload".
- The banner is **closeable**. Closing hides it for **one day**; it shows again the next day if the update is still pending.
- A **"Reload app"** action is always available in the project menu.

## Consequences
- Users may stay on an older version until they choose to reload.
- Switching from the previous self-updating service worker: users on the old version get the new one after fully closing and reopening the app (one-time).
