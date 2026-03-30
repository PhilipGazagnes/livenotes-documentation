# Livenotes App - Data Model

This document defines the database schema and entity relationships for the Livenotes app.

**Note**: Entities and fields marked with version tags indicate when they are introduced:
- No tag = V1 (initial release)
- `[V2]` = Added in version 2
- `[V3]` = Added in version 3

---

## Entity Relationship Overview

```
User (1) ──< (many) ProjectMembership [V3] (many) >── (1) Project
                                                              │
                                                              │ (1)
                                                              │
                                                              ▼
                                                           (many) Song
                                                              │
                                                              ├──< (many) SongTag
                                                              │
                                                              └──< (many) ListItem
                                                                            │
                                                                            ▼
                                                                          List
```

---

## Users

Core user account information.

```typescript
interface User {
  id: string;                    // UUID, primary key
  email: string;                 // unique, not null
  created_at: timestamp;
  updated_at: timestamp;
  
  // Managed by Supabase Auth
  // Additional profile fields can be added as needed
}
```

**Relationships:**
- Has many `ProjectMembership` (through membership in multiple projects) [V3]
- Has one auto-created personal `Project` (via special query)

---

## Projects

Container for songs and collaboration workspace.

```typescript
interface Project {
  id: string;                    // UUID, primary key
  name: string;                  // e.g., "My Songs", "Band Setlist 2026"
  type: 'personal' | 'shared';   // personal projects have restrictions
  owner_id: string;              // foreign key -> User.id, not null
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Business Rules:**
- Each `User` has exactly one `Project` with `type = 'personal'` (auto-created on signup)
- Personal projects:
  - Cannot have additional members [V3]
  - Cannot receive transferred songs [V3]
  - Owner cannot be transferred
- Shared projects [V3]:
  - Can have multiple members
  - Support all collaboration features
- Every project must have exactly one owner at all times

**Relationships:**
- Belongs to one `User` (owner)
- Has many `Songs`
- Has many `ProjectMembership` [V3]
- Has many `Lists`

---

## [V3] ProjectMembership

Junction table for user-project relationships with role management.

```typescript
interface ProjectMembership {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  user_id: string;               // foreign key -> User.id
  role: 'owner' | 'editor' | 'reader';
  joined_at: timestamp;
  invited_by: string;            // foreign key -> User.id (who sent invite)
}
```

**Constraints:**
- Unique constraint on `(project_id, user_id)` - user can only be member once per project
- Exactly one membership per project must have `role = 'owner'`

**Business Rules:**
- Owner role: full access, manages members
- Editor role: create/edit songs, manage tags/lists
- Reader role: view-only access
- Personal projects only have one membership (the owner)

---

## Songs

Song data and metadata.

```typescript
interface Song {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id, not null
  title: string;                 // not null
  
  // Metadata fields (V1)
  artist: string;                // optional (max 100 chars)
  notes: text;                   // optional free-form notes (max 255 chars)
  livenotes_poc_id: string;      // optional - for migration from existing system (exactly 4 chars or empty)
  
  // Content fields (V2)
  songcode_content: text;        // [V2] raw SongCode text (includes key, tempo, etc.)
  parsed_json: jsonb;            // [V2] parsed Livenotes JSON structure (optional cache)
  
  created_at: timestamp;
  updated_at: timestamp;
  created_by: string;            // foreign key -> User.id
  updated_by: string;            // foreign key -> User.id
}
```

**Business Rules:**
- A song belongs to exactly one project
- In V1, songs contain only metadata (title, artist, notes, POC ID)
- In V2, full SongCode content can be added and edited (includes key, tempo, chords, lyrics, etc.)
- Songs cannot be shared between projects (only moved/duplicated) [V3]
- Title normalization: trim whitespace, collapse multiple spaces to single space
- POC ID is user-editable, exactly 4 characters or empty

**Relationships:**
- Belongs to one `Project`
- Has many `SongTag` (through junction table)
- Has many `ListItem` (appears in multiple lists)

---

## Tags

Free-form labels for organizing songs.

```typescript
interface Tag {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  name: string;                  // tag text, not null
  created_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(project_id, name)` - tag names unique per project

**Special Tags:**
- Auto-generated when song is transferred [V3]: `from <PROJECT_NAME> <DATE>`
- Format can be parsed to identify transfer origin

---

## SongTag

Junction table for song-tag many-to-many relationship.

```typescript
interface SongTag {
  id: string;                    // UUID, primary key
  song_id: string;               // foreign key -> Song.id
  tag_id: string;                // foreign key -> Tag.id
  created_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(song_id, tag_id)`

---

## Lists

Ordered collections of songs (e.g., setlists).

```typescript
interface List {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  name: string;                  // e.g., "Summer Tour 2026", not null
  description: text;             // optional
  created_at: timestamp;
  updated_at: timestamp;
  created_by: string;            // foreign key -> User.id
}
```

**Business Rules:**
- Lists belong to a project
- Can contain songs from the same project only
- Order is maintained via `ListItem.position`

---

## ListItem

Junction table for list-song relationship with ordering.

```typescript
interface ListItem {
  id: string;                    // UUID, primary key
  list_id: string;               // foreign key -> List.id
  song_id: string;               // foreign key -> Song.id
  position: integer;             // order in list (1, 2, 3, ...)
  added_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(list_id, song_id)` - song appears once per list
- Unique constraint on `(list_id, position)` - positions are unique within list

**Business Rules:**
- Position determines display order in list
- When song is removed, positions are recalculated
- Same song can appear in multiple different lists

---

## [V3] TransferRequest

Tracks song transfer requests between projects.

```typescript
interface TransferRequest {
  id: string;                    // UUID, primary key
  song_ids: string[];            // array of Song.id values being transferred
  source_project_id: string;     // foreign key -> Project.id
  target_project_id: string;     // foreign key -> Project.id
  requested_by: string;          // foreign key -> User.id (source owner)
  status: 'pending' | 'accepted' | 'rejected';
  
  created_at: timestamp;
  resolved_at: timestamp;        // when accepted/rejected
  resolved_by: string;           // foreign key -> User.id (target owner)
}
```

**Business Rules:**
- Only project owners can initiate transfers
- Only target project owner can accept/reject
- On acceptance:
  - Songs move to target project (`Song.project_id` updated)
  - Auto-tag created and applied to transferred songs
- On rejection, songs remain in source project
- Historical record maintained for audit trail

---

## Database Notes

### Supabase Setup
- Uses PostgreSQL
- Row Level Security (RLS) policies for access control
- Real-time subscriptions available for V2+ features

### V1 Tables
- Tables needed: `User`, `Project`, `Song`, `Tag`, `SongTag`, `List`, `ListItem`
- Song fields: metadata only (title, artist, key, tempo, notes)
- RLS: Users can only access their own personal project's songs
- Focus: Catalog and organization

### V2 Additions
- Add fields to `Song`: `songcode_content`, `parsed_json`
- Enable content editing and viewing
- No new tables required

### V3 Migrations
- Add tables: `ProjectMembership`, `TransferRequest`
- Add RLS policies for role-based access
- Add indexes for common queries (project_id, user_id lookups)
- Enable collaboration features

---

**Last Updated**: March 30, 2026
