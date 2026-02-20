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

**V1**: Build a minimal but useful app for solo use. Get it in my hands quickly and start using it daily.

**V2**: Once V1 proves the concept and is being used regularly, add collaboration features for working with others.

**V3+**: Based on real usage, add advanced features like version history, public sharing, advanced search, etc.

---

## Version 1: Personal Song Library

**Status**: 📝 Planning → 🚧 Development

**Goal**: A working app for managing my personal chord charts

**Timeline**: [TODO: estimate]

### What's Included
- Authentication (login/signup)
- Personal song library
- Create/edit/delete songs
- SongCode editor with syntax highlighting
- Chord chart viewer

### What's NOT Included
- Collaboration (projects, members, roles)
- Organization tools (tags, lists)
- Advanced UI features (search, filters)

### Technical Approach
- Web app only (mobile comes later)
- Supabase for backend (PostgreSQL + Auth)
- Vue 3 + Ionic (for future mobile readiness)
- CodeMirror 6 for editing

### Why This Works
- Gets a functional app in my hands fast
- Validates the core value: writing and viewing chord charts
- Tests the SongCode syntax and parser in real usage
- Establishes architecture for future growth

### Success Metrics
- I'm using it regularly for my songs
- SongCode syntax feels natural
- Editor and viewer are pleasant to use
- No major technical debt blocking V2

---

## Version 2: Collaborative Projects

**Status**: 🔮 Planned

**Goal**: Enable sharing songs with bandmates and collaborators

**Timeline**: [TODO: after V1 ships and stabilizes]

### What's Added
- Multi-project system
- Invite members to projects
- Role management (owner/editor/reader)
- Song transfer between projects (with approval)
- Tags for organization
- Lists for setlists
- Filtering and search UI

### Why Wait Until V2?
- V1 validates the core concept first
- Collaboration adds significant complexity
- Need to test SongCode workflow solo before sharing
- Database and architecture are already designed for V2 (no major refactor needed)

### Technical Additions
- ProjectMembership table and RLS policies
- Tag, List, and junction tables
- Transfer request workflow
- Real-time updates (Supabase subscriptions)
- More complex permissions system

### Migration Path from V1 to V2
1. User's existing personal project stays as-is
2. Add ability to create new shared projects
3. Add project switcher UI
4. Personal project remains private (no invites allowed)
5. User can now collaborate in shared projects

**Zero disruption**: V1 users keep working exactly as before, with new features available if they want them.

---

## Version 3+: Advanced Features

**Status**: 💭 Ideas

These are features that could come after V2, based on real user needs:

### Possible Features
- **Version History**: See past revisions of songs, restore old versions
- **Real-time Collaboration**: Multiple users editing same song simultaneously (Google Docs style)
- **Public Sharing**: Generate read-only links to share songs publicly
- **Advanced Search**: Search by chords, key, tempo, lyrics, etc.
- **Export**: PDF export, plain text, ChordPro format
- **Transposition**: Change key of entire song
- **Audio**: Attach audio recordings or links to songs
- **Mobile Apps**: Native iOS/Android apps (or just Capacitor-wrapped PWA)
- **Offline Mode**: Work without internet, sync when back online
- **Custom Templates**: Reusable song structures
- **Comments**: Add notes/annotations to songs
- **Activity Feed**: See what changed in a project

### Prioritization Criteria
Wait until V2 is being used regularly, then ask:
- What features are users requesting most?
- What friction points exist in current workflow?
- What features justify their complexity?

---

## Architectural Future-Proofing

Even though we're building V1 first, the architecture is designed for V2 from the start:

### Database
- `projects` table exists in V1 (even though only personal projects are used)
- `type` field distinguishes personal vs shared
- Easy to add membership and collaboration tables later

### Frontend
- Ionic Vue = web + mobile from same codebase
- Clean separation: editor, viewer, library as components
- State management ready for multi-project switching

### Backend
- Supabase scales easily
- Row Level Security can be extended for complex permissions
- Real-time capabilities available when needed

### Parser
- `@livenotes/songcode-converter` is a separate npm package
- Can be updated independently
- Works the same in V1, V2, and beyond

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
- ✅ V1 and V2 features specified
- ✅ Data model designed (V1 + V2)
- 🚧 V1 MVP detailed specification (in progress)
- ⏳ V1 development (not started)
- ⏳ V1 deployment (not started)

---

**Last Updated**: February 20, 2026
