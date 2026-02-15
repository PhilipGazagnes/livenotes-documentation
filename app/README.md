# Livenotes App Documentation

Documentation for the Livenotes application - a cross-platform chord chart editor and viewer.

## Overview

The Livenotes App is a web and mobile application that allows musicians to:
- Write songs using SongCode syntax
- Save and organize their song library
- Visualize chord charts in an interactive viewer
- Access their songs on web, iOS, and Android
- Collaborate with other musicians (future)

## Documentation Structure

- **[Tech Stack](./tech-stack.md)** - Technology choices and rationale
- **[Architecture](./architecture.md)** - Technical architecture and design decisions (TODO)
- **[Features](./features.md)** - Feature specifications and requirements (TODO)
- **[API Reference](./api.md)** - Backend API documentation (TODO)

## Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **UI Library**: Ionic Vue
- **Mobile Wrapper**: Capacitor
- **Build Tool**: Vite
- **Language**: TypeScript

### Editor
- **CodeMirror 6** - Lightweight code editor with syntax highlighting

### Backend
- **Supabase** (recommended) - PostgreSQL + Auth + Storage + Realtime
  - Alternative: Firebase

### Deployment
- **Web**: Netlify or Vercel
- **iOS**: App Store (via Xcode)
- **Android**: Play Store (via Android Studio)

### Key Dependencies
- `@livenotes/songcode-converter` - Core SongCode parser

## Cross-Platform Strategy

**One codebase → Three platforms**

The app uses a hybrid/web-based approach:
- Built with standard web technologies (Vue, TypeScript)
- Wrapped with Capacitor for native iOS/Android apps
- Deployed as-is for web version

**Why hybrid for v1?**
- Faster time to market
- Leverages existing web skills
- SongCode editing is primarily text-based (web's strength)
- Chord viewer is layout-focused (CSS Grid/Flexbox excel here)
- Can migrate to native later if needed (but probably won't need to)

## Repository

The application code will live in a separate repository: `livenotes-app` (to be created)

This documentation defines the specifications and architecture before implementation.

## Development Status

📝 **Status**: Planning phase

## Related Documentation

- [SongCode Documentation](../songcode/INDEX.md) - Language reference and specs
- [SongCode Converter](https://github.com/PhilipGazagnes/livenotes-sc-converter) - NPM package for parsing

---

**Last Updated**: February 15, 2026
