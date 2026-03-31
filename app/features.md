# Livenotes App - Feature Specifications

This document outlines all features of the Livenotes app, organized by version.

## Version Strategy

- **V1**: Song catalog and organization - track songs with metadata, tags, lists, search/filters
- **V2**: Content editing - add SongCode editor and chord chart viewer
- **V3**: Collaboration - multi-project system with sharing capabilities
- **V4+**: Advanced features - version history, real-time collaboration, public sharing, etc.

---

## [V1] Authentication & User Management

### User Accounts
- Users must be logged in to use the app
- Each user has their own account
- Authentication handled by Supabase Auth

### Personal Space
- On signup, a "personal" project is automatically created
- This personal project is the user's default workspace
- In V1, users only interact with this single project (the concept of "projects" is hidden from UI)

---

## [V3] Project System

### Multi-Project Support
- Each user can create multiple projects
- Each user can be a member of multiple projects
- Projects enable collaboration between users

### Personal vs Shared Projects
- **Personal Project**: 
  - Automatically created on signup
  - Cannot invite other members
  - Cannot receive transferred songs
  - Cannot transfer ownership
  - Remains even when user creates shared projects
- **Shared Project**:
  - Created by users for collaboration
  - Supports member invitations and role management
  - Enables song transfers between projects

### Project Switching
- Users can switch between projects while logged in
- UI includes project selector

---

## [V1] Song Management - Core CRUD

### Basic Operations
- Create new songs (metadata only)
- Edit song information
- Delete songs
- View song list

### Song Metadata (V1)
- **Title** (required, max 100 chars)
- **Artists** (optional, multiple artists per song via many-to-many relationship)
- **Notes** (optional plain text field, max 255 chars)
- **Livenotes POC ID** (optional - for migration from existing system, exactly 4 chars or empty)
- Creation and update timestamps

**Note:** Key and tempo are part of SongCode content (V2), not separate metadata fields.

### Song Storage
- Songs are stored in the database
- Each song belongs to exactly one project
- Songs are private to the user in V1
- Full song content (`songcode_content`) added in V2

---

## [V2] Song Content Editing

### Editor Features
- SongCode syntax highlighting (CodeMirror 6)
- Real-time parsing and validation
- Save functionality
- Store full song content in `songcode_content` field
- [TODO: Add specific editor features here]

### Viewer Features
- Interactive chord chart display
- Parse SongCode and render formatted output
- [TODO: Add specific viewer features here]

---

## [V3] Song Management - Advanced Operations

### Song Transfer Between Projects
- Owner can select one or more songs to transfer
- Owner specifies target project ID
- Target project owner must accept the transfer
- Accepted songs are moved to the new project
- Transferred songs receive a tag: `from <PROJECT_NAME> <DATE>`

### Song Duplication
- Songs can be duplicated to another project
- Duplicates are independent copies
- Modifying a song in one project doesn't affect its duplicate
- No link or history is maintained between duplicates

### Transfer Acceptance Flow
1. Source project owner initiates transfer
2. Target project owner receives notification/prompt
3. Target owner accepts or rejects
4. If accepted, songs move and are tagged
5. Source owner is notified of acceptance/rejection

---

## [V3] Membership & Permissions

### Role System
Three role levels per project:

1. **Owner**
   - Creates the project (becomes owner)
   - Only one owner per project
   - Can transfer ownership to another member
   - Manages member roles
   - Full access to all features

2. **Editor**
   - Create and edit songs
   - Create and manage lists
   - Manage tags
   - Cannot manage members or roles

3. **Reader**
   - View songs
   - View lists
   - Cannot create or edit

### Member Management
- Owner can invite users by email/username
- Owner can change member roles
- Owner can remove members
- Each project requires an owner at all times

---

## [V1] Artist Management

### Artist Entity
- Artists are stored as separate entities in the database
- Songs have many-to-many relationships with artists (via `SongArtist` junction table)
- Artists are scoped to projects (like tags and lists)
- In V1, only artist name is stored; additional metadata deferred to future versions

### Multiple Artists Per Song
- Songs can have multiple artists in ordered sequence
- Display format: "Artist1, Artist2, Artist3" (comma-separated)
- Order is preserved and can be modified
- Example use cases: collaborations, featuring artists, bands with guest musicians

### Artist Input & Autocomplete
- When creating/editing a song, artist field shows autocomplete suggestions
- Suggestions appear below the input as user types (free text input with suggestions)
- Suggestions filtered from existing artists in the project
- User can select from suggestions or create new artist by typing and confirming

### Creating New Artists
- User can type a new artist name not in the suggestion list
- Confirmation dialog appears before creating: "Create new artist: [name]?"
- If similar artists exist (fuzzy match), they're shown in confirmation dialog
- Example: Typing "Beatles" shows suggestion "Did you mean: The Beatles?"
- User can confirm to create new artist or select from similar matches

### Artists Management Page
- Dedicated page accessible from hamburger menu
- Lists all artists in the project
- Shows song count for each artist
- Allows editing artist names (affects all songs using that artist)
- Allows deleting artists (only if no songs reference them)
- Artists sorted alphabetically

### Artist Edit Behavior
- Editing an artist name updates it for all songs in the project
- Name normalization: trim whitespace, collapse multiple spaces to single space
- Prevents duplicate artist names (case-sensitive uniqueness per project)

### Artist Deletion
- Artists can only be deleted if no songs reference them
- If songs exist with that artist, show error: "Cannot delete artist used by X songs"
- Successfully deleted artists are permanently removed

### Data Migration
- Existing songs with artist string field will be migrated
- Extract all artist strings from songs → populate artists table
- Deduplicate exact matches automatically
- Maintain song-artist associations via junction table

---

## [V1] Organization Tools

### Tags
- Songs can have multiple tags (unlimited)
- Tag names are free-form text
- Auto-generated tags:
  - `from <PROJECT_NAME> <DATE>` when transferred [V3]
- Tags can be added and removed by the user (owner/editors in V3)
- Used for filtering in song list view

### Lists (Setlists)
- Lists contain songs in a specific order
- Useful for creating setlists
- Created and managed by the user (owner/editors in V3)
- Lists can be filtered by tags
- Songs can appear in multiple lists

---

## [V1] User Interface - Song List & Filtering

### Song List Page
- **List Selector**: Dropdown to choose which list to view
  - Default: "All Songs"
  - Followed by all user-created lists
- **Tag Filter**: Checkboxes for each tag
  - Filter songs by selected tags
- **Text Search**: Input field
  - Type to filter song titles
  - Highlights matching text in results
- **Song Items**: Display filtered results
  - Show metadata (title, artist, key, etc.)
  - Click to open details or edit

### General UI Patterns
- Project switcher (when multiple projects exist) [V3]
- Navigation between editor and viewer modes [V2]
- Responsive design for web and mobile

---

## Future Considerations (V4+)

- Real-time collaboration (multiple users editing same song)
- Version history for songs
- Comments/annotations on songs
- Export to PDF/other formats
- Advanced search (by chords, key, tempo, etc.)
- Public song sharing (read-only links)

---

**Last Updated**: March 30, 2026
