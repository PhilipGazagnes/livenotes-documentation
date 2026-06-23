# Projects & Users

> Status: Specification complete — Phase 3 implementation target  
> Last updated: 2026-06-23

## Overview

LiveNotes organises all content around **projects**. A user belongs to one or more projects and holds a role in each. There is one special system-level project — **community** — that is visible in read mode to all authenticated users.

There are no "personal projects". All projects follow the same model. A user who wants a private workspace simply creates a project and does not invite anyone.

---

## User Model

Users are managed by Supabase Auth. Extended metadata lives in a `profiles` table (one row per user, keyed by `auth.uid()`).

### `profiles` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | FK → `auth.users.id` |
| `display_name` | text | shown in drawer and as avatar fallback |
| `avatar_url` | text? | user's own avatar (reserved for future use) |
| `active_project_id` | UUID? | FK → `projects.id` — persisted active project |
| `is_super_admin` | boolean | default `false` — system-level flag |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Super Admin

`is_super_admin` is a system-level flag, not a project role. A super admin can:

- Grant or revoke `is_super_admin` on any user
- Grant or revoke the `editor` role on the **community** project
- Approve notes pushed to the community project (acting as a community editor)

Only super admins can grant `is_super_admin` to other users. In V1, this is managed directly in the database; no self-service UI is provided.

---

## Projects

All projects share the same schema. The **community** project is not a different type — it is simply a seeded project with the reserved slug `community`. It is identified by slug wherever special behaviour is needed (e.g. the implicit read-all RLS policy). There is exactly one community project; it cannot be created, renamed, or deleted by users.

### `projects` table — relevant fields

| Column | Notes |
|--------|-------|
| `slug` | URL-safe identifier; `community` is reserved for the system project |
| `owner_id` | Denormalised reference to the project creator — kept for quick ownership checks; authoritative roles live in `project_memberships` |
| `thumbnail_url` | Project avatar image — displayed in the header |
| `name`, `description` | Standard project metadata |
| `contact_enabled`, `contact_info` | Public contact info for public libraries |

---

## Roles

### Project-level roles

| Role | Permissions |
|------|-------------|
| `administrator` | Full control: edit project settings, manage members, approve incoming note push requests, all editor permissions |
| `editor` | Add/edit songs in library, manage tags and lists, create/edit notes, approve incoming note push requests, push notes to other projects |
| `reader` | View all project content; copy notes out to projects where they have editor+ access |

> Note: "administrator" replaces the former "owner" label throughout the codebase and documentation.

---

## Project Membership

### `project_memberships` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `project_id` | UUID | FK → `projects.id` |
| `user_id` | UUID | FK → `auth.users.id` |
| `role` | enum | `'administrator' \| 'editor' \| 'reader'` |
| `invited_by` | UUID | FK → `auth.users.id` |
| `joined_at` | timestamptz | set when the invitation is accepted |

Unique constraint: `(project_id, user_id)`.

When a project is created, the creator is automatically inserted as `administrator`.

---

## Active Project

### Behaviour

- **No persisted choice** (first login or after logout): no active project — drawer shows user actions plus create/join options
- **After creating or joining a project**: that project becomes active automatically
- **Switching**: user taps avatar → drawer → taps a different project → project loads (songs, tags, lists, etc.)
- `profiles.active_project_id` persists the choice — the same project loads across devices and sessions
- The community project can be set as the active project; its content is always read-only regardless of other roles

### When no project is active

The header avatar is shown with the user's initials as a fallback. Clicking it opens the drawer with no project section.

---

## Invitation Flow

### Sending an invitation (administrator only)

1. Administrator opens the **Members** panel for a project
2. Taps "Invite member" → a record is created in `invitation_links`
3. A shareable URL is generated: `https://app.livenotes.com/invite/<token>`
4. Administrator copies and shares the link (the app does not send emails in V1)

### Accepting an invitation

1. Recipient opens the link in a browser
2. If not authenticated: redirected to login/signup, then back to the invite URL
3. Confirmation screen: **"You've been invited to join [Project Name] as Reader"**
4. User confirms → `project_memberships` row is created, token marked as used, project becomes active

After joining, an administrator can change the member's role from the Members panel.

### `invitation_links` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `project_id` | UUID | FK → `projects.id` |
| `token` | text | unique, cryptographically random |
| `role` | enum | default `'reader'` — the role granted on acceptance |
| `created_by` | UUID | FK → `auth.users.id` |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | `created_at + 7 days` |
| `used_by` | UUID? | FK → `auth.users.id` — null until used |
| `used_at` | timestamptz? | |
| `is_revoked` | boolean | default `false` |

A token is invalid if `used_by IS NOT NULL`, `is_revoked = true`, or `expires_at < now()`.

### "Join a project" (from the drawer)

Tapping "Join a project" opens an informational drawer:

> **Want to join a project?**
> Ask the project administrator to send you an invitation link. Once you receive the link, open it in your browser to join.

No manual code entry — joining is always via the invitation link.

---

## Note Push Flow

Any user with at least **reader** access to a project can **push** a note from that project to another project where they have **editor+** access. The pushed note becomes a copy — once in the target project it is fully independent and can be edited freely.

### Steps

1. User views a note → taps "Push to project"
2. A list of eligible target projects is shown (projects where the user has editor+ role, excluding the source project)
3. User selects a target → a `note_push_requests` record is created with `status = 'pending'`
4. When the target project is active, editors and administrators see a **pending badge** on the project entry in the drawer
5. An editor or administrator of the target project reviews the pending note: **approve** or **reject**
6. **On approval**: the note content is duplicated into the target project as a new `notes` row, linked to the matching `library_song` (the song is added to the target library first if not already present)
7. **On rejection**: the request is marked rejected; no note is created

Pushing to the community project follows the same flow — community editors (or super admins) handle approval.

### `note_push_requests` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `source_note_id` | UUID | FK → `notes.id` |
| `source_project_id` | UUID | FK → `projects.id` |
| `target_project_id` | UUID | FK → `projects.id` |
| `pushed_by` | UUID | FK → `auth.users.id` |
| `status` | enum | `'pending' \| 'approved' \| 'rejected'` |
| `reviewed_by` | UUID? | FK → `auth.users.id` |
| `reviewed_at` | timestamptz? | |
| `created_at` | timestamptz | |

---

## Drawer & Header UX

### Header avatar

| State | Display |
|-------|---------|
| Active project with `thumbnail_url` set | Project's thumbnail image |
| Active project with no image | Coloured circle with project initials |
| No active project | Coloured circle with user initials |

Tapping the avatar opens the project/user drawer.

### Drawer — with an active project

```
Logged in as <display_name>
User settings
────────────────────────────
<Active Project Name>          ← currently active, highlighted
  Project settings
  Members
────────────────────────────
<Other Project 1>              ← tap to switch
<Other Project 2>
...
────────────────────────────
Community                      ← always present, tap to switch
────────────────────────────
Create a project               ← opens creation drawer
Join a project                 ← opens info drawer
────────────────────────────
Log out
```

### Drawer — no active project

```
Logged in as <display_name>
User settings
────────────────────────────
Community
────────────────────────────
Create a project
Join a project
────────────────────────────
Log out
```

### User settings

Opens a sub-drawer or form with user-level fields:

- Display name
- Email address
- Password change

This is **user data**, not project data.

### Project settings

Opens a sub-drawer or form with project-level fields:

- Project name
- Description
- Thumbnail (project avatar image)
- Contact info (phone, email, location, website, social links)

Visible to **administrators only**. Hidden when the community project is active.

### Members panel

Visible to all members of a project.

- List of current members with their roles
- **Invite member** button (administrator only) → generates and displays an invitation link
- Tap a member → change role or remove (administrator only; an administrator cannot demote or remove themselves if they are the last administrator)

Hidden when the community project is active — the super admin manages community membership directly in the database in V1.

---

## Personal Project Deprecation

### What exists today

- `projects.type` has values `'personal'` and `'shared'`
- `authStore.initialize()` auto-creates a personal project for new users via `createPersonalProject(userId)`
- RLS policies check `owner_id = auth.uid()` with no membership table
- No `profiles` table — user data comes directly from `auth.users`
- `authStore` selects the project with the most songs as the "active" project at login

### Target state

- `projects.type` column dropped entirely — all projects use the same schema; community is identified by `slug = 'community'`
- No auto-creation of a project on signup
- RLS policies check membership via `project_memberships`; community project has an additional open read policy keyed on `slug = 'community'`
- `profiles` table introduced for `display_name`, `active_project_id`, `is_super_admin`
- Active project loaded from `profiles.active_project_id`; null on first login

### Migration tasks

1. **DB — drop `type` column**: remove the `type` enum and column from `projects`
2. **DB — seed community project**: insert one row with `slug = 'community'`, `name = 'Community'`, `owner_id = <system user or first super admin>`
3. **DB — `profiles` table**: create table, backfill `display_name` from `auth.users.email` (or a sensible default) and set `active_project_id` to the existing personal project id for each user
4. **DB — `project_memberships` table**: create table, backfill existing `projects.owner_id` values as `role = 'administrator'`
5. **DB — `invitation_links` table**: create table
6. **DB — `note_push_requests` table**: create table
7. **DB — RLS policies**: replace `owner_id = auth.uid()` checks with joins through `project_memberships`; add open read policy `WHERE slug = 'community'`
8. **`authStore`**: remove `createPersonalProject`; load `active_project_id` from `profiles`; handle null active project on first login
9. **Remove personal-project logic**: remove all `type === 'personal'` and `type === 'shared'` checks from stores, services, components, and router guards
10. **Router**: handle the no-active-project state — do not redirect to `/library` if `active_project_id` is null; show an appropriate empty/welcome state
11. **Header & drawer**: implement avatar + drawer as specified above

### Existing data

All existing projects are kept as-is — only the `type` column is dropped. Their owners become `administrator` in `project_memberships`. No data is lost.
