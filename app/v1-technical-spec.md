# Livenotes V1 - Technical Specification

**Version**: 1.0  
**Last Updated**: March 30, 2026

This document provides complete technical specifications for Livenotes V1, including database design, validation rules, constants, and implementation details.

---

## Technology Stack

### Frontend

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **UI Library**: Ionic Vue (mobile-ready components)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS (dark mode only)
- **HTTP Client**: Supabase JavaScript SDK

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Supabase auto-generated REST API
- **Storage**: PostgreSQL only (no file storage in V1)

### Deployment

- **Frontend Hosting**: Netlify or Vercel (static SPA)
- **Backend**: Supabase (managed cloud)
- **Domain**: TBD
- **SSL**: Automatic via hosting provider

---

## Database Schema

### Complete Schema (V1)

```sql
-- Users table (managed by Supabase Auth)
-- No manual creation needed, handled by auth.users

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'shared')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Songs table (metadata only in V1)
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  notes TEXT,
  livenotes_poc_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_tag_per_project UNIQUE (project_id, name)
);

-- Song-Tag junction table
CREATE TABLE song_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_song_tag UNIQUE (song_id, tag_id)
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- List-Song junction table with ordering
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_list_song UNIQUE (list_id, song_id),
  CONSTRAINT unique_list_position UNIQUE (list_id, position)
);
```

### Indexes (Performance Optimization)

```sql
-- Projects
CREATE INDEX idx_projects_owner_id ON projects(owner_id);

-- Songs
CREATE INDEX idx_songs_project_id ON songs(project_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

-- Tags
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_tags_name ON tags(name);

-- Song Tags
CREATE INDEX idx_song_tags_song_id ON song_tags(song_id);
CREATE INDEX idx_song_tags_tag_id ON song_tags(tag_id);

-- Lists
CREATE INDEX idx_lists_project_id ON lists(project_id);
CREATE INDEX idx_lists_name ON lists(name);

-- List Items
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_song_id ON list_items(song_id);
CREATE INDEX idx_list_items_list_position ON list_items(list_id, position);
```

**Why these indexes:**
- `project_id` indexes: Every query filters by user's project (via RLS)
- `title` index: Alphabetical sorting and search
- `name` indexes: Alphabetical sorting of tags/lists
- Junction table indexes: Fast lookups for associations
- `list_position` composite: Efficient ordered list retrieval

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (owner_id = auth.uid());

-- Songs: Users can only access songs in their projects
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert songs in own projects"
  ON songs FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

-- Tags: Users can only access tags in their projects
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert tags in own projects"
  ON tags FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

-- Song Tags: Implicit through songs and tags
CREATE POLICY "Users can view own song_tags"
  ON song_tags FOR SELECT
  USING (song_id IN (
    SELECT id FROM songs WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert own song_tags"
  ON song_tags FOR INSERT
  WITH CHECK (song_id IN (
    SELECT id FROM songs WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete own song_tags"
  ON song_tags FOR DELETE
  USING (song_id IN (
    SELECT id FROM songs WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

-- Lists: Users can only access lists in their projects
CREATE POLICY "Users can view own lists"
  ON lists FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert lists in own projects"
  ON lists FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update own lists"
  ON lists FOR UPDATE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete own lists"
  ON lists FOR DELETE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

-- List Items: Implicit through lists
CREATE POLICY "Users can view own list_items"
  ON list_items FOR SELECT
  USING (list_id IN (
    SELECT id FROM lists WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert own list_items"
  ON list_items FOR INSERT
  WITH CHECK (list_id IN (
    SELECT id FROM lists WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update own list_items"
  ON list_items FOR UPDATE
  USING (list_id IN (
    SELECT id FROM lists WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete own list_items"
  ON list_items FOR DELETE
  USING (list_id IN (
    SELECT id FROM lists WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ));
```

### Database Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Validation Rules

All validation rules centralized in `constants/validation.ts`.

### Field Validations

```typescript
export const VALIDATION = {
  // Song fields
  SONG_TITLE_MIN_LENGTH: 1,
  SONG_TITLE_MAX_LENGTH: 100,
  SONG_ARTIST_MAX_LENGTH: 100,
  SONG_NOTES_MAX_LENGTH: 255,
  SONG_POC_ID_LENGTH: 4, // Exactly 4 or empty
  
  // Tag fields
  TAG_NAME_MIN_LENGTH: 1,
  TAG_NAME_MAX_LENGTH: 50,
  
  // List fields
  LIST_NAME_MIN_LENGTH: 1,
  LIST_NAME_MAX_LENGTH: 50,
  LIST_DESCRIPTION_MAX_LENGTH: 500,
  
  // Search & UI
  SEARCH_DEBOUNCE_MS: 200,
  TOAST_DURATION_MS: 3000,
  LOADING_DELAY_MS: 500, // Show spinner only if operation takes longer
} as const;
```

### Text Normalization

**Song Title and Artist:**
```typescript
function normalizeText(text: string): string {
  return text
    .trim()                          // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ');          // Multiple spaces → single space
}
```

**Applied on:**
- Song title (before save)
- Song artist (before save)
- Tag name (before save)
- List name (before save)

### Validation Functions

```typescript
// Song title validation
function validateSongTitle(title: string): string | null {
  const normalized = normalizeText(title);
  
  if (normalized.length === 0) {
    return MESSAGES.ERROR_TITLE_REQUIRED;
  }
  
  if (normalized.length > VALIDATION.SONG_TITLE_MAX_LENGTH) {
    return MESSAGES.ERROR_TITLE_TOO_LONG;
  }
  
  return null; // Valid
}

// POC ID validation
function validatePocId(pocId: string): string | null {
  if (pocId.length === 0) {
    return null; // Empty is valid
  }
  
  if (pocId.length !== VALIDATION.SONG_POC_ID_LENGTH) {
    return MESSAGES.ERROR_POC_ID_INVALID;
  }
  
  return null; // Valid
}

// Tag name validation (case-sensitive uniqueness checked in DB)
function validateTagName(name: string, existingTags: Tag[]): string | null {
  const normalized = normalizeText(name);
  
  if (normalized.length === 0) {
    return MESSAGES.ERROR_TAG_NAME_REQUIRED;
  }
  
  if (normalized.length > VALIDATION.TAG_NAME_MAX_LENGTH) {
    return MESSAGES.ERROR_TAG_NAME_TOO_LONG;
  }
  
  // Case-sensitive duplicate check
  if (existingTags.some(tag => tag.name === normalized)) {
    return MESSAGES.ERROR_TAG_ALREADY_EXISTS;
  }
  
  return null; // Valid
}

// Similar for lists...
```

---

## Constants & Messages

Centralized in `constants/` directory.

### File Structure

```
src/constants/
  ├── validation.ts       # Validation rules and limits
  ├── messages.ts         # User-facing messages
  └── routes.ts           # Route paths
```

### messages.ts

```typescript
export const MESSAGES = {
  // Success messages
  SUCCESS_SONG_CREATED: 'Song created',
  SUCCESS_SONG_UPDATED: 'Song updated',
  SUCCESS_SONG_DELETED: 'Song deleted',
  SUCCESS_SONG_DUPLICATED: 'Song duplicated',
  SUCCESS_SONGS_DELETED: (count: number) => `${count} songs deleted`,
  
  SUCCESS_TAG_CREATED: 'Tag created',
  SUCCESS_TAG_UPDATED: 'Tag renamed',
  SUCCESS_TAG_DELETED: 'Tag deleted',
  SUCCESS_TAGS_UPDATED: 'Tags updated',
  SUCCESS_TAGS_ASSIGNED: (count: number) => `Tags assigned to ${count} songs`,
  SUCCESS_TAGS_REMOVED: (count: number) => `Tags removed from ${count} songs`,
  
  SUCCESS_LIST_CREATED: 'List created',
  SUCCESS_LIST_UPDATED: 'List renamed',
  SUCCESS_LIST_DELETED: 'List deleted',
  SUCCESS_LISTS_UPDATED: 'Lists updated',
  SUCCESS_REMOVED_FROM_LIST: (listName: string) => `Removed from ${listName}`,
  SUCCESS_SONGS_ADDED_TO_LIST: (count: number, listName: string) => 
    `${count} songs added to ${listName}`,
  
  SUCCESS_ORDER_UPDATED: 'Order updated',
  
  // Error messages
  ERROR_TITLE_REQUIRED: 'Title is required',
  ERROR_TITLE_TOO_LONG: 'Title is too long (max 100 characters)',
  ERROR_ARTIST_TOO_LONG: 'Artist is too long (max 100 characters)',
  ERROR_NOTES_TOO_LONG: 'Notes are too long (max 255 characters)',
  ERROR_POC_ID_INVALID: 'POC ID must be exactly 4 characters or empty',
  
  ERROR_TAG_NAME_REQUIRED: 'Tag name is required',
  ERROR_TAG_NAME_TOO_LONG: 'Tag name is too long (max 50 characters)',
  ERROR_TAG_ALREADY_EXISTS: 'Tag already exists',
  
  ERROR_LIST_NAME_REQUIRED: 'List name is required',
  ERROR_LIST_NAME_TOO_LONG: 'List name is too long (max 50 characters)',
  ERROR_LIST_ALREADY_EXISTS: 'List already exists',
  
  ERROR_SONG_ALREADY_IN_LIST: 'Song already in list',
  ERROR_NETWORK: 'Network error. Please try again.',
  ERROR_SAVE_FAILED: 'Failed to save. Please try again.',
  
  // Confirmation messages
  CONFIRM_DELETE_SONG: (title: string) => 
    `Delete '${title}'? This cannot be undone.`,
  CONFIRM_DELETE_SONGS: (count: number) => 
    `Delete ${count} songs? This cannot be undone.`,
  CONFIRM_DELETE_TAG: (name: string) => 
    `Delete tag '${name}'? It will be removed from all songs.`,
  CONFIRM_DELETE_LIST: (name: string) => 
    `Delete list '${name}'? Songs will not be deleted.`,
  CONFIRM_UNSAVED_CHANGES: 'You have unsaved changes. Discard them?',
  
  // Empty states
  EMPTY_NO_SONGS: 'No songs yet',
  EMPTY_NO_SONGS_SUBTITLE: 'Create your first song!',
  EMPTY_NO_SEARCH_RESULTS: 'No songs match your search',
  EMPTY_NO_SEARCH_RESULTS_SUBTITLE: 'Try different keywords or clear filters',
  EMPTY_NO_FILTER_RESULTS: 'No songs with selected tags',
  EMPTY_NO_FILTER_RESULTS_SUBTITLE: 'Try different tag combinations',
  EMPTY_LIST_NO_SONGS: 'This list is empty',
  EMPTY_LIST_NO_SONGS_SUBTITLE: 'Add songs from the All Songs page',
  EMPTY_LIST_NO_SEARCH_RESULTS: 'No songs match in this list',
  EMPTY_NO_TAGS: 'No tags yet',
  EMPTY_NO_TAGS_SUBTITLE: 'Create tags to organize your songs',
  EMPTY_NO_LISTS: 'No lists yet',
  EMPTY_NO_LISTS_SUBTITLE: 'Create a list to organize your songs',
} as const;
```

### routes.ts

```typescript
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ALL_SONGS: '/',
  SONG_NEW: '/song/new',
  SONG_EDIT: (id: string) => `/song/${id}/edit`,
  LISTS: '/lists',
  LIST_DETAIL: (id: string) => `/lists/${id}`,
  TAGS: '/tags',
} as const;
```

---

## Data Operations

### Deletion Behaviors

**Hard Delete** (no soft delete in V1):

1. **Delete Song:**
   - Cascades to `song_tags` (automatic via FK)
   - Cascades to `list_items` (automatic via FK)
   - Song removed from all tags and lists

2. **Delete Tag:**
   - Cascades to `song_tags` (automatic via FK)
   - Tag removed from all songs
   - Songs remain in database

3. **Delete List:**
   - Cascades to `list_items` (automatic via FK)
   - Songs remain in database

4. **Delete Project** (not exposed in V1 UI):
   - Cascades to songs, tags, lists, and all related data
   - Complete cleanup

### Duplicate Song Behavior

```typescript
async function duplicateSong(originalSongId: string): Promise<Song> {
  const original = await fetchSong(originalSongId);
  
  const duplicate = {
    project_id: original.project_id,
    title: `${original.title} (copy)`,  // Append "(copy)"
    artist: original.artist,
    notes: original.notes,
    livenotes_poc_id: original.livenotes_poc_id,
    // created_at, updated_at auto-set
    // created_by, updated_by set by RLS/trigger
  };
  
  const newSong = await insertSong(duplicate);
  
  // Do NOT copy tag assignments
  // Do NOT copy list memberships
  
  return newSong;
}
```

### List Position Management

**Adding song to list:**
```typescript
async function addSongToList(songId: string, listId: string): Promise<void> {
  // Get max position in list
  const maxPosition = await getMaxPosition(listId); // Returns 0 if empty
  
  // Add song at bottom (max + 1)
  await insertListItem({
    list_id: listId,
    song_id: songId,
    position: maxPosition + 1,
  });
}
```

**Reordering songs in list (drag-drop):**
```typescript
async function reorderSong(
  listId: string,
  songId: string,
  newPosition: number
): Promise<void> {
  // 1. Get current position
  const currentPosition = await getSongPosition(listId, songId);
  
  // 2. Shift other songs
  if (newPosition < currentPosition) {
    // Moving up: shift songs down
    await incrementPositions(listId, newPosition, currentPosition - 1);
  } else {
    // Moving down: shift songs up
    await decrementPositions(listId, currentPosition + 1, newPosition);
  }
  
  // 3. Update song position
  await updateSongPosition(listId, songId, newPosition);
}
```

**Move up/down (arrows):**
```typescript
async function moveSongUp(listId: string, songId: string): Promise<void> {
  const currentPosition = await getSongPosition(listId, songId);
  if (currentPosition === 1) return; // Already at top
  
  // Swap with song above
  await swapPositions(listId, currentPosition, currentPosition - 1);
}

async function moveSongDown(listId: string, songId: string): Promise<void> {
  const currentPosition = await getSongPosition(listId, songId);
  const maxPosition = await getMaxPosition(listId);
  if (currentPosition === maxPosition) return; // Already at bottom
  
  // Swap with song below
  await swapPositions(listId, currentPosition, currentPosition + 1);
}
```

---

## Search & Filtering Implementation

### Search

**Client-side implementation:**

```typescript
function searchSongs(songs: Song[], searchText: string): Song[] {
  if (!searchText) return songs;
  
  const lowerSearchText = searchText.toLowerCase();
  
  return songs.filter(song => 
    song.title.toLowerCase().includes(lowerSearchText)
  );
}
```

**With debounce:**
```typescript
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((searchText: string) => {
  filteredSongs.value = searchSongs(allSongs.value, searchText);
}, VALIDATION.SEARCH_DEBOUNCE_MS);
```

### Tag Filtering (AND Logic)

```typescript
function filterSongsByTags(songs: Song[], selectedTagIds: string[]): Song[] {
  if (selectedTagIds.length === 0) return songs;
  
  return songs.filter(song => {
    const songTagIds = song.tags.map(t => t.id);
    
    // Song must have ALL selected tags (AND logic)
    return selectedTagIds.every(tagId => songTagIds.includes(tagId));
  });
}
```

### Combined Search + Filter

```typescript
function getFilteredSongs(
  allSongs: Song[],
  searchText: string,
  selectedTagIds: string[]
): Song[] {
  let result = allSongs;
  
  // Apply search filter
  result = searchSongs(result, searchText);
  
  // Apply tag filter
  result = filterSongsByTags(result, selectedTagIds);
  
  // Apply sort (always alphabetical by title)
  result = sortSongs(result);
  
  return result;
}

function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => 
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );
}
```

---

## Authentication

### Supabase Auth Configuration

**Sign Up:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/`,
  },
});
```

**Email Verification:** Required (configured in Supabase dashboard)

**Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**OAuth Providers:**
- Google
- Facebook
- Configured in Supabase dashboard

**Session Management:**
- No timeout (session persists until logout)
- Handled automatically by Supabase client

**Auto-Create Personal Project:**
```typescript
// After successful signup, trigger creates personal project
async function onUserSignUp(userId: string, email: string) {
  await supabase.from('projects').insert({
    owner_id: userId,
    name: 'My Songs',
    type: 'personal',
  });
}
```

**Implementation:** Use Supabase Database Webhook or Edge Function to trigger on auth.users insert.

---

## Error Handling

### Network Errors

**Detection:**
```typescript
try {
  const { data, error } = await supabase.from('songs').select();
  
  if (error) throw error;
  
  return data;
} catch (err) {
  if (err.message.includes('network') || err.message.includes('fetch')) {
    showToast(MESSAGES.ERROR_NETWORK, 'error');
  } else {
    showToast(MESSAGES.ERROR_SAVE_FAILED, 'error');
  }
}
```

### Validation Errors

**Client-side validation:**
- Run before API calls
- Show inline errors immediately
- Prevent invalid submissions

**Server-side validation:**
- Supabase constraints enforce database integrity
- Unique constraints, FK constraints, check constraints
- Catch and display user-friendly messages

### Error Logging

**Development:**
- Console.error for all errors
- Detailed stack traces

**Production:**
- Consider Sentry or similar (future enhancement)
- Log errors to external service
- User sees friendly messages, devs see details

---

## Performance Considerations

### Client-Side

**Strategy:**
- Fetch all user data on login (songs, tags, lists)
- Store in Pinia state
- Client-side filtering/sorting (fast with <2000 songs)
- No pagination needed

**Data Loading:**
```typescript
// On login, fetch everything need
async function loadUserData() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  // Fetch project
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId)
    .eq('type', 'personal')
    .single();
  
  const projectId = projects.id;
  
  // Fetch all songs with tags and lists (efficient query)
  const { data: songs } = await supabase
    .from('songs')
    .select(`
      *,
      song_tags (
        tag:tags (*)
      )
    `)
    .eq('project_id', projectId);
  
  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('project_id', projectId);
  
  // Fetch all lists with songs
  const { data: lists } = await supabase
    .from('lists')
    .select(`
      *,
      list_items (
        *,
        song:songs (*)
      )
    `)
    .eq('project_id', projectId);
  
  // Store in Pinia
  store.setSongs(songs);
  store.setTags(tags);
  store.setLists(lists);
}
```

**Avoiding N+1 Queries:**
- Use Supabase's nested select syntax
- Fetch related data in single query
- Example above shows proper approach

### Database

**Indexes** (already defined above) ensure:
- Fast lookups by project_id
- Fast sorting by title/name
- Fast joins on junction tables

**Query Optimization:**
- RLS policies use indexed columns
- Avoid SELECT * in production (specify fields)
- Use EXPLAIN ANALYZE to verify query plans (if issues arise)

---

## Database Migration Strategy

### Approach: Supabase Migrations

**Why:**
- Version control for schema changes
- Reproducible deployments
- Easy rollback
- Team collaboration

**Structure:**
```
supabase/
  migrations/
    20260330000001_initial_schema.sql
    20260330000002_add_indexes.sql
    20260330000003_add_rls_policies.sql
```

**Example Migration File:**
```sql
-- 20260330000001_initial_schema.sql

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'shared')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  notes TEXT,
  livenotes_poc_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ... rest of schema
```

**Running Migrations:**
```bash
# Initialize Supabase project
supabase init

# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset

# Push to production
supabase db push
```

**V1 → V2 Migration Example:**
```sql
-- 20260401000001_add_songcode_content.sql

-- Add songcode_content field for V2
ALTER TABLE songs
  ADD COLUMN songcode_content TEXT,
  ADD COLUMN parsed_json JSONB;

-- Existing songs will have NULL content (populated later)
```

**Rollback Strategy:**
- Keep migrations small and focused
- Test locally before production push
- Create backup before major schema changes
- Supabase provides point-in-time recovery

---

## Caching Strategy (No Offline for V1)

**V1 Approach:**
- Standard browser caching
- Supabase client handles connection
- No offline support (requires network)

**Future Offline Support (V2+):**
- IndexedDB for local storage
- Service Worker for offline detection
- Sync queue for offline mutations
- Conflict resolution strategy

**V1 Requirements:**
- Show error toast if network fails
- Graceful degradation
- No data loss during save operations

---

## Security Considerations

### Row Level Security (RLS)

- **Enabled on all tables:** Users can only access their own data
- **Enforced by PostgreSQL:** Even if frontend compromised, backend is secure
- **Supabase client respects RLS:** Automatic filtering

### API Security

**Supabase API Key:**
- Use `anon` key in frontend (safe to expose)
- RLS prevents unauthorized access
- No custom API needed

**Rate Limiting:**
- Supabase provides default rate limits
- Monitor usage in dashboard
- Upgrade plan if needed

### CORS

- Configure allowed origins in Supabase dashboard
- Restrict to production domain(s)

### Password Security

- Handled by Supabase Auth
- Bcrypt hashing
- Secure password reset flow

---

## Testing Strategy

### Unit Tests

**Pragmatic approach:**
- Test complex business logic (validation, filtering, reordering)
- Don't test simple CRUD
- Don't test UI components initially

**Example tests:**
```typescript
describe('Song validation', () => {
  it('should require title', () => {
    expect(validateSongTitle('')).toBe(MESSAGES.ERROR_TITLE_REQUIRED);
  });
  
  it('should trim title', () => {
    expect(normalizeText('  Hello  World  ')).toBe('Hello World');
  });
  
  it('should validate POC ID length', () => {
    expect(validatePocId('123')).toBe(MESSAGES.ERROR_POC_ID_INVALID);
    expect(validatePocId('1234')).toBe(null);
    expect(validatePocId('')).toBe(null);
  });
});

describe('Tag filtering', () => {
  it('should filter with AND logic', () => {
    const songs = [
      { id: '1', tags: ['rock', 'easy'] },
      { id: '2', tags: ['rock'] },
      { id: '3', tags: ['rock', 'easy', 'covers'] },
    ];
    
    const result = filterSongsByTags(songs, ['rock', 'easy']);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
  });
});
```

### Manual Testing Checklist

**Before Release:**
- [ ] Sign up flow
- [ ] Sign in flow
- [ ] Create song with all fields
- [ ] Create song with required fields only
- [ ] Edit song
- [ ] Delete song (with confirmation)
- [ ] Duplicate song (verify "(copy)" appended)
- [ ] Create tag
- [ ] Assign tag to song
- [ ] Remove tag from song
- [ ] Rename tag (verify all songs still have it)
- [ ] Delete tag (with confirmation, verify removed from all songs)
- [ ] Create list
- [ ] Add song to list
- [ ] Remove song from list
- [ ] Reorder songs with drag-drop
- [ ] Reorder songs with arrows
- [ ] Delete list (verify songs remain)
- [ ] Search songs (partial match, case-insensitive)
- [ ] Filter songs by tags (AND logic)
- [ ] Combined search + filter
- [ ] Uncheck all tags button
- [ ] Bulk delete songs
- [ ] Bulk add to list
- [ ] Bulk assign tags
- [ ] Bulk remove tags
- [ ] Form validation errors
- [ ] Unsaved changes warning
- [ ] Mobile responsiveness
- [ ] Toast notifications
- [ ] Empty states
- [ ] Loading states

---

## Deployment Checklist

### Initial Deployment

1. **Supabase Setup:**
   - Create project
   - Run migrations
   - Configure auth providers (Google, Facebook)
   - Enable email verification
   - Set up RLS policies
   - Configure CORS

2. **Frontend Build:**
   - Set environment variables (Supabase URL, anon key)
   - Build production bundle: `npm run build`
   - Test build locally

3. **Deploy to Netlify/Vercel:**
   - Connect GitHub repo
   - Configure build command: `npm run build`
   - Set environment variables
   - Deploy

4. **Post-Deployment:**
   - Test signup/login
   - Test all core flows
   - Monitor errors
   - Check performance

### Future Deployments

1. Git push to main branch
2. Automatic build and deploy
3. Run smoke tests
4. Monitor for errors

---

## Environment Variables

```bash
# .env.local (frontend)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

**Security:**
- Never commit real keys to git
- Use `.env.example` for documentation
- Set in hosting platform's dashboard

---

## Monitoring & Analytics

**V1:**
- Basic error logging (console)
- Supabase dashboard metrics
- Manual monitoring

**Future (V2+):**
- Error tracking (Sentry)
- Analytics (Plausible, Fathom)
- Performance monitoring (Lighthouse CI)

---

**End of Technical Specification**
