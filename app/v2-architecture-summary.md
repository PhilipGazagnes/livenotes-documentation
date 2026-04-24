# Livenotes V2 - Architecture Overview & Summary

**Created**: April 24, 2026  
**Status**: Planning Complete, Ready for Implementation

---

## Executive Summary

Livenotes V2 represents a **fundamental architectural evolution** from project-scoped songs to a global catalog with multi-note system. This change better reflects real musician workflows and enables powerful features like song deduplication, multiple arrangements, and flexible sharing.

---

## The Problem

**V1 Limitations:**
- Songs locked to single projects (can't share across personal/band projects)
- One songcode per song (can't track multiple arrangements)
- No deduplication (users create "Levitating" and "Leviating" separately)
- Sharing must be project-wide (can't share single note)

**Real User Need:**
> "I need 3 arrangements of this song, want to share one with a friend who isn't in my band, and don't want to re-create 'Hotel California' in every project."

---

## The Solution: Three-Tier Architecture

### Tier 1: App Level (Global)
**Songs** and **Artists** - Shared catalog across all users
- Fingerprinting for deduplication ("Levitating" = "levitating")
- Any user can create (organic growth)
- Future: verified canonical songs

### Tier 2: Project Level (Workspace)
**Projects** and **Libraries** - Personal or shared workspaces
- Each user has personal project (auto-created)
- Can create shared projects (for bands)
- Library = songs added to this project
- Tags and Lists remain project-scoped

### Tier 3: Content Level (Notes)
**Notes** - Multiple content pieces per song
- Types: songcode, plain_text, youtube, images, videos, tablature, etc.
- Multiple notes of same type allowed (different arrangements)
- Project-specific (my songcode ≠ your songcode)
- Optional titles ("Acoustic", "Sunday version")

---

## Key Changes from V1

| Aspect | V1 | V2 |
|--------|----|----|
| **Songs** | Project-scoped | Global app-level |
| **Artists** | Project-scoped | Global app-level |
| **Content** | Single songcode per song | Multiple notes per song |
| **Deduplication** | None | Fingerprint-based |
| **Sharing** | Project-level only | Notes + projects |
| **Tags** | Project-scoped ✓ | Project-scoped ✓ (no change) |
| **Lists** | Project-scoped ✓ | Project-scoped ✓ (no change) |

---

## Data Model (Simplified)

```
Global Catalog:
  songs (id, title, fingerprint, created_by, popularity, ...)
  artists (id, name, fingerprint, created_by, ...)
  song_artists (song_id, artist_id, position)

User Workspaces:
  projects (id, owner_id, name, type: personal|shared)
  library_songs (id, project_id, song_id, added_by, custom_notes, ...)
    ↓
  notes (id, library_song_id, type, title, content, ...)
  tags (id, project_id, name)
  library_song_tags (library_song_id, tag_id)
  lists (id, project_id, name)
  list_items (list_id, library_song_id, note_id [optional], position)
```

---

## User Workflow Example

**Scenario**: Mike plays in personal project + "The Fuzz Birds" band

1. **Create song** → Search global catalog → "Levitating" exists → Add to "Mike" library
2. **Add note** → Open "Levitating" → Add songcode note titled "Original key"
3. **Share with band** → Later, add same song to "The Fuzz Birds" library
4. **Create arrangement** → Add new songcode note titled "Band arrangement (key of G)"
5. **Create setlist** → Add to "Sunday Gig" list → Select "Band arrangement" note
6. **Share with friend** → (Phase 2) Generate share link for specific note

**Results:**
- ✅ One global "Levitating" song (no duplicates)
- ✅ Two libraries (Mike + Fuzz Birds) linking to same song
- ✅ Multiple notes (different arrangements)
- ✅ Project-specific tags/lists
- ✅ Flexible sharing

---

## Implementation Approach

### Strategy: Hybrid Evolution (Start Simple → Grow Complex)

**Phase 1 (MVP - 3-4 weeks):**
- Global songs/artists with fingerprinting
- Library management (add/remove songs)
- Multi-note system (songcode + plain_text only)
- Tags/lists updated for library songs
- Migration from V1

**Phase 2 (4-6 weeks later):**
- Verified songs/artists
- Public notes catalog
- Advanced note types (images, videos, audio)
- Song merging tools
- Enhanced search

**Phase 3 (6-8 weeks later):**
- Multi-user projects
- Real-time collaboration
- Direct note sharing
- Permissions system

---

## Technical Stack (No Changes)

**Database**: PostgreSQL (Supabase) ✅
- Perfect for relational data
- Scales to millions of songs
- JSONB for flexible note content
- Built-in full-text search
- Row-Level Security

**Why NOT MongoDB?**
- This is inherently relational data
- Need complex joins (songs ↔ artists ↔ libraries ↔ notes)
- PostgreSQL handles this better

**Future Additions:**
- Redis (caching hot data) - only if needed
- Elasticsearch (advanced search) - only if PostgreSQL insufficient

---

## Migration Strategy

### Blue-Green Approach

1. **Build V2 schema alongside V1** (can rollback easily)
2. **Migrate data** V1 → V2 (songs, artists, songcode → notes)
3. **Validate** data integrity
4. **Update application** to use V2
5. **Keep V1 tables** for 30 days (safety net)

### Safety Measures

- ✅ Full database backup before migration
- ✅ Test on production snapshot in dev first
- ✅ Comprehensive validation queries
- ✅ Rollback plan ready
- ✅ Gradual cutover (not big bang)

---

## Documents Created

1. **[V2 Data Model](./v2-data-model.md)** (61 KB)
   - Complete entity definitions
   - Relationships and constraints
   - Business rules
   - RLS policies
   - Future enhancements

2. **[V2 Roadmap](./v2-roadmap.md)** (28 KB)
   - Vision and strategy
   - Phased development plan
   - Timeline estimates
   - Success criteria
   - Open questions

3. **[V2 Migration Plan](./v2-migration-plan.md)** (47 KB)
   - Step-by-step SQL migrations
   - Data transformation scripts
   - Validation queries
   - Rollback procedures
   - Testing strategy

4. **[V2 Implementation Plan](./v2-implementation-plan.md)** (35 KB)
   - Week-by-week tasks
   - Code examples (stores, components)
   - Feature checklist
   - Success criteria
   - Post-launch plan

---

## Risk Assessment

### High Risk ✅ Mitigated

**Data Loss During Migration**
- Mitigation: Comprehensive backups, test on snapshot, validation queries

**Performance Degradation**
- Mitigation: Proper indexing, query profiling, PostgreSQL scales well

**User Confusion**
- Mitigation: In-app tutorials, similar UI to V1, gradual feature rollout

### Medium Risk ⚠️ Monitor

**Song Duplicates Proliferate**
- Mitigation: Strong duplicate detection, merge tools in Phase 2

**Complex Queries Slow**
- Mitigation: Indexes on all FKs, denormalization if needed, caching

### Low Risk ℹ️ Acceptable

**Scope Creep**
- Mitigation: Clear phase boundaries, MVP focus

**Breaking Changes in Future**
- Mitigation: Versioned schema, backwards compatibility

---

## Success Metrics

### Phase 1 Complete When:
- ✅ All V1 data migrated (zero data loss)
- ✅ Users can search/create global songs
- ✅ Duplicate detection working
- ✅ Multiple notes per song functional
- ✅ Tags/lists working with library songs
- ✅ Performance acceptable (<200ms p95)
- ✅ No critical bugs for 1 week

### Long-term Success (6 months):
- ✅ 90%+ songs are deduplicated (not duplicates)
- ✅ Users regularly use multiple notes per song
- ✅ Public catalog has 100+ verified songs
- ✅ Multi-user projects active (Phase 3)
- ✅ User retention high

---

## Open Questions & Decisions Needed

### 1. Verification System (Phase 2)
**Who verifies songs?**
- Option A: Admin-only (you manually verify)
- Option B: Community moderators (trusted users)
- Option C: Algorithmic (upvote threshold)

**Recommendation**: Start with A, evolve to B

### 2. Song Editing Policy
**Can users edit song titles after creation?**
- Option A: Immutable (typos → new song + merge)
- Option B: 5-minute edit window
- Option C: Always editable with version history

**Recommendation**: B (5-minute window)

### 3. Storage Limits
**For images/videos/audio (Phase 2):**
- Free tier: 100 MB per user?
- Paid tier: 1 GB for $5/month?

**Recommendation**: Defer until Phase 2

### 4. Default Sharing Behavior
**Are notes shareable by default?**
- Option A: Private by default (opt-in sharing)
- Option B: Shareable by default (opt-out)

**Recommendation**: A (privacy-first)

---

## Next Steps

### Immediate (This Week)
1. ✅ Review all documentation
2. ✅ Confirm architecture decisions
3. ⬜ Create feature branch `feature/v2-notes-architecture`
4. ⬜ Begin Week 1: Database migration

### Week 1: Database
- Create V2 schema in dev
- Migrate V1 data
- Validate data integrity

### Week 2: Code
- Update TypeScript types
- Create new stores (globalSongs, library, notes)
- Update existing stores (tags, lists)

### Week 3: UI
- Build new components (SongSearchModal, NotesSection)
- Update existing components (SongCard, LibraryPage)
- Test features end-to-end

### Week 4: Production
- Final testing
- Production migration
- Monitor and stabilize

---

## Questions Before Starting?

1. **Architecture confirmed?** Global songs + library songs + multi-notes?
2. **Phasing confirmed?** MVP → Verification → Collaboration?
3. **Stack confirmed?** Keep Supabase/PostgreSQL?
4. **Timeline realistic?** 3-4 weeks for Phase 1 MVP?
5. **Any concerns?** Data migration, performance, complexity?

---

## Resources

- **Documentation Folder**: `/opt/projects/livenotes-documentation/app/`
- **Current App**: `/opt/projects/livenotes-app/`
- **Database Migrations**: `/opt/projects/livenotes-app/migrations/`

**Key Files:**
- [V2 Data Model](./v2-data-model.md) - Entities, relationships, policies
- [V2 Roadmap](./v2-roadmap.md) - Vision, phases, timeline
- [V2 Migration Plan](./v2-migration-plan.md) - Database migration SQL
- [V2 Implementation Plan](./v2-implementation-plan.md) - Week-by-week tasks

---

**Status**: ✅ Planning Complete  
**Ready**: ✅ To Begin Implementation  
**Created**: April 24, 2026
