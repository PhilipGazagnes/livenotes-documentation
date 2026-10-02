# Livenotes App Documentation

Documentation for the Livenotes application - a cross-platform song catalog and chord chart editor.

## Overview

The Livenotes App is a web and mobile application that allows musicians to:
- **V1**: Organize songs with metadata, tags, lists, search, and filtering
- **V2**: Write and edit songs using SongCode syntax with syntax highlighting
- **V2**: Visualize chord charts in an interactive viewer
- **V3**: Collaborate with other musicians (multi-project, sharing, roles)
- **V4+**: Advanced features (offline mode, version history, public sharing, etc.)

## Documentation Structure

> **Current direction (2026-10-02):** see **[Strategy 2026](./strategy-2026.md)** and the **[Decision records](./decisions/README.md)**. They supersede the "single Ionic/Capacitor codebase" plan below: web stays Vue, mobile becomes a separate React Native (Expo) app.

### Core Documents

- **[Roadmap](./roadmap.md)** - Product vision and development strategy (V1-V4) ⚠️ **Superseded by V2 Roadmap**
- **[Features](./features.md)** - Feature specifications organized by version ⚠️ **Superseded by V2 docs**
- **[Data Model](./data-model.md)** - Database schema and entity relationships ⚠️ **Superseded by V2 Data Model**

### V1 Specifications (✅ Complete - In Production)

- **[V1 MVP Spec](./v1-mvp-spec.md)** - Overview and scope of Version 1
- **[V1 UI/UX Spec](./v1-ui-spec.md)** - Complete UI/UX specifications (all screens, flows, interactions)
- **[V1 Technical Spec](./v1-technical-spec.md)** - Complete technical implementation details (database, validation, constants, deployment)

### V2 Specifications (📝 Planning Complete - Ready for Implementation)

**V2 represents a fundamental architectural shift to a notes-based system with global song catalog.**

- **[V2 Architecture Summary](./v2-architecture-summary.md)** - **START HERE** - Executive overview and key decisions
- **[V2 Data Model](./v2-data-model.md)** - Complete V2 schema (global songs, library, multi-notes)
- **[V2 Roadmap](./v2-roadmap.md)** - Phased development strategy (MVP → Verification → Collaboration)
- **[V2 Migration Plan](./v2-migration-plan.md)** - Step-by-step SQL migrations from V1 → V2
- **[V2 Implementation Plan](./v2-implementation-plan.md)** - Week-by-week development tasks

### V3 Specifications (📝 Planning Complete)

**V3 introduces multi-user projects, roles, note sharing, and the community project.**

- **[Projects & Users](./projects-and-users.md)** - **START HERE for V3** - User model, project types, roles, membership, invitation flow, note push flow, drawer UX, and personal project deprecation

### Additional Resources

- **[Tech Stack](./tech-stack.md)** - Technology choices and rationale

## Tech Stack (V1)

### Frontend
- **Framework**: Vue 3 (Composition API)
- **UI Library**: Ionic Vue (mobile-ready components)
- **Styling**: Tailwind CSS (dark mode)
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Pinia

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email + OAuth providers)
- **API**: Supabase auto-generated REST API

### Deployment
- **Web**: Netlify or Vercel (static SPA)
- **Mobile**: Not in V1 (Capacitor-ready structure for future)

### Key Dependencies
- `@livenotes/songcode-converter` - Core SongCode parser (used in V2+)
- `@supabase/supabase-js` - Supabase client SDK

## Version Strategy

**V1: Song Catalog & Organization**
- Focus on organizing songs with metadata, tags, lists, search, filtering
- No SongCode editor or viewer yet
- Web-only, mobile-first responsive design
- **Goal**: Get a working catalog system in use quickly

**V2: Content Editing**
- Add CodeMirror 6 for SongCode editing
- Add chord chart viewer with rendering
- Full content management

**V3: Collaboration**
- Multi-project system
- Member invitations and roles
- Song transfers between projects

**V4+: Advanced Features**
- Offline mode, version history, public sharing, etc.

See [roadmap.md](./roadmap.md) for detailed version strategy.

## Repository

The application code will live in a separate repository: `livenotes-app` (to be created)

This documentation defines the specifications and architecture before implementation.

## Development Status

� **Status**: Specifications complete - Ready to start V1 development

**Completed:**
- ✅ Product roadmap defined (V1-V4 strategy)
- ✅ Complete V1 UI/UX specifications
- ✅ Complete V1 technical specifications
- ✅ Database schema designed (V1-V3)
- ✅ All validation rules and constants defined
- ✅ User flows and wireframes documented

**Next Steps:**
1. Create `livenotes-app` repository
2. Set up Supabase project
3. Initialize Vue + Ionic + Vite project
4. Implement V1 features per specifications

**Last Updated:** March 30, 2026

## Related Documentation

- [SongCode Documentation](../songcode/INDEX.md) - Language reference and specs
- [SongCode Converter](https://github.com/PhilipGazagnes/livenotes-sc-converter) - NPM package for parsing

---

**Last Updated**: February 15, 2026
