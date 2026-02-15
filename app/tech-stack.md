# Livenotes App - Tech Stack

## Technology Decisions

This document explains the technology choices for the Livenotes application.

---

## Frontend Framework: Vue 3 + Ionic + Capacitor

### Decision: Ionic + Vue + Capacitor (Hybrid Approach)

**Rationale**:
- One codebase for web, iOS, and Android
- Leverage existing Vue/TypeScript knowledge
- Fast time to market for MVP
- Web technologies excel at text editing and layout
- Easy maintenance (single codebase)

### What is this stack?

```
┌─────────────────────────────────────────┐
│           Vue 3 Application             │
│  (Your code: components, logic, etc.)   │
├─────────────────────────────────────────┤
│          Ionic Vue Framework            │
│  (UI components, navigation, styling)   │
├─────────────────────────────────────────┤
│             Capacitor                   │
│  (Native wrapper for iOS/Android)       │
├─────────────────────────────────────────┤
│   Web Browser    │  iOS   │  Android   │
└─────────────────────────────────────────┘
```

**Vue 3**: JavaScript framework for building the UI
**Ionic**: Pre-built mobile-optimized UI components
**Capacitor**: Wraps web app into native iOS/Android apps

---

## Why Hybrid Instead of Native?

### Considered Alternatives:

#### Option 1: React Native ❌
- Pros: True native apps, large ecosystem
- Cons: New framework to learn, different from SongCode converter codebase
- Decision: Not needed for text/layout-focused app

#### Option 2: Flutter ❌
- Pros: Beautiful UIs, high performance
- Cons: Dart language (different from TypeScript), longer learning curve
- Decision: Overkill for v1

#### Option 3: Ionic/Capacitor ✅ **CHOSEN**
- Pros: Leverage web skills, fast development, perfect for text editing
- Cons: "Hybrid feel" (acceptable for MVP)
- Decision: Best fit for Livenotes use case

### Why Hybrid Works for Livenotes:
1. **Text-first interface**: SongCode editor is text-based (web's strength)
2. **Layout-focused viewer**: CSS Grid/Flexbox perfect for chord charts
3. **No complex gestures**: Not building a photo editor or game
4. **Rapid iteration**: Can update all platforms at once
5. **Later optimization**: Can build native apps if user demand requires it

---

## Code Editor: CodeMirror 6

### Decision: CodeMirror 6 (not Monaco Editor)

**What is CodeMirror?**
- A JavaScript library for code editing
- Provides syntax highlighting, line numbers, auto-complete, etc.
- Much better than a basic `<textarea>` for writing code-like content

### Why CodeMirror over Monaco?

| Feature | Monaco | CodeMirror 6 | Winner |
|---------|--------|--------------|--------|
| Bundle Size | 2-3 MB | ~500 KB | CodeMirror ✅ |
| Mobile Support | Okay | Excellent | CodeMirror ✅ |
| Customization | Complex | Flexible | CodeMirror ✅ |
| Features | VS Code level | Plenty for our needs | CodeMirror ✅ |
| Power | Maximum | Just right | CodeMirror ✅ |

**Decision**: CodeMirror 6 is lighter, more mobile-friendly, and sufficient for SongCode editing.

### Features We'll Implement:
- **Syntax highlighting**: 
  - Metadata (`@name`, `@bpm`) in blue
  - Pattern IDs (`$1`, `$2`) in purple
  - Chords (`G`, `Am`, `D7`) in green
  - Lyrics in default color
- **Line numbers**
- **Auto-complete**: Suggest metadata keys and common chords
- **Error detection**: Real-time validation with `@livenotes/songcode-converter`
- **Mobile toolbar**: Quick-insert buttons for `;`, `[`, `]`, `@`, `$`, etc.

---

## Backend: Supabase (Recommended)

### Decision: Supabase

**What is Supabase?**
- Open-source Firebase alternative
- PostgreSQL database + Authentication + Storage + Realtime
- Works seamlessly with web and mobile apps

### Why Supabase?

| Feature | Supabase | Firebase | Custom API |
|---------|----------|----------|------------|
| Database | PostgreSQL ✅ | NoSQL | Flexible |
| Auth | Built-in ✅ | Built-in ✅ | Manual |
| Setup Time | Fast ✅ | Fast ✅ | Slow |
| Cost | Generous free tier ✅ | Good free tier | Variable |
| Real-time | Yes ✅ | Yes ✅ | Manual |
| SQL Support | Yes ✅ | No | Yes |
| Vendor Lock-in | Lower ✅ | Higher | None |

**Decision**: Supabase gives us everything we need with minimal setup.

### What Supabase Provides:
1. **Database**: Store songs, user data
2. **Authentication**: Email/password, OAuth (Google, GitHub, etc.)
3. **Storage**: For future features (audio files, images)
4. **Row Level Security**: Users can only access their own songs
5. **Realtime**: For future collaboration features
6. **Works everywhere**: Same JavaScript client for web, iOS, Android

### Alternative: Firebase
If you prefer Firebase, it would work too. Supabase is recommended because:
- More flexible (PostgreSQL vs NoSQL)
- Open source (can self-host if needed)
- Better for complex queries

---

## Build Tool: Vite

### Decision: Vite (not Webpack)

**Why Vite?**
- Lightning-fast hot reload during development
- Modern, optimized builds
- Better developer experience than Webpack
- Native TypeScript support
- Becoming the standard for Vue projects

---

## Storage Strategy

### Local Storage (MVP):
- **Web**: LocalStorage / IndexedDB
- **Mobile**: Capacitor Preferences API (wraps native storage)

### Cloud Storage (Post-MVP):
- Supabase Database for syncing across devices
- User can access songs from any device

---

## Development Workflow

### Local Development:
```bash
npm run dev
# Opens at http://localhost:5173
# Hot reload on every save
# Works like a regular web app
```

### Mobile Testing:
```bash
# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open in native IDEs
npx cap open ios       # Xcode
npx cap open android   # Android Studio

# Test on simulator/device
```

### Deployment:
- **Web**: `npm run build` → Deploy `dist/` to Netlify
- **iOS**: Build in Xcode → TestFlight → App Store
- **Android**: Build in Android Studio → Play Store

---

## Project Structure (Proposed)

```
livenotes-app/
├── README.md
├── package.json
├── vite.config.ts
├── capacitor.config.ts
├── .env.example
├── src/
│   ├── main.ts                    # App entry point
│   ├── App.vue                    # Root component
│   ├── router/
│   │   └── index.ts               # Vue Router
│   ├── views/                     # Page-level components
│   │   ├── Home.vue
│   │   ├── Editor.vue
│   │   ├── Viewer.vue
│   │   └── Library.vue
│   ├── components/                # Reusable components
│   │   ├── SongCodeEditor.vue     # CodeMirror wrapper
│   │   ├── EditorToolbar.vue      # Mobile keyboard helpers
│   │   ├── ChordViewer.vue        # Renders chord chart
│   │   └── SongList.vue           # Song library list
│   ├── composables/               # Vue composables (logic)
│   │   ├── useSongConverter.ts    # Wraps converter
│   │   ├── useSongStorage.ts      # Local/cloud storage
│   │   └── useAuth.ts             # Authentication
│   ├── services/
│   │   ├── converter.ts           # SongCode converter wrapper
│   │   ├── supabase.ts            # Supabase client
│   │   └── storage.ts             # Storage abstraction
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── assets/
│       └── styles/                # Global styles
├── ios/                           # Generated by Capacitor
│   └── App/                       # Xcode project
├── android/                       # Generated by Capacitor
│   └── app/                       # Android Studio project
└── public/                        # Static assets
```

---

## Key Dependencies

### Core:
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "@ionic/vue": "^7.0.0",
    "@ionic/vue-router": "^7.0.0",
    "@capacitor/core": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/android": "^5.0.0",
    "@livenotes/songcode-converter": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "codemirror": "^6.0.0"
  }
}
```

---

## Migration Path (If Needed)

### If we need to go native later:
1. **Keep the web version** as-is (Ionic/Vue)
2. **Build separate native apps**:
   - iOS: SwiftUI
   - Android: Jetpack Compose
3. **Share backend**: All apps use same Supabase backend
4. **Reuse converter**: `@livenotes/songcode-converter` works everywhere

**Reality**: Most apps never need to migrate. The hybrid approach scales well.

---

## Summary

| Component | Technology | Why |
|-----------|------------|-----|
| **Framework** | Vue 3 | Familiar, reactive, great for this use case |
| **UI Library** | Ionic | Mobile-optimized components |
| **Mobile** | Capacitor | Modern native wrapper |
| **Editor** | CodeMirror 6 | Lightweight, perfect for SongCode |
| **Backend** | Supabase | All-in-one solution (DB + Auth + Storage) |
| **Build Tool** | Vite | Fast, modern, great DX |
| **Language** | TypeScript | Type safety, better IDE support |

---

**Last Updated**: February 15, 2026
