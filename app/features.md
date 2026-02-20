# Livenotes App - Feature Specifications

This document outlines all features of the Livenotes app, organized by version.

## Version Strategy

- **V1**: Solo/personal use - get a working app for personal song management
- **V2**: Collaborative features - multi-project system with sharing capabilities

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

## [V2] Project System

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
- Create new songs using SongCode syntax
- Edit existing songs
- Delete songs
- View songs in chord chart viewer

### Song Storage
- Songs are stored in the database
- Each song belongs to exactly one project
- Songs are private to the user in V1

### Editor Features
- SongCode syntax highlighting (CodeMirror 6)
- Real-time parsing and validation
- Save functionality
- [TODO: Add specific editor features here]

### Viewer Features
- Interactive chord chart display
- [TODO: Add specific viewer features here]

---

## [V2] Song Management - Advanced Operations

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

## [V2] Membership & Permissions

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

## [V2] Organization Tools

### Tags
- Songs can have multiple tags (unlimited)
- Tag names are free-form text
- Auto-generated tags:
  - `from <PROJECT_NAME> <DATE>` when transferred
- Tags can be added and removed by owner and editors
- Used for filtering in song list view

### Lists (Setlists)
- Lists contain songs in a specific order
- Useful for creating setlists
- Created and managed by owner and editors
- Lists can be filtered by tags
- Songs can appear in multiple lists

---

## [V2] User Interface - Song List & Filtering

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
  - Click to open in editor/viewer

### General UI Patterns
- Project switcher (when multiple projects exist)
- Navigation between editor and viewer modes
- Responsive design for web and mobile

---

## Future Considerations (V3+)

- Real-time collaboration (multiple users editing same song)
- Version history for songs
- Comments/annotations on songs
- Export to PDF/other formats
- Advanced search (by chords, key, tempo, etc.)
- Public song sharing (read-only links)

---

**Last Updated**: February 20, 2026
