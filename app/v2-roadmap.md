# Livenotes App - V2 Roadmap (Notes-Based Architecture)

**Created**: April 24, 2026  
**Status**: Planning

---

## Vision Evolution

**Original Vision (V1-V3)**: Project-scoped songs → Add editor → Add collaboration

**New Vision (V2+)**: Global song catalog + Multi-note system → Verified content → Advanced collaboration

This roadmap reflects a fundamental architectural shift based on real-world usage patterns.

---

## The Problem We're Solving

### Real Musician Workflow

**Current V1 approach:**
- Songs belong to projects
- One songcode per song
- Sharing = share entire projects

**Real user needs:**
- "I need 3 different arrangements of this song"
- "I want to share just this one note with a friend"
- "Why create the same song twice in different projects?"
- "How do I avoid typos/duplicates ('Levitating' vs 'Leviating')?"

### The Solution: Three-Tier Architecture

```
APP LEVEL:     Global songs & artists (deduplication)
              ↓
PROJECT LEVEL: Personal workspaces (libraries, tags, lists)
              ↓
CONTENT LEVEL: Multiple notes per song (arrangements, media, etc.)
```

---

## Phased Development Strategy

### Why This Approach?

**Incremental complexity** - Each phase builds on previous foundation
**User value first** - Catalog immediately useful, then add power features
**De-risk** - Validate core model before adding advanced features
**Production safety** - V1 stays in production while building V2

---

## Phase 1: Core Architecture (MVP)

**Status**: 🔜 Next (2-3 weeks)  
**Goal**: Migrate to global song catalog with multi-note system

### Data Model Changes
- ✅ Hoist songs to app-level (global catalog)
- ✅ Hoist artists to app-level (global catalog)
- ✅ Add fingerprinting for deduplication
- ✅ Add `library_songs` table (project ↔ song junction)
- ✅ Add `notes` table (multi-note support)
- ✅ Update tags/lists to reference library songs

### Features Included

**Song Catalog (Global)**
- Search existing songs before creating
- Fingerprint-based duplicate detection
- "Did you mean...?" suggestions
- Any user can create songs (organic growth)
- Song metadata: title, artists (many-to-many)

**Library Management (Project-scoped)**
- Add songs from global catalog to library
- Create new songs (auto-adds to library)
- Remove songs from library (doesn't delete global song)
- Custom per-project metadata overrides

**Notes (Multi-note system)**
- Types supported in MVP:
  - Songcode (SongCode text format)
  - Plain text (free-form notes)
- Multiple notes per song allowed
- Optional note titles ("Acoustic arrangement", "Sunday version")
- Note ordering within type

**Tags (Project-scoped)**
- Create/edit/delete tags per project
- Tag library songs (not global songs)
- Filter library by tags

**Lists (Project-scoped)**
- Create setlists and collections
- Add library songs to lists
- Manual ordering
- Section headers (title items)

### What's NOT Included (Deferred)
- ❌ Verified/official songs
- ❌ Public notes catalog
- ❌ Advanced note types (images, videos, audio)
- ❌ Note selection in lists
- ❌ Collaboration (multi-user projects)
- ❌ Direct sharing via links
- ❌ Song merging tools

### Technical Deliverables
- Database migration from V1 → V2 schema
- Store updates (global songs + library stores)
- UI updates for new model
- Enhanced search with deduplication
- Note creation/editing UI

### Success Metrics
- ✅ All V1 songs migrated successfully
- ✅ Can create songs without duplicates
- ✅ Can add multiple notes per song
- ✅ Tags and lists work with library songs
- ✅ No data loss from migration
- ✅ Performance acceptable (<100ms queries)

---

## Phase 2: Enhanced Content & Verification

**Status**: 🔮 Planned (after Phase 1 stabilizes)  
**Goal**: Add advanced note types and verified content system

### Verification System
- Mark songs/artists as "verified"
- Moderator tools for verification
- Display verified badge in UI
- Verified notes can be "official" (canonical)

### Public Notes Catalog
- Community-contributed notes for songs
- Upvote/downvote system
- Quality ratings
- Import public notes to personal library
- Contribute notes back to public catalog

### Advanced Note Types
- **Images**: Upload photos (handwritten tabs, charts)
- **YouTube**: Embed videos with timestamps
- **Audio**: Record/upload audio clips
- **Video**: Upload video files
- **Tablature**: Text-based guitar/bass tabs
- **Looper Notes**: Custom structured format (BPM, loops, bars)
- **Lyrics**: Dedicated lyrics format
- **Chords**: Chord-only charts

### Note Features
- Rich text editor for plain text notes
- Syntax highlighting for songcode
- Media preview/playback
- Note templates (quick-start formats)
- Export notes (PDF, print)

### Song Merging
- Detect duplicates algorithmically
- UI to merge duplicate songs
- Redirect old song → canonical
- Update all library references
- Audit log of merges

### Enhanced Search
- Full-text search across notes
- Filter by note type
- Search within specific projects
- Advanced filters (verified only, has video, etc.)

---

## Phase 3: Collaboration & Sharing

**Status**: 🔮 Planned  
**Goal**: Multi-user projects and flexible sharing

### Multi-User Projects
- Invite members to projects
- Role management (owner, editor, viewer)
- Permissions by role
- Member activity feed
- Notification system

### Shared Libraries
- Shared projects have shared libraries
- All members see same songs/notes
- Simultaneous editing considerations
- Conflict resolution (last-write-wins or OT)

### Direct Note Sharing
- Generate share links for individual notes
- Shareable without project membership
- Recipient can view + copy to their library
- Expiring links (optional)
- Permission management (view-only, can-copy)

### Note Collaboration
- Multiple users edit same note (advanced)
- Version history for notes
- Comment/annotation system
- Compare versions
- Restore previous versions

### Transfer System (V1 concept, adapted)
- Transfer songs between projects (with notes)
- Approval workflow
- Auto-tagging transferred songs
- Bulk transfers

---

## Phase 4: Advanced Features

**Status**: 🔮 Future  
**Goal**: Power features for serious musicians

### Offline Support
- Progressive Web App (PWA)
- Offline song/note access
- Sync when online
- Conflict resolution for offline edits

### Mobile Apps
- Native iOS app
- Native Android app
- Tablet-optimized layouts
- Mobile-specific features (camera for photos)

### Performance Modes
- Setlist presentation view
- Fullscreen chord charts
- Auto-scroll
- Foot pedal support (Bluetooth)
- MIDI integration

### Practice Tools
- Metronome integration
- Looper integration
- Recording during practice
- Practice log (track progress)
- Goal setting

### Analytics
- Most-played songs
- Practice time stats
- Progress tracking
- Setlist analytics (which songs most used)

### Integration
- Import from other apps (ChordPro, OnSong, etc.)
- Export to PDF, ChordPro, etc.
- Spotify/Apple Music integration (metadata sync)
- MusicBrainz integration (canonical IDs)

### AI Features
- Auto-generate songcode from lyrics
- Chord recognition from audio
- Key detection
- Suggest similar songs
- Auto-tag based on content

---

## Migration Strategy: V1 → V2

### Current State (V1 Production)
- Users actively using project-scoped songs
- Songcode table exists (1:1 with songs)
- Tags, lists working
- All data project-scoped

### Transition Plan

**Week 1-2: Build V2 in Dev**
- Create new schema in dev database
- Migrate existing dev data
- Build new UI components
- Test thoroughly

**Week 3: Testing & Validation**
- User acceptance testing
- Performance testing
- Data integrity checks
- Migration dry-run on prod snapshot

**Week 4: Production Migration**
- Maintenance window (off-peak hours)
- Backup production database
- Run migration scripts
- Validate data integrity
- Deploy new app version
- Monitor for issues

### Rollback Plan
- Keep V1 schema for 30 days
- If critical issues, restore from backup
- Gradual rollout: migrate users in batches

---

## Implementation Priorities

### Must Have (Phase 1 MVP)
1. Global songs with fingerprinting
2. Library management (add/remove songs)
3. Multi-note system (songcode + plain text)
4. Tags for library songs
5. Lists for library songs
6. Search with duplicate detection
7. Migration from V1 data

### Should Have (Phase 1 stretch)
- Note titles for better organization
- Custom song metadata per project
- Bulk operations (tag/add to list)
- Better duplicate suggestion UI

### Nice to Have (Phase 2)
- More note types (youtube, images)
- Verified songs
- Public notes catalog
- Song merging tools

### Future (Phase 3+)
- Collaboration features
- Sharing links
- Offline mode
- Mobile apps

---

## Technical Architecture Decisions

### Database: PostgreSQL (Supabase)
**Why:** Handles relational data perfectly, scales to millions of records, JSONB for flexible note content, RLS for security

**Not changing to MongoDB** - Relational model is correct for this domain

### Search: PostgreSQL Full-Text + Fingerprinting
**Why:** Built-in, fast enough for Phase 1-2

**Future:** Consider Elasticsearch only if PostgreSQL search is insufficient (unlikely until 1M+ songs)

### File Storage: Supabase Storage
**Why:** Integrated with Supabase, CDN, cheap, simple

### Caching: None initially
**Why:** PostgreSQL fast enough for MVP

**Future:** Redis for hot data (popular songs, user sessions) only if needed

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All V1 data migrated successfully
- ✅ Users can create global songs
- ✅ Duplicate detection working
- ✅ Multiple notes per song functional
- ✅ Tags/lists work with new model
- ✅ No major bugs for 1 week
- ✅ Performance acceptable (<200ms p95)

### Phase 2 Complete When:
- ✅ All note types implemented
- ✅ Public catalog functional
- ✅ Verified songs system working
- ✅ Song merging tested
- ✅ 100+ verified songs in catalog

### Phase 3 Complete When:
- ✅ Multi-user projects tested with real bands
- ✅ Sharing works reliably
- ✅ Permissions system secure
- ✅ Real-time features stable

---

## Timeline Estimates

**Phase 1 (MVP)**: 3-4 weeks
- Week 1: Database migration + core stores
- Week 2: UI updates + note system
- Week 3: Testing + polish
- Week 4: Production migration

**Phase 2**: 4-6 weeks
- Verification system: 1 week
- Advanced note types: 2-3 weeks
- Song merging: 1 week
- Testing: 1-2 weeks

**Phase 3**: 6-8 weeks
- Multi-user projects: 3-4 weeks
- Sharing system: 2-3 weeks
- Testing: 1-2 weeks

**Total to full collaboration**: ~4-5 months

---

## Risk Mitigation

### Data Migration Risk
- **Mitigation**: Comprehensive testing on prod snapshot, rollback plan, gradual rollout

### Performance Degradation
- **Mitigation**: Indexes on all foreign keys, query profiling, caching strategy

### User Confusion
- **Mitigation**: In-app tutorials, changelog, documentation, gradual feature rollout

### Duplicate Songs Proliferate
- **Mitigation**: Strong duplicate detection, merge tools, user education

### Schema Changes Break Production
- **Mitigation**: Schema versioning, backwards compatibility during transition

---

## Open Questions

1. **Who verifies songs in public catalog?**
   - Option A: Admin-only (you manually)
   - Option B: Community moderators (trusted users)
   - Option C: Algorithmic (upvotes threshold)

2. **How to handle song edits?**
   - Option A: Immutable (typos = new song + merge)
   - Option B: Allow edits within 5 min window
   - Option C: Allow edits but track history

3. **Storage limits per user?**
   - Free tier: X MB for images/audio?
   - Paid tier for heavy users?

4. **Public vs private by default?**
   - Option A: Notes private by default (opt-in sharing)
   - Option B: Notes shareable by default (opt-out)

---

## Next Steps

1. **Review this roadmap** - confirm direction
2. **Create migration plan** - detailed technical steps
3. **Build Phase 1 MVP** - 3-4 weeks focused work
4. **Test with real data** - your current V1 library
5. **Deploy to production** - migrate users
6. **Iterate based on usage** - adjust Phase 2/3 priorities

---

**Date**: April 24, 2026  
**Status**: Ready for implementation  
**Next**: See [V2 Migration Plan](./v2-migration-plan.md)
