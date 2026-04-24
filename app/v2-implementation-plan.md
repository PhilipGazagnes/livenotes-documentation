# Livenotes V2 - Implementation Plan

**Created**: April 24, 2026  
**Status**: Planning

---

## Overview

This is the practical, step-by-step guide for implementing V2 (notes-based architecture). Follow this plan after reading the [V2 Data Model](./v2-data-model.md), [V2 Roadmap](./v2-roadmap.md), and [V2 Migration Plan](./v2-migration-plan.md).

**Goal**: Build Phase 1 MVP (global catalog + multi-note system) in 3-4 weeks.

---

## Prerequisites

- ✅ V1 running in production (catalog, tags, lists, songcode working)
- ✅ Dev environment separate from production
- ✅ Database backup strategy in place
- ✅ Git branch created (`feature/v2-notes-architecture`)

---

## Week 1: Database Migration

### Day 1-2: Schema Creation

**Goal**: Create all V2 tables in dev database

#### Task 1.1: Create Migration Files

Create migration files in order:

```bash
cd /opt/projects/livenotes-app/migrations

# Create migrations
touch 011_create_v2_songs_table.sql
touch 012_create_library_songs.sql
touch 013_create_notes_table.sql
touch 014_update_tags_for_library_songs.sql
touch 015_update_list_items_for_library_songs.sql
```

#### Task 1.2: Implement Each Migration

Copy SQL from [V2 Migration Plan](./v2-migration-plan.md) Phase 1 into each file.

**Files to create:**
- `011_create_v2_songs_table.sql` - songs_v2, artists_v2, song_artists_v2
- `012_create_library_songs.sql` - library_songs table
- `013_create_notes_table.sql` - note_type enum + notes table
- `014_update_tags_for_library_songs.sql` - library_song_tags table
- `015_update_list_items_for_library_songs.sql` - update list_items columns

#### Task 1.3: Run Migrations in Dev

```bash
# Connect to Supabase dev project
psql <dev-connection-string>

# Run migrations in order
\i migrations/011_create_v2_songs_table.sql
\i migrations/012_create_library_songs.sql
\i migrations/013_create_notes_table.sql
\i migrations/014_update_tags_for_library_songs.sql
\i migrations/015_update_list_items_for_library_songs.sql

# Verify tables created
\dt
```

**Verify:**
- [ ] All V2 tables exist
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Foreign keys correct

---

### Day 3-4: Data Migration

**Goal**: Migrate existing V1 data → V2 schema

#### Task 2.1: Create Migration Scripts

```bash
cd /opt/projects/livenotes-app/migrations

# Create data migration scripts
touch migrate_songs_to_v2.sql
touch migrate_artists_to_v2.sql
touch migrate_song_artists_to_v2.sql
touch create_library_songs.sql
touch migrate_songcode_to_notes.sql
touch migrate_tags_to_library_songs.sql
touch migrate_list_items_to_library_songs.sql
```

#### Task 2.2: Run Data Migration

Copy scripts from [V2 Migration Plan](./v2-migration-plan.md) Phase 2.

```bash
# Run in order
psql <dev-connection-string> -f migrations/migrate_songs_to_v2.sql
psql <dev-connection-string> -f migrations/migrate_artists_to_v2.sql
psql <dev-connection-string> -f migrations/migrate_song_artists_to_v2.sql
psql <dev-connection-string> -f migrations/create_library_songs.sql
psql <dev-connection-string> -f migrations/migrate_songcode_to_notes.sql
psql <dev-connection-string> -f migrations/migrate_tags_to_library_songs.sql
psql <dev-connection-string> -f migrations/migrate_list_items_to_library_songs.sql
```

**Verify after each script:**
- [ ] Row counts match expected
- [ ] No errors in console
- [ ] Data looks correct (spot check)

---

### Day 5: Validation

**Goal**: Ensure data migration was successful

#### Task 3.1: Run Validation Queries

```bash
# Create validation script
touch migrations/validate_v2_migration.sql

# Copy validation queries from V2 Migration Plan
# Run validation
psql <dev-connection-string> -f migrations/validate_v2_migration.sql
```

**Expected results:**
- ✅ All checks pass
- ✅ No missing data
- ✅ Foreign keys valid
- ✅ Counts match

#### Task 3.2: Manual Database Inspection

```sql
-- Check a few songs manually
SELECT * FROM songs_v2 LIMIT 10;
SELECT * FROM library_songs LIMIT 10;
SELECT * FROM notes LIMIT 10;

-- Check that duplicates were merged
SELECT fingerprint, COUNT(*) as count
FROM songs_v2
GROUP BY fingerprint
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check orphaned records
SELECT * FROM library_songs ls
WHERE NOT EXISTS (SELECT 1 FROM songs_v2 WHERE id = ls.song_id);
-- Should return 0 rows
```

---

## Week 2: Application Code Updates

### Day 1: Update Types & Constants

**Goal**: Update TypeScript interfaces for V2 schema

#### Task 4.1: Update Database Types

Edit `src/types/database.ts`:

```typescript
// Add new V2 types (see V2 Migration Plan Step 4.1)
export interface Song { ... }
export interface Artist { ... }
export interface LibrarySong { ... }
export interface Note { ... }
export type NoteType = ...
```

**Files to update:**
- `src/types/database.ts` - Add all V2 types
- Keep old types temporarily (mark as deprecated)

#### Task 4.2: Update Constants

Edit `src/constants/validation.ts`:

```typescript
// Add note type validation
export const NOTE_TYPES = [
  'songcode',
  'plain_text',
  // ... more types
] as const

export const NOTE_TITLE_MAX_LENGTH = 100
export const NOTE_CONTENT_MAX_LENGTH = 100000 // 100KB
```

Edit `src/constants/messages.ts`:

```typescript
// Add messages for notes
export const MESSAGES = {
  // ... existing
  notes: {
    createSuccess: 'Note created successfully',
    updateSuccess: 'Note updated',
    deleteSuccess: 'Note deleted',
    deleteConfirm: 'Delete this note?',
  },
  library: {
    addSuccess: 'Song added to library',
    removeSuccess: 'Song removed from library',
    removeConfirm: 'Remove from library?',
  },
}
```

---

### Day 2: Create New Stores

**Goal**: Build Pinia stores for V2 entities

#### Task 5.1: Create Global Songs Store

Create `src/stores/globalSongs.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Song, Artist } from '@/types/database'
import { supabase } from '@/utils/supabase'

export const useGlobalSongsStore = defineStore('globalSongs', () => {
  const songs = ref<Song[]>([])
  const artists = ref<Artist[]>([])
  
  // Search songs (with duplicate detection)
  async function searchSongs(query: string): Promise<Song[]> {
    const fingerprint = query.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const { data, error } = await supabase
      .from('songs_v2')
      .select('*')
      .or(`title.ilike.%${query}%,fingerprint.eq.${fingerprint}`)
      .order('popularity_score', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return data || []
  }
  
  // Create song
  async function createSong(title: string, artistIds: string[]): Promise<Song> {
    // 1. Create song
    const { data: song, error: songError } = await supabase
      .from('songs_v2')
      .insert({ title })
      .select()
      .single()
    
    if (songError) throw songError
    
    // 2. Link artists
    if (artistIds.length > 0) {
      const { error: linkError } = await supabase
        .from('song_artists_v2')
        .insert(
          artistIds.map((artistId, index) => ({
            song_id: song.id,
            artist_id: artistId,
            position: index + 1,
          }))
        )
      
      if (linkError) throw linkError
    }
    
    return song
  }
  
  // Create artist
  async function createArtist(name: string): Promise<Artist> {
    const { data, error } = await supabase
      .from('artists_v2')
      .insert({ name })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  // Search artists
  async function searchArtists(query: string): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists_v2')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20)
    
    if (error) throw error
    return data || []
  }
  
  return {
    songs,
    artists,
    searchSongs,
    createSong,
    createArtist,
    searchArtists,
  }
})
```

#### Task 5.2: Create Library Store

Create `src/stores/library.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LibrarySong, Song } from '@/types/database'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from './auth'

export const useLibraryStore = defineStore('library', () => {
  const authStore = useAuthStore()
  
  const librarySongs = ref<LibrarySong[]>([])
  
  // Get current project ID (from user's personal project)
  const currentProjectId = computed(() => {
    // For now, assume user has one personal project
    // In Phase 3, this will be dynamic
    return authStore.user?.personalProjectId || ''
  })
  
  // Load library for current project
  async function loadLibrary() {
    const { data, error } = await supabase
      .from('library_songs')
      .select(`
        *,
        song:songs_v2!library_songs_song_id_fkey(
          *,
          artists:song_artists_v2!song_artists_v2_song_id_fkey(
            artist:artists_v2!song_artists_v2_artist_id_fkey(*)
          )
        )
      `)
      .eq('project_id', currentProjectId.value)
      .order('added_at', { ascending: false })
    
    if (error) throw error
    librarySongs.value = data || []
  }
  
  // Add song to library
  async function addToLibrary(songId: string): Promise<LibrarySong> {
    const { data, error } = await supabase
      .from('library_songs')
      .insert({
        project_id: currentProjectId.value,
        song_id: songId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update popularity
    await supabase.rpc('increment_song_popularity', { song_id: songId })
    
    await loadLibrary()
    return data
  }
  
  // Remove from library
  async function removeFromLibrary(librarySongId: string) {
    const { error } = await supabase
      .from('library_songs')
      .delete()
      .eq('id', librarySongId)
    
    if (error) throw error
    await loadLibrary()
  }
  
  // Update custom metadata
  async function updateLibrarySong(
    librarySongId: string,
    updates: Partial<LibrarySong>
  ) {
    const { error } = await supabase
      .from('library_songs')
      .update(updates)
      .eq('id', librarySongId)
    
    if (error) throw error
    await loadLibrary()
  }
  
  return {
    librarySongs,
    currentProjectId,
    loadLibrary,
    addToLibrary,
    removeFromLibrary,
    updateLibrarySong,
  }
})
```

#### Task 5.3: Create Notes Store

Create `src/stores/notes.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, NoteType } from '@/types/database'
import { supabase } from '@/utils/supabase'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  
  // Load notes for a library song
  async function loadNotes(librarySongId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('library_song_id', librarySongId)
      .order('type')
      .order('display_order')
    
    if (error) throw error
    notes.value = data || []
  }
  
  // Create note
  async function createNote(
    librarySongId: string,
    type: NoteType,
    content: string,
    title?: string
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        library_song_id: librarySongId,
        type,
        content,
        title,
      })
      .select()
      .single()
    
    if (error) throw error
    await loadNotes(librarySongId)
    return data
  }
  
  // Update note
  async function updateNote(
    noteId: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'display_order'>>
  ) {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
    
    if (error) throw error
  }
  
  // Delete note
  async function deleteNote(noteId: string, librarySongId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
    
    if (error) throw error
    await loadNotes(librarySongId)
  }
  
  return {
    notes,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
  }
})
```

---

### Day 3: Update Existing Stores

**Goal**: Adapt tags and lists stores for V2

#### Task 6.1: Update Tags Store

Edit `src/stores/tags.ts`:

```typescript
// Update references from song_tags → library_song_tags
// Update references from song_id → library_song_id

async function tagLibrarySong(librarySongId: string, tagId: string) {
  const { error } = await supabase
    .from('library_song_tags') // was song_tags
    .insert({
      library_song_id: librarySongId, // was song_id
      tag_id: tagId,
    })
  
  if (error) throw error
}

// Similar updates for other methods
```

#### Task 6.2: Update Lists Store

Edit `src/stores/lists.ts`:

```typescript
// Update list items to use library_song_id

async function addSongToList(listId: string, librarySongId: string) {
  // Get max position
  const { data: items } = await supabase
    .from('list_items')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
  
  const maxPosition = items?.[0]?.position || 0
  
  const { error } = await supabase
    .from('list_items')
    .insert({
      list_id: listId,
      library_song_id: librarySongId, // was song_id
      position: maxPosition + 1,
      type: 'song',
    })
  
  if (error) throw error
}
```

---

### Day 4-5: Update Components

**Goal**: Update UI components for V2 data model

#### Task 7.1: Create New Components

**Create `src/components/SongSearchModal.vue`:**
- Search global songs
- Show duplicate suggestions
- Allow creating new song
- Add to library button

**Create `src/components/NotesSection.vue`:**
- Display all notes for a library song
- Grouped by type
- Add new note button
- Edit/delete actions

**Create `src/components/NoteCard.vue`:**
- Display single note
- Type-specific rendering
- Edit/delete buttons

**Create `src/components/NoteEditor.vue`:**
- Edit note content
- Syntax highlighting for songcode
- Plain text editor for other types

#### Task 7.2: Update Existing Components

**Update `src/components/SongCard.vue`:**
```vue
<template>
  <div class="song-card">
    <!-- Display global song data -->
    <h3>{{ librarySong.song.title }}</h3>
    <p v-if="artists.length > 0">{{ artistNames }}</p>
    
    <!-- Show note count -->
    <div class="note-count">
      <span>{{ noteCount }} notes</span>
    </div>
    
    <!-- Tags, lists, etc. -->
  </div>
</template>

<script setup lang="ts">
import type { LibrarySong } from '@/types/database'

const props = defineProps<{
  librarySong: LibrarySong
}>()

const artists = computed(() => props.librarySong.song.artists || [])
const artistNames = computed(() => artists.value.map(a => a.name).join(', '))
const noteCount = computed(() => props.librarySong.notes?.length || 0)
</script>
```

**Update `src/pages/AllSongsPage.vue → LibraryPage.vue`:**
- Rename file
- Update to use library store
- Add "Add Song" button → opens SongSearchModal
- Display library songs (not project songs)

**Update `src/pages/SongEditPage.vue → LibrarySongDetailPage.vue`:**
- Show global song metadata (read-only)
- Show custom notes field (project-specific)
- Add NotesSection component
- Allow editing notes

---

## Week 3: Features & UI

### Day 1: Song Creation Flow

**Goal**: Implement "Add Song to Library" flow

#### Task 8.1: SongSearchModal Component

```vue
<template>
  <ion-modal :is-open="isOpen" @did-dismiss="emit('close')">
    <div class="search-modal">
      <ion-searchbar
        v-model="searchQuery"
        placeholder="Search for a song..."
        @ionInput="handleSearch"
      />
      
      <!-- Show duplicate suggestions -->
      <div v-if="suggestions.length > 0" class="suggestions">
        <p>Did you mean?</p>
        <div v-for="song in suggestions" :key="song.id" class="suggestion">
          <div>{{ song.title }}</div>
          <button @click="addExistingSong(song)">Add to Library</button>
        </div>
      </div>
      
      <!-- Create new song -->
      <div v-if="showCreateNew" class="create-new">
        <input v-model="newSongTitle" placeholder="Song title" />
        <input v-model="newArtistName" placeholder="Artist name" />
        <button @click="createNewSong">Create & Add to Library</button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
// Implementation with debounced search, duplicate detection, etc.
</script>
```

#### Task 8.2: Artist Selection

Allow selecting/creating artists when creating songs.

---

### Day 2: Notes Management

**Goal**: Create/edit/delete notes

#### Task 9.1: NotesSection Component

```vue
<template>
  <div class="notes-section">
    <h2>Notes</h2>
    
    <!-- Group notes by type -->
    <div v-for="(typeNotes, type) in notesByType" :key="type" class="note-group">
      <h3>{{ noteTypeLabel(type) }}</h3>
      
      <NoteCard
        v-for="note in typeNotes"
        :key="note.id"
        :note="note"
        @edit="handleEdit"
        @delete="handleDelete"
      />
      
      <button @click="addNote(type)">+ Add {{ noteTypeLabel(type) }}</button>
    </div>
    
    <!-- Add new note type -->
    <select v-model="selectedNoteType">
      <option value="songcode">SongCode</option>
      <option value="plain_text">Plain Text</option>
    </select>
    <button @click="addNote(selectedNoteType)">+ Add Note</button>
  </div>
</template>

<script setup lang="ts">
// Implementation
</script>
```

#### Task 9.2: Note Editor

SongCode editor with syntax highlighting (phase 2 - for now, plain textarea).

---

### Day 3: Tags & Lists Integration

**Goal**: Update tags/lists to work with library songs

#### Task 10.1: Update Tag Modals

- BulkAssignTagsModal → use library_song_id
- FilterByTagsModal → filter library songs

#### Task 10.2: Update List Modals

- ManageListsModal → use library_song_id
- ListDetailPage → display library songs from list

---

### Day 4-5: Testing & Polish

**Goal**: Test all features, fix bugs

#### Task 11.1: Feature Testing

Test each feature:
- [ ] Search songs
- [ ] Add song to library
- [ ] Create new song
- [ ] Add note (songcode)
- [ ] Add note (plain text)
- [ ] Edit note
- [ ] Delete note
- [ ] Tag library song
- [ ] Add library song to list
- [ ] Remove from library

#### Task 11.2: UI Polish

- Loading states
- Error handling
- Empty states
- Confirmations
- Toast messages

---

## Week 4: Production Migration

### Day 1-2: Final Testing

**Goal**: Ensure everything works in dev

#### Task 12.1: Data Validation

- Verify all V1 data migrated correctly
- Spot check songs, notes, tags, lists
- Test with real production data snapshot

#### Task 12.2: Performance Testing

- Load library (should be <100ms)
- Search songs (should be <200ms)
- Create song (should be <500ms)
- Load notes (should be <50ms)

---

### Day 3: Production Migration

**Goal**: Migrate production database

#### Task 13.1: Backup Production

```bash
# Backup production database
pg_dump -h <prod-host> -U postgres -Fc livenotes > prod_backup_$(date +%Y%m%d).dump

# Download backup locally
```

#### Task 13.2: Run Migrations

```bash
# Connect to production
psql <prod-connection-string>

# Run all migrations in order
\i migrations/011_create_v2_songs_table.sql
# ... (all migration files)

# Run data migrations
\i migrations/migrate_songs_to_v2.sql
# ... (all data migration files)

# Validate
\i migrations/validate_v2_migration.sql
```

#### Task 13.3: Deploy Application

```bash
# Merge to main
git checkout main
git merge feature/v2-notes-architecture
git push origin main

# Deploy will trigger automatically on Netlify/Vercel
```

---

### Day 4-5: Monitoring & Stabilization

**Goal**: Watch for issues, fix bugs

#### Task 14.1: Monitor Errors

- Check Sentry/error logs
- Watch for RLS policy issues
- Monitor query performance

#### Task 14.2: User Testing

- Test all critical paths
- Get feedback from users
- Fix urgent bugs

---

## Success Checklist

### Database
- [x] All V2 tables created
- [x] All V1 data migrated
- [x] No orphaned records
- [x] Indexes performing well
- [x] RLS policies working

### Features
- [x] Search songs with duplicate detection
- [x] Create global songs
- [x] Add songs to library
- [x] Remove songs from library
- [x] Create notes (songcode, plain text)
- [x] Edit notes
- [x] Delete notes
- [x] Tag library songs
- [x] Add library songs to lists
- [x] All V1 features still working

### Quality
- [x] No critical bugs
- [x] Performance acceptable
- [x] UI intuitive
- [x] Error handling robust
- [x] Data integrity maintained

---

## Rollback Plan

If critical issues found:

1. **Code rollback**: Revert Git commit, redeploy
2. **Data rollback**: Restore from backup (if V1 tables dropped)
3. **Keep V1 tables for 30 days** as safety net

---

## Post-Launch

### Week 5+: Stabilization

- Monitor usage
- Fix bugs
- Performance tuning
- User feedback

### Phase 2 Planning

Once V2 stable:
- Plan advanced note types (images, videos, etc.)
- Plan verification system
- Plan public catalog

---

**Status**: Ready to begin implementation  
**Next**: Start Week 1, Day 1 - Create migration files
