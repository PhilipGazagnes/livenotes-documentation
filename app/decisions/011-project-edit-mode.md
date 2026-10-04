# ADR-011: Project edit mode: one editor at a time per project

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04

## Context
With local-first reads and manual sync (ADR-009, ADR-010), two members editing the same project at once would overwrite each other's work or edit stale data. Bands are small and rarely edit simultaneously.

## Decision
Each project has a single **editing flag**. Only the member holding it can make **any** change to the project: add or remove songs, edit notes, manage tags, manage setlists, change settings.

**Taking the flag ("Start editing")**
- Allowed for members with the editor or administrator role.
- One server step (a database function), all-or-nothing, so two members clicking at the same moment can't both get it:
  1. the user's local copy must be at the project's current version, otherwise "Your copy is outdated, sync first";
  2. nobody may hold the flag, otherwise "Being edited by <name>";
  3. if both pass, the flag is given to the user.
- Viewing mode is the default. Editing is a deliberate act (no accidental edits on stage).

**While editing**
- The holder's avatar shows a special outline with an editing icon. Other members see who is editing.
- Every write goes to the server first, then into the local copy ([ADR-012](./012-server-first-writes-local-patch.md)).
- Nobody else can edit the project, whatever their role.

**Releasing the flag**
- On purpose: a **"Stop editing"** button in the user menu.
- By an **administrator** of the project (e.g. a member forgot to stop).
- **Automatically after inactivity** (no edit for e.g. 15 minutes). **30 seconds before**, the holder gets a **"Keep editing?"** dialog. Answering renews the flag; no answer releases it.
- Inactivity means no edits, not "app open": a phone left open on the lyrics during a gig must not keep the flag.
- If the network is lost while editing, writes fail (server first) and the flag expires on its own.

**Enforced by the server**
- Database rules reject any write to the project's data from a user who doesn't hold a valid (non-expired) flag. The interface alone is not enough: an old tab or an outdated app version must not be able to write.
- This touches the access policies of every project table: the biggest part of the work.

**Community project**
- Same system as any project: every app user is a viewer by default, a few members are editors.

## Boundary: the shared song catalog
Song titles and artists are stored once in global tables (`songs_v2`, `artists_v2`) with no project attached. A project's library only links to them (`library_songs.song_id`), and its notes and tags hang off that link. Example: "Wonderwall / Oasis" is one row in `songs_v2`, linked from three projects, each with its own private notes.

Adding a new song to a project creates (or reuses) the shared card, then creates the project's link. The flag guards the project's own rows (library links, notes, tags, setlists, custom titles). The shared card is outside the flag; it is harmless because adding it to a library still requires the flag. A private project never changes another project's data.

## Alternatives considered
- **A flag per note:** more concurrency, but many locks to manage and no protection for setlists, tags and library changes.
- **No locking (last write wins):** silent data loss between band members.

## Consequences
- One member editing blocks the others from editing the same project. The inactivity expiry and admin release keep that bearable.
- Needs a migration: the flag (holder, since, last activity) on projects, the start/renew/stop functions, the version triggers (ADR-010), and write rules on every project table.
