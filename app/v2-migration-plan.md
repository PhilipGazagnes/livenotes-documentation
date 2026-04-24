# Livenotes V2 - Migration Plan

**Created**: April 24, 2026  
**Status**: Planning

---

## Overview

This document provides step-by-step technical instructions for migrating from the V1 architecture (project-scoped songs) to V2 architecture (global songs + multi-note system).

---

## Current State (V1)

### Existing Schema

```sql
-- V1 Tables
projects (id, owner_id, name, type, ...)
songs (id, project_id, title, artist, notes, livenotes_poc_id, ...)
artists (id, project_id, name, ...) -- project-scoped
song_artists (id, song_id, artist_id, position, ...)
songcode (song_id, songcode, livenotes_json, ...) -- 1:1 with songs
tags (id, project_id, name, ...)
song_tags (id, song_id, tag_id, ...)
lists (id, project_id, name, ...)
list_items (id, list_id, song_id, position, type, title, ...)
```

### Key Characteristics
- Songs are project-scoped (belong to one project)
- Artists are project-scoped
- One songcode per song (via separate table)
- Direct song → tag/list relationships

---

## Target State (V2)

### New Schema

```sql
-- V2 Tables
projects (no changes)

-- NEW: App-level entities
songs (id, title, fingerprint, created_by, is_verified, popularity_score, ...)
artists (id, name, fingerprint, created_by, is_verified, ...)
song_artists (id, song_id, artist_id, position, ...) -- references global songs/artists

-- NEW: Junction for projects ↔ songs
library_songs (id, project_id, song_id, added_by, custom_title, custom_notes, ...)

-- NEW: Multi-note system
notes (id, library_song_id, type, title, content, created_by, display_order, ...)

-- UPDATED: Reference library_songs instead of songs
tags (no changes - still project-scoped)
library_song_tags (id, library_song_id, tag_id, ...) -- renamed from song_tags
lists (no changes)
list_items (id, list_id, library_song_id, note_id, ...) -- updated references

-- DROPPED:
-- songcode table (migrated to notes)
-- old songs table (replaced with global songs + library_songs)
-- old artists table (replaced with global artists)
```

---

## Migration Strategy

### Approach: Blue-Green Migration

1. **Create new tables** alongside existing (V2 schema)
2. **Migrate data** from V1 → V2 tables
3. **Validate** data integrity
4. **Update application** to use V2 tables
5. **Drop V1 tables** (after safety period)

**Benefits:**
- Can rollback easily (V1 tables still exist)
- Test V2 schema without affecting V1
- Gradual cutover

---

## Phase 1: Schema Creation (Week 1, Day 1-2)

### Step 1.1: Create Global Songs Table

```sql
-- Migration: 011_create_v2_songs_table.sql

-- Create new global songs table
CREATE TABLE IF NOT EXISTS songs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  
  -- Deduplication
  fingerprint TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(title, '[^a-z0-9]', '', 'g'))
  ) STORED,
  
  -- Verification (Phase 2)
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  popularity_score INTEGER DEFAULT 0,
  
  -- Merging (Phase 2)
  merged_into_id UUID REFERENCES songs_v2(id),
  merge_reason TEXT
);

-- Indexes
CREATE INDEX idx_songs_v2_fingerprint ON songs_v2(fingerprint);
CREATE INDEX idx_songs_v2_created_by ON songs_v2(created_by);
CREATE INDEX idx_songs_v2_popularity ON songs_v2(popularity_score DESC);
CREATE INDEX idx_songs_v2_title ON songs_v2(title);

-- Full-text search
CREATE INDEX idx_songs_v2_title_fts ON songs_v2 USING gin(to_tsvector('english', title));

-- Comments
COMMENT ON TABLE songs_v2 IS 'Global song catalog (V2) - app-level songs available to all users';
COMMENT ON COLUMN songs_v2.fingerprint IS 'Normalized title for deduplication (auto-generated)';
COMMENT ON COLUMN songs_v2.popularity_score IS 'Increments when added to libraries';

-- RLS Policies
ALTER TABLE songs_v2 ENABLE ROW LEVEL SECURITY;

-- Anyone can view songs
CREATE POLICY "Anyone can view songs"
  ON songs_v2 FOR SELECT
  USING (true);

-- Authenticated users can create songs
CREATE POLICY "Authenticated users can create songs"
  ON songs_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Users can update their own songs within 5 minutes (typo fixes)
CREATE POLICY "Users can update their songs briefly"
  ON songs_v2 FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Soft delete only (mark as merged)
CREATE POLICY "Users can merge their songs"
  ON songs_v2 FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (merged_into_id IS NOT NULL);
```

### Step 1.2: Create Global Artists Table

```sql
-- Migration: 011_create_v2_songs_table.sql (continued)

-- Create new global artists table
CREATE TABLE IF NOT EXISTS artists_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  
  -- Deduplication
  fingerprint TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(name, '[^a-z0-9]', '', 'g'))
  ) STORED,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata (Phase 2)
  bio TEXT,
  image_url TEXT,
  external_links JSONB,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Merging
  merged_into_id UUID REFERENCES artists_v2(id),
  merge_reason TEXT
);

-- Indexes
CREATE INDEX idx_artists_v2_fingerprint ON artists_v2(fingerprint);
CREATE INDEX idx_artists_v2_name ON artists_v2(name);
CREATE INDEX idx_artists_v2_created_by ON artists_v2(created_by);
CREATE INDEX idx_artists_v2_name_fts ON artists_v2 USING gin(to_tsvector('english', name));

-- Comments
COMMENT ON TABLE artists_v2 IS 'Global artist catalog (V2)';

-- RLS Policies
ALTER TABLE artists_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artists"
  ON artists_v2 FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create artists"
  ON artists_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their artists briefly"
  ON artists_v2 FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );
```

### Step 1.3: Create Song-Artist Junction

```sql
-- Migration: 011_create_v2_songs_table.sql (continued)

-- Create new song-artist junction (references V2 tables)
CREATE TABLE IF NOT EXISTS song_artists_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs_v2(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists_v2(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_song_artist UNIQUE (song_id, artist_id),
  CONSTRAINT unique_song_position UNIQUE (song_id, position)
);

-- Indexes
CREATE INDEX idx_song_artists_v2_song ON song_artists_v2(song_id);
CREATE INDEX idx_song_artists_v2_artist ON song_artists_v2(artist_id);

-- RLS
ALTER TABLE song_artists_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view song-artist links"
  ON song_artists_v2 FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create links"
  ON song_artists_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Step 1.4: Create Library Songs Table

```sql
-- Migration: 012_create_library_songs.sql

-- Junction between projects and global songs
CREATE TABLE IF NOT EXISTS library_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs_v2(id) ON DELETE CASCADE,
  
  -- Tracking
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional overrides
  custom_title TEXT,
  custom_notes TEXT,
  
  -- Constraints
  CONSTRAINT unique_project_song UNIQUE (project_id, song_id)
);

-- Indexes
CREATE INDEX idx_library_songs_project ON library_songs(project_id);
CREATE INDEX idx_library_songs_song ON library_songs(song_id);
CREATE INDEX idx_library_songs_added_by ON library_songs(added_by);

-- Comments
COMMENT ON TABLE library_songs IS 'Junction between projects and global songs (user libraries)';
COMMENT ON COLUMN library_songs.custom_title IS 'Project-specific title override';
COMMENT ON COLUMN library_songs.custom_notes IS 'Project-specific general notes';

-- RLS
ALTER TABLE library_songs ENABLE ROW LEVEL SECURITY;

-- Users can view library songs for their projects
CREATE POLICY "Users can view their library songs"
  ON library_songs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Users can add songs to their libraries
CREATE POLICY "Users can add to their library"
  ON library_songs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
    AND added_by = auth.uid()
  );

-- Users can update their library songs
CREATE POLICY "Users can update their library songs"
  ON library_songs FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Users can remove from library
CREATE POLICY "Users can delete from their library"
  ON library_songs FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
```

### Step 1.5: Create Notes Table

```sql
-- Migration: 013_create_notes_table.sql

-- Note types enum
CREATE TYPE note_type AS ENUM (
  'songcode',
  'plain_text',
  'youtube',
  'image',
  'video',
  'audio',
  'tablature',
  'looper_notes',
  'lyrics',
  'chords'
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_song_id UUID NOT NULL REFERENCES library_songs(id) ON DELETE CASCADE,
  
  -- Type and content
  type note_type NOT NULL,
  title TEXT, -- optional ("Acoustic arrangement", "Sunday version")
  content TEXT, -- can be plain text or JSON string
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  
  -- Sharing (Phase 2)
  is_public BOOLEAN DEFAULT false,
  is_shareable BOOLEAN DEFAULT true,
  share_token TEXT UNIQUE,
  
  -- Constraints
  CHECK (length(trim(COALESCE(title, ''))) <= 100)
);

-- Indexes
CREATE INDEX idx_notes_library_song ON notes(library_song_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_notes_share_token ON notes(share_token) WHERE share_token IS NOT NULL;

-- Full-text search on content
CREATE INDEX idx_notes_content_fts ON notes USING gin(to_tsvector('english', content));

-- Comments
COMMENT ON TABLE notes IS 'Multi-note system - various content types per library song';
COMMENT ON COLUMN notes.content IS 'Type-specific content (text or JSON string)';
COMMENT ON COLUMN notes.display_order IS 'User-defined ordering within note type';

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes for their library songs
CREATE POLICY "Users can view notes for their library"
  ON notes FOR SELECT
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
    OR is_public = true
  );

-- Users can create notes
CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
    AND updated_by = auth.uid()
  );

-- Users can update their notes
CREATE POLICY "Users can update notes"
  ON notes FOR UPDATE
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  )
  WITH CHECK (updated_by = auth.uid());

-- Users can delete their notes
CREATE POLICY "Users can delete notes"
  ON notes FOR DELETE
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );
```

### Step 1.6: Update Tag System

```sql
-- Migration: 014_update_tags_for_library_songs.sql

-- Create new junction table for library songs ↔ tags
CREATE TABLE IF NOT EXISTS library_song_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_song_id UUID NOT NULL REFERENCES library_songs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_library_song_tag UNIQUE (library_song_id, tag_id)
);

-- Indexes
CREATE INDEX idx_library_song_tags_library_song ON library_song_tags(library_song_id);
CREATE INDEX idx_library_song_tags_tag ON library_song_tags(tag_id);

-- RLS
ALTER TABLE library_song_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for their library"
  ON library_song_tags FOR SELECT
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can tag their library songs"
  ON library_song_tags FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from library"
  ON library_song_tags FOR DELETE
  USING (
    library_song_id IN (
      SELECT id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Note: tags table itself remains unchanged (still project-scoped)
```

### Step 1.7: Update List Items

```sql
-- Migration: 015_update_list_items_for_library_songs.sql

-- Add new columns to list_items
ALTER TABLE list_items 
  ADD COLUMN IF NOT EXISTS library_song_id UUID REFERENCES library_songs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS list_annotations TEXT;

-- Update constraint: either song_id (old) or library_song_id (new) must be set
-- We'll enforce this during migration

-- Add index on new columns
CREATE INDEX idx_list_items_library_song ON list_items(library_song_id);
CREATE INDEX idx_list_items_note ON list_items(note_id) WHERE note_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN list_items.library_song_id IS 'V2: Reference to library song';
COMMENT ON COLUMN list_items.note_id IS 'Optional: specific note/arrangement for this list';
COMMENT ON COLUMN list_items.list_annotations IS 'Context-specific notes (e.g., "play in G")';
```

---

## Phase 2: Data Migration (Week 1, Day 3-4)

### Step 2.1: Migrate Songs → Songs_v2

```sql
-- Migration script: migrate_songs_to_v2.sql

-- 1. Migrate songs from V1 (project-scoped) to V2 (global)
-- Strategy: Create one global song per unique (title) fingerprint
--           If multiple projects have "Levitating", create ONE global song

WITH deduplicated_songs AS (
  SELECT
    MIN(id) as original_id, -- keep track of first occurrence
    lower(regexp_replace(title, '[^a-z0-9]', '', 'g')) as fingerprint,
    -- Use the first alphabetically title as canonical
    (array_agg(title ORDER BY title))[1] as canonical_title,
    MIN(created_by) as created_by,
    MIN(created_at) as created_at,
    NOW() as updated_at
  FROM songs
  GROUP BY fingerprint
)
INSERT INTO songs_v2 (id, title, created_by, created_at, updated_at, popularity_score)
SELECT
  gen_random_uuid() as id,
  canonical_title as title,
  created_by,
  created_at,
  updated_at,
  0 as popularity_score
FROM deduplicated_songs;

-- Create a mapping table for old song IDs → new song IDs
CREATE TEMP TABLE song_migration_map (
  old_song_id UUID,
  new_song_id UUID,
  old_fingerprint TEXT
);

INSERT INTO song_migration_map (old_song_id, new_song_id, old_fingerprint)
SELECT
  s.id as old_song_id,
  sv2.id as new_song_id,
  lower(regexp_replace(s.title, '[^a-z0-9]', '', 'g')) as old_fingerprint
FROM songs s
JOIN songs_v2 sv2 ON sv2.fingerprint = lower(regexp_replace(s.title, '[^a-z0-9]', '', 'g'));

-- Verify migration
SELECT
  COUNT(*) as old_songs,
  (SELECT COUNT(*) FROM songs_v2) as new_songs,
  (SELECT COUNT(DISTINCT old_fingerprint) FROM song_migration_map) as unique_fingerprints
FROM songs;
```

### Step 2.2: Migrate Artists → Artists_v2

```sql
-- Migration script: migrate_artists_to_v2.sql

-- Similar strategy: deduplicate by fingerprint across ALL projects

WITH deduplicated_artists AS (
  SELECT
    MIN(id) as original_id,
    lower(regexp_replace(name, '[^a-z0-9]', '', 'g')) as fingerprint,
    (array_agg(name ORDER BY name))[1] as canonical_name,
    MIN(created_by) as created_by,
    MIN(created_at) as created_at,
    NOW() as updated_at
  FROM artists
  GROUP BY fingerprint
)
INSERT INTO artists_v2 (id, name, created_by, created_at, updated_at)
SELECT
  gen_random_uuid(),
  canonical_name,
  COALESCE(created_by, (SELECT owner_id FROM projects LIMIT 1)), -- fallback if NULL
  created_at,
  updated_at
FROM deduplicated_artists;

-- Create mapping
CREATE TEMP TABLE artist_migration_map (
  old_artist_id UUID,
  new_artist_id UUID,
  old_fingerprint TEXT
);

INSERT INTO artist_migration_map (old_artist_id, new_artist_id, old_fingerprint)
SELECT
  a.id as old_artist_id,
  av2.id as new_artist_id,
  lower(regexp_replace(a.name, '[^a-z0-9]', '', 'g')) as old_fingerprint
FROM artists a
JOIN artists_v2 av2 ON av2.fingerprint = lower(regexp_replace(a.name, '[^a-z0-9]', '', 'g'));

-- Verify
SELECT
  COUNT(*) as old_artists,
  (SELECT COUNT(*) FROM artists_v2) as new_artists
FROM artists;
```

### Step 2.3: Migrate Song-Artist Relationships

```sql
-- Migration script: migrate_song_artists_to_v2.sql

INSERT INTO song_artists_v2 (song_id, artist_id, position)
SELECT DISTINCT
  smm.new_song_id,
  amm.new_artist_id,
  sa.position
FROM song_artists sa
JOIN song_migration_map smm ON sa.song_id = smm.old_song_id
JOIN artist_migration_map amm ON sa.artist_id = amm.old_artist_id
ON CONFLICT (song_id, artist_id) DO NOTHING; -- handle duplicates

-- Verify
SELECT
  COUNT(*) as old_song_artist_links,
  (SELECT COUNT(*) FROM song_artists_v2) as new_song_artist_links
FROM song_artists;
```

### Step 2.4: Create Library Songs

```sql
-- Migration script: create_library_songs.sql

-- For each song in V1, create a library_songs entry linking project → global song

INSERT INTO library_songs (project_id, song_id, added_by, added_at, custom_notes)
SELECT
  s.project_id,
  smm.new_song_id,
  COALESCE(s.created_by, p.owner_id),
  s.created_at,
  s.notes -- migrate the old "notes" field to custom_notes
FROM songs s
JOIN song_migration_map smm ON s.id = smm.old_song_id
JOIN projects p ON s.project_id = p.id;

-- Update popularity scores
UPDATE songs_v2 sv2
SET popularity_score = (
  SELECT COUNT(*) FROM library_songs ls WHERE ls.song_id = sv2.id
);

-- Verify
SELECT
  COUNT(*) as v1_songs,
  (SELECT COUNT(*) FROM library_songs) as library_songs,
  (SELECT SUM(popularity_score) FROM songs_v2) as total_popularity
FROM songs;
```

### Step 2.5: Migrate SongCode → Notes

```sql
-- Migration script: migrate_songcode_to_notes.sql

-- For each songcode entry, create a note of type 'songcode'

INSERT INTO notes (
  library_song_id,
  type,
  title,
  content,
  created_by,
  created_at,
  updated_by,
  updated_at,
  display_order
)
SELECT
  ls.id as library_song_id,
  'songcode'::note_type,
  NULL as title, -- no title for migrated songcodes
  COALESCE(sc.songcode, '') as content,
  COALESCE(sc.songcode_updated_by, ls.added_by),
  COALESCE(sc.songcode_updated_at, sc.created_at),
  COALESCE(sc.songcode_updated_by, ls.added_by),
  COALESCE(sc.songcode_updated_at, sc.created_at),
  0 as display_order
FROM songcode sc
JOIN song_migration_map smm ON sc.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
WHERE sc.songcode IS NOT NULL AND sc.songcode != '';

-- Verify
SELECT
  (SELECT COUNT(*) FROM songcode WHERE songcode IS NOT NULL) as old_songcodes,
  (SELECT COUNT(*) FROM notes WHERE type = 'songcode') as new_songcode_notes;
```

### Step 2.6: Migrate Tags

```sql
-- Migration script: migrate_tags_to_library_songs.sql

-- Tags table itself doesn't change (still project-scoped)
-- But song_tags → library_song_tags

INSERT INTO library_song_tags (library_song_id, tag_id, created_at)
SELECT DISTINCT
  ls.id as library_song_id,
  st.tag_id,
  st.created_at
FROM song_tags st
JOIN song_migration_map smm ON st.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id;

-- Verify
SELECT
  COUNT(*) as old_song_tags,
  (SELECT COUNT(*) FROM library_song_tags) as new_library_song_tags
FROM song_tags;
```

### Step 2.7: Update List Items

```sql
-- Migration script: migrate_list_items_to_library_songs.sql

-- Update list_items to reference library_songs instead of songs

UPDATE list_items li
SET library_song_id = ls.id
FROM songs s
JOIN song_migration_map smm ON s.id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
WHERE li.song_id = s.id
  AND li.type = 'song'
  AND s.project_id = (SELECT project_id FROM lists WHERE id = li.list_id);

-- Verify all song items have library_song_id
SELECT
  COUNT(*) as total_song_items,
  COUNT(library_song_id) as migrated_items,
  COUNT(*) - COUNT(library_song_id) as missing
FROM list_items
WHERE type = 'song';

-- If missing = 0, migration successful
```

---

## Phase 3: Validation (Week 1, Day 5)

### Step 3.1: Data Integrity Checks

```sql
-- Validation script: validate_v2_migration.sql

-- Check 1: All V1 songs have corresponding V2 entries
SELECT 'Songs migration' as check,
  COUNT(*) as v1_count,
  (SELECT COUNT(*) FROM song_migration_map) as mapped_count,
  (SELECT COUNT(DISTINCT new_song_id) FROM song_migration_map) as unique_v2_songs
FROM songs;

-- Check 2: All library_songs reference valid songs
SELECT 'Library songs integrity' as check,
  COUNT(*) as total,
  COUNT(song_id) as valid_songs
FROM library_songs;

-- Check 3: All notes reference valid library_songs
SELECT 'Notes integrity' as check,
  COUNT(*) as total,
  COUNT(library_song_id) as valid_library_songs
FROM notes;

-- Check 4: All tags migrated
SELECT 'Tag migration' as check,
  (SELECT COUNT(*) FROM song_tags) as old_tags,
  COUNT(*) as new_tags
FROM library_song_tags;

-- Check 5: All list items updated
SELECT 'List items migration' as check,
  COUNT(*) as total_song_items,
  COUNT(library_song_id) as migrated
FROM list_items
WHERE type = 'song';

-- Check 6: Popularity scores match
SELECT 'Popularity scores' as check,
  sv2.id as song_id,
  sv2.title,
  sv2.popularity_score as recorded,
  COUNT(ls.id) as actual
FROM songs_v2 sv2
LEFT JOIN library_songs ls ON ls.song_id = sv2.id
GROUP BY sv2.id, sv2.title, sv2.popularity_score
HAVING sv2.popularity_score != COUNT(ls.id);

-- Should return 0 rows if all correct
```

### Step 3.2: Functional Testing

**Manual Tests:**
1. ✅ Login as test user
2. ✅ View library (should see all migrated songs)
3. ✅ Create new song (should create global song + library entry)
4. ✅ Add note to song (songcode or plain text)
5. ✅ View note content
6. ✅ Edit note
7. ✅ Delete note
8. ✅ Tag song
9. ✅ Add song to list
10. ✅ Search songs (with duplicate detection)
11. ✅ Delete song from library (should not delete global song)

---

## Phase 4: Application Updates (Week 2)

### Step 4.1: Update TypeScript Types

```typescript
// src/types/database.ts

// V2 Types
export interface Song {
  id: string
  title: string
  fingerprint: string
  created_by: string
  created_at: string
  updated_at: string
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  popularity_score: number
}

export interface Artist {
  id: string
  name: string
  fingerprint: string
  created_by: string
  created_at: string
  updated_at: string
  is_verified: boolean
}

export interface LibrarySong {
  id: string
  project_id: string
  song_id: string
  added_by: string
  added_at: string
  custom_title: string | null
  custom_notes: string | null
}

export type NoteType =
  | 'songcode'
  | 'plain_text'
  | 'youtube'
  | 'image'
  | 'video'
  | 'audio'
  | 'tablature'
  | 'looper_notes'
  | 'lyrics'
  | 'chords'

export interface Note {
  id: string
  library_song_id: string
  type: NoteType
  title: string | null
  content: string
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string
  display_order: number
  is_public: boolean
  is_shareable: boolean
  share_token: string | null
}

// Extended types with relations
export interface SongWithArtists extends Song {
  artists: Artist[]
}

export interface LibrarySongWithDetails extends LibrarySong {
  song: SongWithArtists
  notes: Note[]
  tags: Tag[]
}
```

### Step 4.2: Create New Pinia Stores

```typescript
// src/stores/globalSongs.ts - For app-level songs
// src/stores/library.ts - For library management
// src/stores/notes.ts - For note CRUD
// Update src/stores/songs.ts - Repurpose or delete
```

### Step 4.3: Update Components

**Components to update:**
- `SongCard.vue` → display library song with global song data
- `SongEditPage.vue` → update to use library songs
- `AllSongsPage.vue` → rename to `LibraryPage.vue`, show library songs
- Create `NotesSection.vue` → display/edit multiple notes
- Update search components for duplicate detection

### Step 4.4: Update Routes

```typescript
// src/router/index.ts

// Update routes
{
  path: '/library', // was /songs
  name: 'library',
  component: LibraryPage
},
{
  path: '/library/:id',
  name: 'library-song-detail',
  component: LibrarySongDetailPage
}
```

---

## Phase 5: Cutover (Week 3, Day 1)

### Step 5.1: Deploy V2 Application

1. Merge V2 branch to main
2. Deploy frontend (Netlify/Vercel)
3. Monitor for errors
4. Test all critical paths

### Step 5.2: Drop Old Tables (After 30 Days)

```sql
-- Migration: 020_drop_v1_tables.sql
-- Only run after V2 is stable and validated

-- Drop old tables
DROP TABLE IF EXISTS song_tags CASCADE;
DROP TABLE IF EXISTS song_artists CASCADE; -- old version
DROP TABLE IF EXISTS songcode CASCADE;
DROP TABLE IF EXISTS songs CASCADE; -- old version
DROP TABLE IF EXISTS artists CASCADE; -- old version

-- Rename V2 tables to canonical names
ALTER TABLE songs_v2 RENAME TO songs_global;
ALTER TABLE artists_v2 RENAME TO artists_global;
ALTER TABLE song_artists_v2 RENAME TO song_artists_global;

-- Or keep _v2 suffix and update application references
```

---

## Rollback Plan

### If Critical Issues Found

**Option 1: Rollback Code**
1. Revert to previous Git commit
2. Redeploy V1 application
3. V1 tables still exist, no data loss

**Option 2: Rollback Data (if V1 tables accidentally dropped)**
1. Restore from database backup
2. Replay migration with fixes
3. Re-deploy

### Backup Strategy

```bash
# Before migration, backup production database
pg_dump -h <supabase-host> -U postgres -Fc livenotes > livenotes_v1_backup_$(date +%Y%m%d).dump

# Restore if needed
pg_restore -h <supabase-host> -U postgres -d livenotes livenotes_v1_backup_20260424.dump
```

---

## Testing Strategy

### Unit Tests
- [ ] Song creation with fingerprinting
- [ ] Artist creation with deduplication
- [ ] Library song CRUD
- [ ] Note CRUD (all types)
- [ ] Tag assignment to library songs
- [ ] List item updates

### Integration Tests
- [ ] End-to-end song creation flow
- [ ] Add song to library from catalog
- [ ] Create multiple notes for song
- [ ] Search with duplicate detection
- [ ] Tag filtering
- [ ] List management

### Performance Tests
- [ ] Query performance (library fetch <100ms)
- [ ] Search performance (<200ms)
- [ ] Bulk operations (tag 100 songs <1s)

---

## Timeline Summary

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Schema Creation | Create all V2 tables (Day 1-2) |
| 1 | Data Migration | Migrate songs, artists, notes, tags, lists (Day 3-4) |
| 1 | Validation | Data integrity checks, functional tests (Day 5) |
| 2 | Application Updates | Update stores, components, routes |
| 3 | Cutover | Deploy V2, monitor, validate |
| 4+ | Stabilization | Bug fixes, performance tuning |

---

## Success Criteria

- ✅ Zero data loss (all V1 songs/notes migrated)
- ✅ All features working (library, notes, tags, lists)
- ✅ Performance acceptable (<200ms p95)
- ✅ No critical bugs for 1 week
- ✅ User feedback positive

---

**Status**: Ready for implementation  
**Next**: Begin Phase 1 (Schema Creation)
