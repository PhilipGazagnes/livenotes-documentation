# Livenotes V1 - MVP Specification

**Target**: Solo use - a personal song catalog and organization system

**Goal**: Build a working catalog to track and organize my songs, establishing the foundation for future content editing (V2) and collaboration (V3).

---

## V1 Scope - What's IN

### ✅ Core Features

1. **Authentication**
   - Login/signup with email & password
   - Using Supabase Auth
   - No password reset or profile management yet (if needed, use Supabase dashboard)

2. **Personal Song Library**
   - Auto-created "personal project" on signup (hidden from user perspective)
   - List view of all songs with sorting
   - **Metadata per song**: title, artists (multiple, ordered), notes

3. **Song Management - CRUD**
   - Create new song (metadata only)
   - Edit song metadata
   - Delete song
   - View song details

4. **Tags System**
   - Create/edit/delete tags
   - Assign multiple tags to songs
   - Remove tags from songs
   - Free-form tag names

5. **Lists/Setlists**
   - Create/edit/delete lists
   - Add songs to lists (with ordering)
   - Remove songs from lists
   - View songs in a specific list

6. **Artists**
   - Create/edit/delete artists
   - Assign multiple artists to songs (with ordering)
   - Autocomplete suggestions when typing artist names
   - Artists management page

6. **Artists**
   - Create/edit/delete artists
   - Assign multiple artists to songs (with ordering)
   - Autocomplete suggestions when typing artist names
   - Artists management page

7. **Search & Filtering**
   - Text search by song title and artist
   - Filter by tags (checkbox multi-select)
   - Filter by list (dropdown selector)
   - Combined filtering (search + tags + list)

8. **Data Persistence**
   - Songs stored in Supabase PostgreSQL
   - Real-time sync not required (simple CRUD is fine)

---

## V1 Scope - What's OUT

### ❌ Deferred to V2 (Content Editing)

- ❌ SongCode editor with syntax highlighting
- ❌ Chord chart viewer
- ❌ CodeMirror 6 integration
- ❌ Full song content (`songcode_content` field)
- ❌ SongCode parsing and rendering

### ❌ Deferred to V3 (Collaboration)

- ❌ Multiple projects
- ❌ User invitations / collaboration
- ❌ Role management (owner/editor/reader)
- ❌ Song transfers between projects
- ❌ Transfer requests/acceptance flow

These features are architecturally planned (see [features.md](./features.md) and [data-model.md](./data-model.md)) but not built yet.

---

## Database Schema (V1 Only)

### Tables Required

```sql
-- Managed by Supabase Auth
users (
  id uuid primary key,
  email text unique not null,
  created_at timestamp
)

-- Projects table (even though only personal project exists in V1)
projects (
  id uuid primary key,
  name text not null,
  type text not null check (type in ('personal', 'shared')),
  owner_id uuid references users(id) not null,
  created_at timestamp,
  updated_at timestamp
)

-- Songs table (metadata only in V1)
songs (
  id uuid primary key,
  project_id uuid references projects(id) not null,
  title text not null,  -- max 100 chars, normalized
  notes text,  -- max 255 chars, plain text
  livenotes_poc_id text,  -- exactly 4 chars or NULL, user-editable
  created_at timestamp,
  updated_at timestamp,
  created_by uuid references users(id),
  updated_by uuid references users(id)
)

-- Artists table
artists (
  id uuid primary key,
  project_id uuid references projects(id) not null,
  name text not null,  -- artist name, normalized
  created_at timestamp,
  updated_at timestamp,
  UNIQUE(project_id, name)
)

-- Song-Artist junction table with ordering
song_artists (
  id uuid primary key,
  song_id uuid references songs(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  position integer not null,  -- order of artist for display (1, 2, 3, ...)
  created_at timestamp,
  UNIQUE(song_id, artist_id),
  UNIQUE(song_id, position)
)

-- Tags table
tags (
  id uuid primary key,
  project_id uuid references projects(id) not null,
  name text not null,
  created_at timestamp,
  UNIQUE(project_id, name)
)

-- Song-Tag junction table
song_tags (
  id uuid primary key,
  song_id uuid references songs(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  created_at timestamp,
  UNIQUE(song_id, tag_id)
)

-- Lists table
lists (
  id uuid primary key,
  project_id uuid references projects(id) not null,
  name text not null,
  description text,
  created_at timestamp,
  updated_at timestamp,
  created_by uuid references users(id)
)

-- List-Song junction table with ordering
list_items (
  id uuid primary key,
  list_id uuid references lists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  position integer not null,
  added_at timestamp,
  UNIQUE(list_id, song_id),
  UNIQUE(list_id, position)
)
```

### Row Level Security (RLS)

```sql
-- Users can only access their own personal project
CREATE POLICY "Users can view own project"
  ON projects FOR SELECT
  USING (owner_id = auth.uid());

-- Users can only access songs in their own project
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

-- Similar policies for INSERT, UPDATE, DELETE on all tables
-- Tags, Lists, Artists, SongTags, SongArtists, ListItems all scoped to user's project
```

---

## User Experience Flow (V1)

### First-Time User

1. User visits app → redirected to login/signup
2. User creates account (email + password)
3. Backend auto-creates a personal project
4. User lands on song library (initially empty)
5. User clicks "New Song" → opens create form
6. User enters song metadata (title, artist, key, tempo, notes)
7. User saves → song appears in library
8. User can add tags and create lists to organize songs

### Returning User

1. User logs in
2. Sees list of all their songs
3. Can search, filter by tags, or view by list
4. Click a song → opens detail view / edit form
5. Edit metadata and save
6. Manage tags and lists

### No Project Selection
- User doesn't see "projects" anywhere in V1 UI
- Everything just works as "my songs"
- Backend knows it's using the personal project

---

## Tech Stack (V1)

### Frontend
- **Framework**: Vue 3 (Composition API) + TypeScript
- **UI**: Ionic Vue (for future mobile support)
- **Build**: Vite
- **State Management**: Pinia (for managing songs, tags, lists)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: Supabase auto-generated REST API + client SDK

### Deployment
- **Web**: Netlify or Vercel (static SPA)
- **Mobile**: Not yet (but Capacitor-ready structure)

---

## Song Form Specifications

**Fields:**
- **Title** (required): Text input, max 100 characters, trimmed and normalized
- **Artists** (optional): Free text input with autocomplete suggestions, can add multiple artists in order
- **Notes** (optional): Textarea, max 255 characters, plain text, 3-4 rows
- **POC ID** (optional): Text input, exactly 4 characters or empty, user-editable

**Validation:**
- Client-side validation before submit
- Inline error messages below fields
- Required field indicator: * asterisk
- Save button disabled while saving

**Behavior:**
- Explicit save button (not auto-save)
- Unsaved changes warning on navigation
- Cancel button with confirmation if form dirty
- Tags and lists NOT assigned during creation (only after)

**See:** [v1-ui-spec.md](./v1-ui-spec.md) for complete UI details

---

## Artist Management Specifications

**Artist Properties:**
- Name: max 100 characters, case-sensitive, normalized (trimmed, single spaces)
- No maximum artists per song or per project
- Unique per project (case-sensitive)
- Artists are scoped to projects (like tags and lists)

**Operations:**
- Create: Via Artists page or inline when adding to song (with autocomplete)
- Assign to song: Free text input with suggestions, can add multiple in order
- Edit name: On Artists page, updates name for all songs
- Delete: Only if no songs reference the artist
- Reorder: When song has multiple artists, order can be changed

**Autocomplete Behavior:**
- As user types in artist field, suggestions appear below input
- Suggestions filtered from existing artists in project
- User can select from suggestions or create new artist
- When creating new artist, show confirmation: "Create new artist: [name]?"
- If similar artists exist (fuzzy match), show in confirmation dialog
- Example: "Did you mean: The Beatles?" with option to select or proceed with new name

**Artist Display:**
- Multiple artists shown comma-separated: "Artist1, Artist2, Artist3"
- Order preserved from `SongArtist.position` field
- Displayed on song cards in song list

**Artists Page:**
- Accessible from hamburger menu
- Lists all artists alphabetically
- Shows song count for each artist
- Inline edit for artist names
- Delete button (disabled if songs exist)
- Error message if trying to delete artist with songs: "Cannot delete artist used by X songs"

**Data Migration:**
- Extract all existing `song.artist` string values
- Create artist records, deduplicate exact matches
- Create `song_artists` records linking songs to artists
- Maintain original song-artist associations

**See:** [v1-ui-spec.md](./v1-ui-spec.md) and [v1-technical-spec.md](./v1-technical-spec.md) for complete details

---

## Tag Management Specifications

**Tag Properties:**
- Name: max 50 characters, case-sensitive
- No character restrictions, spaces allowed
- No maximum tags per song or per user
- Unique per project (case-sensitive)

**Operations:**
- Create: Via "Manage Tags" modal or Tags page
- Assign: Checkbox interface in modal
- Rename: Inline edit on Tags page, updates all associations
- Delete: With confirmation, removes from all songs

**Behavior:**
- Can create new tag inline when assigning to song
- Duplicate detection (case-sensitive): show error toast
- Tag filter uses AND logic (song must have ALL selected tags)

**See:** [v1-ui-spec.md](./v1-ui-spec.md) and [v1-technical-spec.md](./v1-technical-spec.md) for complete details

---

## List Management Specifications

**List Properties:**
- Name: max 50 characters
- Description: optional, max 500 characters
- No maximum songs per list or lists per user
- Empty lists allowed

**Song Ordering:**
- New songs added to bottom of list (max position + 1)
- Reorder via drag-and-drop or up/down arrows
- Position managed only on List Detail page, not in "Manage Lists" modal

**Operations:**
- Create: Via Lists page or inline in "Manage Lists" modal
- Add/Remove songs: Checkbox interface in modal
- Reorder: Drag-and-drop + arrow buttons on List Detail page
- Rename: On Lists page
- Delete: With confirmation, songs remain in database

**Behavior:**
- Can create new list inline when assigning song to lists
- Duplicate song detection: show toast if trying to add song already in list
- Lists sorted alphabetically by name

**See:** [v1-ui-spec.md](./v1-ui-spec.md) and [v1-technical-spec.md](./v1-technical-spec.md) for complete details

---

## Song List Specifications

**Display:**
- Format: Full-width cards (one per row)
- Shown: Title (bold), Artist, Tags (chips with 🏷️), Lists (chips with 📋)
- Sort: Alphabetical by title (A-Z)
- No click action on card in V1 (reserved for V2 chart viewer)

**Search & Filter:**
- Search: Sticky bottom bar with search input + filter button
- Filter button: Opens modal with tag checkboxes
- Search: Real-time, 200ms debounce, case-insensitive, partial match, title only
- Tag filter: AND logic (must have ALL selected tags)
- Combined: Search + tags work together
- "Uncheck all" button in filter modal

**Actions:**
- Per song dropdown: Edit, Duplicate, Manage Tags, Manage Lists, Delete
- Bulk selection mode: Checkboxes appear, bulk delete/add to list/assign tags
- Select all / Deselect all buttons

**Performance:**
- Client-side filtering and sorting
- All songs loaded on page load
- No pagination (user may have 1000+ songs)

**See:** [v1-ui-spec.md](./v1-ui-spec.md) for complete UI details

---

## Development Priorities

### Phase 1: Basic Infrastructure
1. Supabase project setup
2. Database schema + RLS (all V1 tables)
3. Vue app scaffold (Ionic + Vite)
4. Auth flow (login/signup pages)
5. Auto-create personal project on signup

### Phase 2: Song CRUD
6. Basic song list page (read)
7. Create song form (metadata fields)
8. Edit song page
9. Delete song confirmation
10. Song detail view

### Phase 3: Tags
11. Tag creation/management
12. Assign tags to songs
13. Display tags on song list items
14. Tag filter UI (checkboxes)

### Phase 4: Artists
15. Artist creation/management
16. Artist autocomplete in song form
17. Assign multiple artists to songs (with ordering)
18. Display artists on song list items
19. Artists management page
20. Migrate existing artist strings to artist table

### Phase 5: Lists
21. List creation/management
22. Add/remove songs from lists
23. List selector dropdown
24. View songs in a list
25. Song ordering within lists

### Phase 6: Search & Filtering
26. Text search implementation
27. Combined filtering (search + tags + list)
28. Filter UI polish
29. Empty states and no-results handling

### Phase 7: Polish
30. Responsive design
31. Loading states
32. Error handling
33. Basic testing
34. Performance optimization

---

## Success Criteria

V1 is complete when:
- ✅ I can sign up and log in (email + Google/Facebook)
- ✅ I can create songs with metadata (title, artists, notes, POC ID)
- ✅ I can assign multiple artists to a song in ordered sequence
- ✅ Artist autocomplete suggests existing artists as I type
- ✅ I can create new artists with confirmation dialog
- ✅ I can see a list of all my songs with artists displayed
- ✅ I can edit song metadata including artists
- ✅ I can delete songs (with confirmation)
- ✅ I can duplicate songs (appends "(copy)" to title)
- ✅ I can create and manage artists (create, rename, delete)
- ✅ Artist edits update all songs using that artist
- ✅ I cannot delete artists that are used by songs
- ✅ I can create and manage tags (create, rename, delete)
- ✅ I can assign multiple tags to songs
- ✅ I can create and manage lists/setlists
- ✅ I can add songs to lists with custom ordering (drag-drop + arrows)
- ✅ I can search songs by title (real-time, debounced)
- ✅ I can filter songs by tags (AND logic, multi-select)
- ✅ Search and tag filtering work together
- ✅ I can bulk delete songs, bulk add to lists, bulk assign/remove tags
- ✅ My data is persisted and accessible from any device
- ✅ The app works in a web browser (mobile-first, responsive)
- ✅ Dark mode UI with Tailwind CSS
- ✅ All confirmations, toasts, and empty states work correctly
- ✅ Existing artist data migrated to new artist table structure

V2 will add: SongCode editor and chord chart viewer
V3 will add: Collaboration features (multi-project, sharing, roles)

Mobile apps (iOS/Android) can wait until later versions.

---

**Complete Specifications:**
- See [v1-ui-spec.md](./v1-ui-spec.md) for all UI/UX details
- See [v1-technical-spec.md](./v1-technical-spec.md) for all technical implementation details
- All TODO sections have been resolved and documented

---

**Last Updated**: March 30, 2026
