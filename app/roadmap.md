# Livenotes App - Product Roadmap

This document provides the vision and development strategy for the Livenotes app.

---

## Vision

**Build a cross-platform chord chart editor that lets musicians write, organize, and share songs using SongCode syntax.**

Start simple (personal use), then grow into a collaborative tool for bands and worship teams.

---

## Why This Roadmap?

### The Challenge
Building a fully-featured collaborative music app is a big undertaking. If we try to build everything at once, we risk:
- Getting overwhelmed and never shipping
- Building features that don't get used
- Making architectural mistakes that are hard to fix later

### The Solution: Incremental Delivery

**V1**: Build a song catalog and organization system for solo use. Get it in my hands quickly to start organizing my songs.

**V2**: Add SongCode editor and chord chart viewer for full content management.

**V3**: Add collaboration features for working with others (multi-project, sharing, roles).

**V4+**: Based on real usage, add advanced features like version history, public sharing, offline mode, etc.

---

## Version 1: Song Catalog & Organization

**Status**: 📝 Planning → 🚧 Development

**Goal**: Build a catalog system to track and organize songs

**Timeline**: [TODO: estimate]

### What's Included
- Authentication (login/signup)
- Personal song library (metadata only: title, artist, key, tempo, etc.)
- Create/edit/delete songs
- **Tags** for categorization
- **Lists** for setlists and collections
- **Search** and **filtering** UI
- Basic song list view with sorting

### What's NOT Included
- SongCode editor (no content editing yet)
- Chord chart viewer
- Full SongCode content management
- Collaboration (projects, members, roles)

### Technical Approach
- Web app only (mobile comes later)
- Supabase for backend (PostgreSQL + Auth)
- Vue 3 + Ionic (for future mobile readiness)
- Focus on catalog and organization features

### Why This Works
- Addresses immediate need: organizing existing songs
- Gets a functional catalog in my hands fast
- Can track songs even without full content
- Validates organization patterns before adding editor complexity
- Establishes architecture for future growth

### Success Metrics
- I'm using it regularly to track my songs
- Can find songs quickly using tags and search
- Lists help me organize setlists
- Organization system feels intuitive
- No major technical debt blocking V2

---

## Version 2: SongCode Editor & Viewer

**Status**: 🔮 Planned

**Goal**: Add full content management with SongCode editing and chord chart viewing

**Timeline**: [TODO: after V1 ships and stabilizes]

### What's Added
- **SongCode editor** with syntax highlighting (CodeMirror 6)
- **Chord chart viewer** with formatted display
- Parse and validate SongCode in real-time
- Store full song content (`songcode_content` field)
- Edit mode / view mode switching

### Why Wait Until V2?
- V1 validates the organization system first
- Editor and parser add significant complexity
- Can organize songs by metadata alone initially
- Need to ensure catalog UX is solid before adding content editing
- SongCode parser is already built and ready to integrate

### Technical Additions
- CodeMirror 6 integration
- `@livenotes/songcode-converter` npm package integration
- Song content storage and parsing pipeline
- Viewer rendering components
- Editor/viewer UI components

### Migration Path from V1 to V2
1. Existing songs keep their metadata
2. Add `songcode_content` field to songs
3. Users can now add full song content to existing catalog entries
4. Editor and viewer modes become available
5. Organization features (tags, lists, search) continue to work

**Zero disruption**: V1 song catalog remains intact, content editing is purely additive.

---

## Version 3: Collaborative Projects

**Status**: 🔮 Planned

**Goal**: Enable sharing songs with bandmates and collaborators

**Timeline**: [TODO: after V2 ships and stabilizes]

### What's Added
- Multi-project system
- Invite members to projects
- Role management (owner/editor/reader)
- Song transfer between projects (with approval)
- Permission management and sharing

### Why Wait Until V3?
- V1 and V2 validate solo workflows first
- Collaboration adds significant complexity
- Need to test organization and editing patterns before sharing
- Database is already designed for V3 (no major refactor needed)

### Technical Additions
- ProjectMembership table and RLS policies
- Transfer request workflow
- Real-time updates (Supabase subscriptions)
- Complex permissions system
- Project switcher UI

### Migration Path from V2 to V3
1. User's existing personal project stays as-is
2. Add ability to create new shared projects
3. Add project switcher UI
4. Personal project remains private (no invites allowed)
5. User can now collaborate in shared projects

**Zero disruption**: V2 users keep working exactly as before, with new features available if they want them.

---

## Version 4+: Advanced Features

**Status**: 💭 Ideas

These are features that could come after V3, based on real user needs:

### Possible Features
- **Offline Mode**: Work without internet, local caching with sync queue, conflict resolution (complex, deferred from V1)
- **Version History**: See past revisions of songs, restore old versions
- **Real-time Collaboration**: Multiple users editing same song simultaneously (Google Docs style)
- **Public Sharing**: Generate read-only links to share songs publicly
- **Advanced Search**: Search by chords, key, tempo, lyrics, metadata
- **Export**: PDF export, plain text, ChordPro format
- **Transposition**: Change key of entire song
- **Audio**: Attach audio recordings or links to songs
- **Mobile Apps**: Native iOS/Android apps (or just Capacitor-wrapped PWA)
- **Custom Templates**: Reusable song structures
- **Comments**: Add notes/annotations to songs
- **Activity Feed**: See what changed in a project

### Prioritization Criteria
Wait until V3 is being used regularly, then ask:
- What features are users requesting most?
- What friction points exist in current workflow?
- What features justify their complexity?

---

## Architectural Future-Proofing

Even though we're building incrementally, the architecture is designed for the full roadmap:

### Database
- `projects` table exists in V1 (even though only personal projects are used)
- `type` field distinguishes personal vs shared
- Tag, List, and junction tables in V1
- Easy to add membership and collaboration tables in V3

### Frontend
- Ionic Vue = web + mobile from same codebase
- Clean separation: catalog, editor, viewer, library as components
- State management ready for multi-project switching

### Backend
- Supabase scales easily
- Row Level Security can be extended for complex permissions
- Real-time capabilities available when needed

### Parser
- `@livenotes/songcode-converter` is a separate npm package
- Can be updated independently
- Ready to integrate in V2

---

## Key Principles

1. **Ship frequently**: Small versions that work, not big versions that don't exist yet
2. **Use it daily**: Build for real needs, not imagined ones
3. **Minimize complexity**: Every feature has a cost, earn it
4. **Clean architecture**: But don't over-engineer for hypothetical futures
5. **Feedback-driven**: Let real usage guide what comes next

---

## Current Status

- ✅ SongCode language designed and documented
- ✅ `@livenotes/songcode-converter` npm package built and tested
- ✅ App documentation structure created
- ✅ Roadmap restructured (V1-V4)
- ✅ V1 complete specifications ready:
  - [v1-mvp-spec.md](./v1-mvp-spec.md) - Overview and scope
  - [v1-ui-spec.md](./v1-ui-spec.md) - Complete UI/UX specifications
  - [v1-technical-spec.md](./v1-technical-spec.md) - Complete technical implementation details
- ✅ Data model designed (V1-V3) in [data-model.md](./data-model.md)
- ✅ All features specified in [features.md](./features.md)
- 🚀 Ready to start V1 development
- ⏳ V1 deployment (not started)

---

**Last Updated**: March 30, 2026
