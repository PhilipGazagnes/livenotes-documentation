# Livenotes V1 - MVP Specification

**Target**: Solo use - a personal chord chart editor and library for one user (me)

**Goal**: Get a working app as quickly as possible for personal song management, while keeping the architecture clean for future V2 expansion.

---

## V1 Scope - What's IN

### ✅ Core Features

1. **Authentication**
   - Login/signup with email & password
   - Using Supabase Auth
   - No password reset or profile management yet (if needed, use Supabase dashboard)

2. **Personal Song Library**
   - Auto-created "personal project" on signup (hidden from user perspective)
   - List view of all songs
   - Simple list (no filtering, no tags, no organization - just chronological or alphabetical)

3. **Song Management**
   - Create new song
   - Edit existing song
   - Delete song
   - [TODO: Add specific CRUD details]

4. **Song Editor**
   - CodeMirror 6 integration
   - SongCode syntax highlighting
   - [TODO: Define editor features - auto-save, validation display, etc.]

5. **Chord Chart Viewer**
   - Parse SongCode using `@livenotes/songcode-converter`
   - Display formatted chord chart
   - [TODO: Define viewer features - layout, controls, etc.]

6. **Data Persistence**
   - Songs stored in Supabase PostgreSQL
   - Real-time sync not required (simple CRUD is fine)

---

## V1 Scope - What's OUT

### ❌ Deferred to V2

- ❌ Multiple projects
- ❌ User invitations / collaboration
- ❌ Role management (owner/editor/reader)
- ❌ Song transfers between projects
- ❌ Tags
- ❌ Lists/setlists
- ❌ Filtering and search
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

-- Songs table
songs (
  id uuid primary key,
  project_id uuid references projects(id) not null,
  title text not null,
  songcode_content text not null,
  parsed_json jsonb,  -- optional: cache parsed result
  created_at timestamp,
  updated_at timestamp,
  created_by uuid references users(id),
  updated_by uuid references users(id)
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

-- Similar policies for INSERT, UPDATE, DELETE
```

---

## User Experience Flow (V1)

### First-Time User

1. User visits app → redirected to login/signup
2. User creates account (email + password)
3. Backend auto-creates a personal project
4. User lands on song library (initially empty)
5. User clicks "New Song" → opens editor
6. User writes SongCode and saves
7. Song appears in library

### Returning User

1. User logs in
2. Sees list of all their songs
3. Click a song → opens editor
4. Edit and save
5. Or click "View" → opens chord chart viewer

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
- **Editor**: CodeMirror 6
- **Parser**: `@livenotes/songcode-converter` npm package

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: Supabase auto-generated REST API + client SDK

### Deployment
- **Web**: Netlify or Vercel (static SPA)
- **Mobile**: Not yet (but Capacitor-ready structure)

---

## TODO: Editor Features to Define

_Add specific requirements here:_

- [ ] Auto-save behavior (as you type? explicit save button?)
- [ ] Validation error display (inline? panel?)
- [ ] Keyboard shortcuts
- [ ] Theme (light/dark mode?)
- [ ] Font size controls
- [ ] Line numbers?
- [ ] [Add more...]

---

## TODO: Viewer Features to Define

_Add specific requirements here:_

- [ ] Layout style (columns? scrollable?)
- [ ] Font sizing controls
- [ ] Transpose controls (change key)
- [ ] Print/export functionality
- [ ] Navigation between sections
- [ ] [Add more...]

---

## TODO: Song List Features to Define

_Add specific requirements here:_

- [ ] Default sort order (alphabetical? most recent?)
- [ ] Display format (cards? table?)
- [ ] Metadata shown (title only? + date? + preview?)
- [ ] Actions on each song (edit/delete/view buttons?)
- [ ] [Add more...]

---

## Development Priorities

### Phase 1: Basic CRUD
1. Supabase project setup
2. Database schema + RLS
3. Vue app scaffold (Ionic + Vite)
4. Auth flow (login/signup pages)
5. Auto-create personal project on signup
6. Basic song list page (read)
7. Create song form (write SongCode as plain text)
8. Edit song page
9. Delete song confirmation

### Phase 2: Editor Integration
10. Integrate CodeMirror 6
11. SongCode syntax highlighting
12. Parse SongCode on save
13. Show parse errors to user

### Phase 3: Viewer
14. Chord chart viewer page
15. Parse & display formatted output
16. Basic styling for readability

### Phase 4: Polish
17. Responsive design
18. Loading states
19. Error handling
20. Basic testing

---

## Success Criteria

V1 is complete when:
- ✅ I can sign up and log in
- ✅ I can create a new song with SongCode
- ✅ I can see a list of all my songs
- ✅ I can edit an existing song
- ✅ I can delete a song
- ✅ I can view a song as a formatted chord chart
- ✅ My songs are persisted and accessible from any device
- ✅ The app works in a web browser

Mobile apps (iOS/Android) can wait until V2 or later.

---

**Next Steps**: Fill in the TODO sections above with specific requirements and implementation details.

---

**Last Updated**: February 20, 2026
