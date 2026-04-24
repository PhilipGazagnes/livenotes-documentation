# Livenotes App - V2 Data Model (Notes-Based Architecture)

**Created**: April 24, 2026  
**Status**: Planning  

---

## Overview

This document defines the new data model for Livenotes V2, representing a fundamental architectural shift to support:
- **App-level songs** (global catalog with deduplication)
- **Multiple notes per song** (songcode, images, videos, tablature, etc.)
- **Project-based organization** (personal and shared workspaces)
- **Progressive enhancement** toward canonical catalog with verified content

---

## Architecture Philosophy

### Three-Tier Model

```
┌─────────────────────────────────────────────────────────┐
│ APP LEVEL (Global)                                      │
│ - Songs (canonical titles/artists)                      │
│ - Artists (global catalog)                              │
│ - Fingerprinting for deduplication                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ PROJECT LEVEL (User Workspace)                          │
│ - Projects (personal or shared)                         │
│ - Library (songs added to this project)                 │
│ - Tags (project-scoped)                                 │
│ - Lists (project-scoped setlists)                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ CONTENT LEVEL (Project-specific data)                   │
│ - Notes (songcode, images, videos, etc.)                │
│ - Note content is always project-scoped                 │
│ - Multiple notes of same type allowed                   │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Songs are global** - Created once, reused across projects
2. **Notes are project-specific** - My songcode ≠ your songcode
3. **Deduplication via fingerprinting** - "Levitating" = "levitating"
4. **Flexible sharing** - Share notes between users/projects
5. **Progressive enhancement** - Start user-created, evolve to verified catalog

---

## Entity Relationship Diagram

```
User (1) ──< (many) Project
                      │
                      │ (1)
                      ▼
                   (many) LibrarySong ──> (1) Song (global)
                      │                         │
                      │                         └──< SongArtist >── Artist (global)
                      │
                      ├──< (many) Note
                      ├──< (many) LibrarySongTag ──> Tag (project)
                      └──< (many) ListItem ──> List (project)
```

---

## Core Entities

### Users

Managed by Supabase Auth.

```typescript
interface User {
  id: string;                    // UUID, from auth.users
  email: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Relationships:**
- Has many `Project` (as owner)
- Can create global `Song` and `Artist` entities

---

### Songs (App-Level, Global)

Global song catalog. Any user can create songs that become available app-wide.

```typescript
interface Song {
  id: string;                    // UUID, primary key
  title: string;                 // not null, max 200 chars
  created_by: string;            // foreign key -> User.id
  created_at: timestamp;
  updated_at: timestamp;
  
  // Deduplication
  fingerprint: string;           // GENERATED: normalized title for matching
  
  // Verification (Phase 2)
  is_verified: boolean;          // default false
  verified_by: string | null;    // foreign key -> User.id
  verified_at: timestamp | null;
  
  // Metadata
  popularity_score: integer;     // default 0, increments when added to libraries
}
```

**Business Rules:**
- Title normalization: trim whitespace, collapse multiple spaces
- Fingerprint: generated column `lower(regexp_replace(title, '[^a-z0-9]', '', 'g'))`
- Songs are immutable after creation (title cannot change - prevents breaking links)
- To fix typos: create new song, merge old → new (Phase 2)
- Soft delete: mark as `merged_into_id` rather than DELETE

**Indexes:**
```sql
CREATE INDEX idx_songs_fingerprint ON songs(fingerprint);
CREATE INDEX idx_songs_created_by ON songs(created_by);
CREATE INDEX idx_songs_popularity ON songs(popularity_score DESC);
```

**Relationships:**
- Has many `Artist` through `SongArtist` junction
- Has many `LibrarySong` (appears in many libraries)
- Created by one `User`

---

### Artists (App-Level, Global)

Global artist catalog.

```typescript
interface Artist {
  id: string;                    // UUID, primary key
  name: string;                  // not null, max 200 chars
  created_by: string;            // foreign key -> User.id
  created_at: timestamp;
  updated_at: timestamp;
  
  // Deduplication
  fingerprint: string;           // GENERATED: normalized name
  
  // Verification (Phase 2)
  is_verified: boolean;          // default false
  verified_by: string | null;
  verified_at: timestamp | null;
  
  // Metadata (Phase 2+)
  bio: text | null;
  image_url: text | null;
  external_links: jsonb | null;  // Spotify, Apple Music, etc.
}
```

**Business Rules:**
- Same as Songs: immutable, fingerprinted, mergeable

**Indexes:**
```sql
CREATE INDEX idx_artists_fingerprint ON artists(fingerprint);
CREATE INDEX idx_artists_name ON artists(name);
```

**Relationships:**
- Has many `Song` through `SongArtist` junction
- Created by one `User`

---

### SongArtist (Junction Table)

Many-to-many relationship between songs and artists, with ordering.

```typescript
interface SongArtist {
  id: string;                    // UUID, primary key
  song_id: string;               // foreign key -> Song.id
  artist_id: string;             // foreign key -> Artist.id
  position: integer;             // display order (1, 2, 3, ...)
  created_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(song_id, artist_id)` - artist can't appear twice for same song
- Unique constraint on `(song_id, position)` - positions must be sequential

**Business Rules:**
- Position starts at 1 for each song
- When displaying: "Artist1, Artist2, Artist3"
- Deletion: when artist deleted, cascade removes junction records

---

### Projects

Container for user's workspace (personal or shared).

```typescript
interface Project {
  id: string;                    // UUID, primary key
  owner_id: string;              // foreign key -> User.id, not null
  name: string;                  // e.g., "Mike", "The Fuzz Birds"
  type: 'personal' | 'shared';   // personal projects have restrictions
  created_at: timestamp;
  updated_at: timestamp;
  
  // Settings
  notes_field_label: string;     // customizable (default "Notes")
  notes_field_enabled: boolean;  // default true
}
```

**Business Rules:**
- Every user has exactly one `type = 'personal'` project (auto-created on signup)
- Personal projects:
  - Name defaults to user's name or "My Songs"
  - Cannot have additional members (in Phase 3)
  - Owner cannot be transferred
- Shared projects:
  - For bands, worship teams, etc.
  - Can have multiple members (Phase 3)
  - Support collaboration features

**Relationships:**
- Belongs to one `User` (owner)
- Has many `LibrarySong` (songs in this library)
- Has many `Tag` (project-scoped)
- Has many `List` (project-scoped)

---

### LibrarySong (Junction Table)

Junction between Projects and Songs. Represents "Song X exists in Project Y's library."

```typescript
interface LibrarySong {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  song_id: string;               // foreign key -> Song.id
  
  added_by: string;              // foreign key -> User.id
  added_at: timestamp;
  
  // Optional custom metadata (overrides global song data)
  custom_title: string | null;   // if user wants different title locally
  custom_notes: text | null;     // general notes about this song in this project
}
```

**Constraints:**
- Unique constraint on `(project_id, song_id)` - song can only be in library once
- Cascade delete: when song deleted, remove from all libraries
- Cascade delete: when project deleted, remove all library entries

**Business Rules:**
- Adding song to library: creates this record
- Same song can be in multiple projects (Mike's library + Fuzz Birds' library)
- Notes (songcode, images, etc.) attach to `LibrarySong`, not global `Song`
- Custom title/notes allow per-project overrides without changing global song

**Relationships:**
- Belongs to one `Project`
- References one `Song` (global)
- Has many `Note` (project-specific content)
- Has many `LibrarySongTag` (tagging in this project)
- Has many `ListItem` (appears in project's lists)

---

### Note

Content attached to a library song. Multiple notes per song, multiple notes of same type allowed.

```typescript
interface Note {
  id: string;                    // UUID, primary key
  library_song_id: string;       // foreign key -> LibrarySong.id
  
  type: NoteType;                // enum: see below
  title: string | null;          // optional title (e.g., "Acoustic arrangement")
  content: text | jsonb;         // type-specific content
  
  created_by: string;            // foreign key -> User.id
  created_at: timestamp;
  updated_by: string;            // foreign key -> User.id
  updated_at: timestamp;
  
  // Sharing (Phase 2+)
  is_public: boolean;            // default false
  is_shareable: boolean;         // default true
  share_token: string | null;    // for share links
  
  // Metadata
  display_order: integer;        // user-defined sorting within type
}
```

**Note Types (NoteType enum):**

```typescript
type NoteType =
  | 'songcode'           // SongCode text format
  | 'plain_text'         // Free-form text notes
  | 'youtube'            // YouTube video link
  | 'image'              // Image reference (Supabase Storage)
  | 'video'              // Video reference
  | 'audio'              // Audio recording
  | 'tablature'          // Guitar tab text
  | 'looper_notes'       // Custom structured data for looper
  | 'lyrics'             // Lyrics only
  | 'chords'             // Chord chart
  // ... extensible
```

**Content Structure (type-specific):**

```typescript
// SongCode
{
  content: string  // raw SongCode text
}

// Plain text
{
  content: string
}

// YouTube
{
  content: {
    url: string,
    title?: string,
    thumbnail_url?: string,
    timestamps?: { label: string; time: number }[]
  }
}

// Image/Video/Audio
{
  content: {
    storage_path: string,     // Supabase Storage path
    filename: string,
    mime_type: string,
    size_bytes: number,
    metadata?: object
  }
}

// Looper Notes (custom)
{
  content: {
    bpm: number,
    time_signature: string,
    loops: [
      { name: string; bars: number; notes: string }
    ]
  }
}
```

**Business Rules:**
- Multiple notes of same type allowed (e.g., 3 songcodes for different arrangements)
- Notes are always project-scoped (Mike's songcode ≠ shared songcode)
- Title helps distinguish: "Acoustic", "Full band", "Sunday arrangement"
- Display order allows manual sorting
- Deletion cascades when library song removed

**Indexes:**
```sql
CREATE INDEX idx_notes_library_song ON notes(library_song_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created_by ON notes(created_by);
```

**Relationships:**
- Belongs to one `LibrarySong`
- Created/updated by `User`
- Can be referenced by `ListItem` (specific arrangement selection)

---

### Tag (Project-Scoped)

Tags for organizing library songs within a project.

```typescript
interface Tag {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  name: string;                  // not null, max 50 chars
  created_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(project_id, name)` - tag names unique per project

**Business Rules:**
- Tags are project-scoped (Mike's tags ≠ Fuzz Birds' tags)
- Name normalization: trim, lowercase for comparison
- Example tags: "favorites", "to-learn", "sunday-setlist", "high-energy"

**Relationships:**
- Belongs to one `Project`
- Has many `LibrarySong` through `LibrarySongTag` junction

---

### LibrarySongTag (Junction Table)

Many-to-many between library songs and tags.

```typescript
interface LibrarySongTag {
  id: string;                    // UUID, primary key
  library_song_id: string;       // foreign key -> LibrarySong.id
  tag_id: string;                // foreign key -> Tag.id
  created_at: timestamp;
}
```

**Constraints:**
- Unique constraint on `(library_song_id, tag_id)`
- Cascade delete when library song or tag deleted

---

### List (Project-Scoped)

Ordered collections of songs (setlists, practice lists, etc.).

```typescript
interface List {
  id: string;                    // UUID, primary key
  project_id: string;            // foreign key -> Project.id
  name: string;                  // not null, max 100 chars
  description: text | null;
  created_by: string;            // foreign key -> User.id
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Business Rules:**
- Lists are project-scoped (like tags)
- Support manual ordering via list items

**Relationships:**
- Belongs to one `Project`
- Has many `ListItem` (ordered items)

---

### ListItem

Items in a list with positioning and optional note selection.

```typescript
interface ListItem {
  id: string;                    // UUID, primary key
  list_id: string;               // foreign key -> List.id
  library_song_id: string;       // foreign key -> LibrarySong.id
  
  position: number;              // display order (1, 2, 3, ...)
  
  // Advanced features (Phase 2+)
  note_id: string | null;        // foreign key -> Note.id (which arrangement)
  list_annotations: text | null; // context-specific notes ("play in G", "skip intro")
  
  type: 'song' | 'title';        // 'title' for section headers
  title: string | null;          // only if type = 'title'
  
  added_at: timestamp;
  added_by: string;              // foreign key -> User.id
}
```

**Constraints:**
- Unique constraint on `(list_id, position)`
- If `type = 'song'`, `library_song_id` must be NOT NULL
- If `type = 'title'`, `library_song_id` must be NULL and `title` NOT NULL

**Business Rules:**
- Position is 1-indexed, sequential
- When item removed, reorder remaining items
- Note selection (Phase 2): allows choosing specific arrangement for this list
- List annotations: temporary notes for this performance ("key of C tonight")

---

## Migration from Current Schema

### Current Schema (V1)

```
projects (1) ──< songs (contains metadata + artist field)
             ├─< tags
             └─< lists ──< list_items
```

### New Schema (V2)

```
songs (global)
artists (global)
projects (1) ──< library_songs ──< notes
             ├─< tags
             └─< lists
```

### Migration Strategy

See [V2 Migration Plan](./v2-migration-plan.md) for detailed steps.

**High-level approach:**
1. Create new app-level `songs` and `artists` tables
2. Migrate existing project songs → global songs
3. Create `library_songs` records (project ↔ song links)
4. Create `notes` table, migrate songcode content → notes
5. Update tags/lists to reference `library_songs` instead of `songs`
6. Drop old `songs` table columns

---

## Deduplication Strategy

### Fingerprinting

```sql
-- Generated column in songs table
fingerprint TEXT GENERATED ALWAYS AS (
  lower(regexp_replace(title, '[^a-z0-9]', '', 'g'))
) STORED;

-- Same for artists
```

**Examples:**
- "Levitating (feat. DaBaby)" → `"levitatingfeatdababy"`
- "Hotel California" → `"hotelcalifornia"`
- "Don't Stop Believin'" → `"dontstopbelievin"`

### Duplicate Detection UI

When user creates song:
1. Generate fingerprint
2. Query existing songs with same fingerprint
3. Show suggestions: "Did you mean...?"
4. User can:
   - Use existing song
   - Create new (if genuinely different)
5. Track "possible duplicates" for later merging (Phase 2)

### Merging (Phase 2)

```sql
-- Add merge tracking
ALTER TABLE songs ADD COLUMN merged_into_id UUID REFERENCES songs(id);
ALTER TABLE songs ADD COLUMN merge_reason TEXT;

-- When merging song A → B:
UPDATE library_songs SET song_id = B WHERE song_id = A;
UPDATE songs SET merged_into_id = B, merge_reason = 'Duplicate' WHERE id = A;
```

---

## RLS (Row-Level Security) Policies

### Songs & Artists (Global, Read-Only for Most)

```sql
-- Anyone can view all songs
CREATE POLICY "Songs are viewable by everyone"
  ON songs FOR SELECT
  USING (true);

-- Only creator can update within 5 minutes (typo fixes)
CREATE POLICY "Users can update their songs briefly"
  ON songs FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Anyone authenticated can create songs
CREATE POLICY "Authenticated users can create songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### LibrarySong (Project-specific)

```sql
-- Users can view library songs for their projects
CREATE POLICY "Users can view their library songs"
  ON library_songs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      -- Phase 3: OR project membership
    )
  );

-- Users can add songs to their libraries
CREATE POLICY "Users can add to their library"
  ON library_songs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
```

### Notes (Project-specific via LibrarySong)

```sql
CREATE POLICY "Users can view notes for their library songs"
  ON notes FOR SELECT
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Similar for INSERT, UPDATE, DELETE
```

---

## Future Enhancements (Phase 2+)

### Public Catalog with Verified Content

```sql
CREATE TABLE public_notes (
  id UUID PRIMARY KEY,
  song_id UUID REFERENCES songs(id),
  type note_type,
  content TEXT/JSONB,
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false
);
```

**Workflow:**
1. Users contribute notes to public catalog
2. Community votes on quality
3. Moderators verify high-quality notes
4. Users can import verified notes to their libraries

### Collaboration (Multi-User Projects)

```sql
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  role TEXT, -- 'owner' | 'editor' | 'viewer'
  joined_at TIMESTAMPTZ
);
```

### Note Versioning

```sql
CREATE TABLE note_versions (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES notes(id),
  version INTEGER,
  content TEXT/JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ
);
```

### Direct Sharing via Links

```sql
-- Already in Note schema
share_token TEXT;
is_shareable BOOLEAN;

-- Share link: /share/note/{share_token}
-- Recipient can view + copy to their library
```

---

## Summary

This data model supports:
- ✅ Global song catalog with deduplication
- ✅ Multiple notes per song (different types, arrangements)
- ✅ Project-based organization (personal + shared)
- ✅ Flexible sharing (project-level or note-level)
- ✅ Progressive enhancement (start simple, add verification later)
- ✅ Scalability (PostgreSQL can handle millions of songs/notes)

Next: See [V2 Migration Plan](./v2-migration-plan.md) for implementation steps.
