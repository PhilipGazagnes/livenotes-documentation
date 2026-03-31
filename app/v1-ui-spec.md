# Livenotes V1 - UI/UX Specification

**Version**: 1.0  
**Last Updated**: March 30, 2026

This document provides complete UI/UX specifications for Livenotes V1, defining all screens, interactions, and user flows.

---

## Design Principles

- **Dark mode only** - Single theme for V1
- **Mobile-first** - Design for mobile, adapt to desktop
- **Responsive breakpoints** - Use Tailwind CSS defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Simple and focused** - Clear hierarchy, minimal clutter
- **Offline-capable** - Deferred to future version

---

## Navigation Structure

### Routes

```
/login              - Login page
/signup             - Signup page
/                   - All Songs page (main)
/song/new           - Create new song
/song/:id/edit      - Edit song
/lists              - Lists management page
/lists/:id          - Single list detail page
/tags               - Tags management page
/artists            - Artists management page
```

### Global Navigation

**Header (Sticky Top)**
```
┌─────────────────────────────────┐
│ Livenotes                  [☰]  │
└─────────────────────────────────┘
```
- Always visible on all pages
- Hamburger menu (☰) opens modal menu

**Hamburger Menu Modal**
- Logout
- Tags
- Lists
- Artists

**No bottom navigation bar** - Search/filter is at bottom of All Songs page only

---

## Page Specifications

### 1. All Songs Page (Main - `/`)

The primary view showing all user's songs with search and filtering.

#### Layout

```
┌─────────────────────────────────┐
│ Livenotes                  [☰]  │ ← Sticky header
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Yesterday              [⋮]  │ │ ← Song card
│ │ The Beatles                 │ │
│ │ 🏷️ Rock, Covers, Easy       │ │
│ │ 📋 Setlist A, Favorites     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Let It Be              [⋮]  │ │
│ │ The Beatles                 │ │
│ │ 🏷️ Rock, Ballad             │ │
│ │ 📋 Setlist A                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Day One                [⋮]  │ │
│ │ Casting Crowns              │ │
│ │ 🏷️ Worship                  │ │
│ │ 📋 (no lists)               │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Search bar...            ] [🔍]│ ← Sticky bottom
└─────────────────────────────────┘
```

#### Song Card Design

**Structure:**
- Full width card with subtle border/shadow
- Top row: Title (bold, larger) + Dropdown menu [⋮] (right-aligned)
- Second row: Artists (smaller, muted color) - comma-separated if multiple: "Artist1, Artist2"
- Third row: Tags (if any) - displayed as small chips/badges with 🏷️ icon
- Fourth row: Lists (if any) - displayed as small chips/badges with 📋 icon
- No hover effects
- No click action on card in V1 (reserved for V2 chart viewer)

**Artists Display:**
- Show all artists comma-separated: "The Beatles" or "Artist1, Artist2, Artist3"
- If no artists: Hide the artists row entirely

**Tags Display:**
- Show all tags as inline chips: `🏷️ Rock, Covers, Easy`
- If no tags: Hide the tags row entirely

**Lists Display:**
- Show which lists contain this song: `📋 Setlist A, Favorites`
- If no lists: Hide the lists row entirely

**Dropdown Menu (per song):**
- Edit
- Duplicate
- Manage Tags
- Manage Lists
- Delete

#### Search & Filter Bar (Sticky Bottom)

**Layout:**
```
┌─────────────────────────────────┐
│ [Search bar...            ] [🔍]│
└─────────────────────────────────┘
```

**Search Field:**
- Placeholder: "Search songs..."
- Real-time search (200ms debounce)
- Case-insensitive
- Searches in song title only
- Partial matching ("day" matches "Yesterday", "Day One")
- Clear button (X) appears when text is entered

**Filter Button [🔍] (Bottom Right):**
- Opens "Filter by Tags" modal

#### Filter by Tags Modal

**Layout:**
```
┌─────────────────────────────────┐
│ Filter by Tags            [✕]   │
├─────────────────────────────────┤
│ Selected: [Rock ✕] [Covers ✕]  │
│           [Uncheck All]         │
├─────────────────────────────────┤
│ All Tags:                       │
│                                 │
│ ☑ Rock                          │
│ ☑ Covers                        │
│ ☐ Easy                          │
│ ☐ Worship                       │
│ ☐ Ballad                        │
│ ☐ Fast                          │
│ ...                             │
│                                 │
│              [Apply] [Cancel]   │
└─────────────────────────────────┘
```

**Behavior:**
- Shows all available tags with checkboxes
- Selected tags appear at top as removable chips (with ✕)
- "Uncheck All" button clears all selections
- Multiple tags = AND logic (song must have ALL selected tags)
- Apply button closes modal and applies filter
- Cancel button closes modal without applying changes

#### Filtering Logic

**Search + Tags combined:**
- Search filters by title
- Tag filter requires ALL selected tags
- Both filters applied together (AND combination)
- Example: Search "day" + Tags [Rock, Covers] → shows songs with "day" in title AND Rock tag AND Covers tag

#### Bulk Selection Mode

**Entering Selection Mode:**
- Button or gesture enters "Select Mode"
- All song cards show checkboxes (left side)
- "Select All" and "Deselect All" buttons appear
- Bulk action buttons appear at bottom/top

**Bulk Actions Available:**
- Delete selected songs
- Add selected songs to list(s)
- Assign tag(s) to selected songs
- Remove tag(s) from selected songs

**Exiting Selection Mode:**
- "Cancel" button or similar
- All checkboxes disappear
- Selection cleared

#### Empty States

**No songs exist:**
```
┌─────────────────────────────────┐
│         📝                      │
│  No songs yet                   │
│  Create your first song!        │
│                                 │
│      [+ New Song]               │
└─────────────────────────────────┘
```

**No search results:**
```
┌─────────────────────────────────┐
│         🔍                      │
│  No songs match your search     │
│  Try different keywords or      │
│  clear filters                  │
└─────────────────────────────────┘
```

**No songs match filters:**
```
┌─────────────────────────────────┐
│         🏷️                      │
│  No songs with selected tags    │
│  Try different tag combinations │
└─────────────────────────────────┘
```

#### Sorting

- **Default sort:** Alphabetical by title (A-Z)
- Always applied after filtering
- Client-side sorting

---

### 2. Create Song Page (`/song/new`)

Form to create a new song with metadata only.

#### Layout

```
┌─────────────────────────────────┐
│ ← New Song                 [☰]  │
├─────────────────────────────────┤
│                                 │
│ Title *                         │
│ [_____________________]         │
│                                 │
│ Artists                         │
│ [_____________________]         │
│   ↓ The Beatles                 │
│   ↓ Beatles                     │
│                                 │
│ Selected Artists:               │
│ [Artist 1 ✕] [Artist 2 ✕]      │
│                                 │
│ Notes                           │
│ [_____________________]         │
│ [_____________________]         │
│                                 │
│ POC ID                          │
│ [____]                          │
│                                 │
│                                 │
│     [Cancel]    [Create]        │
└─────────────────────────────────┘
```

#### Form Fields

**Title** (required)
- Input type: text
- Max length: 100 characters
- Validation: Required, trimmed (leading/trailing whitespace removed, multiple spaces → single space)
- Error message: "Title is required" / "Title is too long (max 100 characters)"
- Required indicator: * asterisk

**Artists** (optional, multiple)
- Input type: text with autocomplete suggestions
- Free text input with suggestions appearing below as user types
- Suggestions filtered from existing artists in project (fuzzy match)
- User can select from suggestions OR create new artist
- Selected artists displayed as removable chips below input: [Artist 1 ✕] [Artist 2 ✕]
- Artists ordered by selection sequence (can be reordered with drag-and-drop on chips)
- Display format in song list: "Artist1, Artist2, Artist3" (comma-separated)
- Placeholder: "Type to search or create artist..."

**Artist Autocomplete Behavior:**
- As user types, show filtered suggestions below input (max 5-10 suggestions)
- Suggestions show artist name and song count: "The Beatles (12 songs)"
- Click suggestion to select → adds to selected artists list
- Press Enter while typing → shows confirmation dialog if artist doesn't exist
- Confirmation dialog: "Create new artist: [name]?" with [Cancel] [Create] buttons
- If similar artists exist (fuzzy match), show in confirmation: "Did you mean: The Beatles?"
- User can click suggested match or proceed with creating new artist
- Clear input after selection/creation

**Selected Artists Management:**
- Each selected artist shown as chip with ✕ button
- Click ✕ to remove artist from song
- Drag chips to reorder (changes display order: position 1, 2, 3...)
- Order preserved in database via SongArtist.position field

**Notes** (optional)
- Input type: textarea
- Max length: 255 characters
- Rows: 3-4
- Placeholder: "Add notes about this song..."

**POC ID** (optional)
- Input type: text
- Max length: 4 characters
- Validation: Exactly 4 characters or empty
- User-editable for migration purposes
- Placeholder: "####"

#### Behavior

**Tags and Lists:**
- NOT assigned during creation
- Can only be added after song is created via "Manage Tags" or "Manage Lists"

**Save Button:**
- Label: "Create"
- Validates all fields
- Shows inline errors if validation fails
- On success: Creates song, shows success toast, redirects to All Songs page

**Cancel Button:**
- If form is empty: Goes back immediately
- If form has changes: Shows confirmation: "Discard unsaved changes?"
- On confirm: Returns to previous page

**Unsaved Changes Warning:**
- If user navigates away with unsaved changes: Show confirmation dialog
- Message: "You have unsaved changes. Discard them?"

---

### 3. Edit Song Page (`/song/:id/edit`)

Form to edit existing song metadata.

#### Layout

Same as Create Song page, but:
- Header: "← Edit Song" instead of "New Song"
- Fields pre-populated with existing values
- Save button: "Save" instead of "Create"

#### Behavior

**Same as Create Song**, except:
- Pre-fills all fields with existing values
- On save success: Shows success toast, redirects to All Songs page

---

### 4. Manage Tags Modal (per song)

Modal to assign/remove tags for a specific song.

#### Layout

```
┌─────────────────────────────────┐
│ Manage Tags - Yesterday    [✕]  │
├─────────────────────────────────┤
│ Create new tag:                 │
│ [Tag name...          ] [Add]   │
├─────────────────────────────────┤
│ Available tags:                 │
│                                 │
│ ☑ Rock                          │
│ ☑ Covers                        │
│ ☑ Easy                          │
│ ☐ Worship                       │
│ ☐ Ballad                        │
│ ☐ Fast                          │
│ ...                             │
│                                 │
│              [Cancel]  [Save]   │
└─────────────────────────────────┘
```

#### Behavior

**Create New Tag (inline at top):**
- Input field + "Add" button
- On click Add: Creates tag and checks it immediately
- Validation:
  - Max 50 characters
  - No duplicate names (case-sensitive)
  - If duplicate: Show error toast "Tag already exists"

**Tag Checkboxes:**
- Shows all existing tags in alphabetical order
- Checked = song has this tag
- Unchecked = song doesn't have this tag
- Toggle to add/remove tag assignment

**Save Button:**
- Applies all changes (adds/removes tag assignments)
- Closes modal
- Shows success toast: "Tags updated"

**Cancel Button:**
- Discards all changes
- Closes modal

---

### 5. Manage Lists Modal (per song)

Modal to add/remove song from lists.

#### Layout

```
┌─────────────────────────────────┐
│ Manage Lists - Yesterday   [✕]  │
├─────────────────────────────────┤
│ Create new list:                │
│ [List name...         ] [Add]   │
├─────────────────────────────────┤
│ Available lists:                │
│                                 │
│ ☑ Setlist A                     │
│ ☑ Favorites                     │
│ ☐ Worship Set                   │
│ ☐ Easy Songs                    │
│ ...                             │
│                                 │
│              [Cancel]  [Save]   │
└─────────────────────────────────┘
```

#### Behavior

**Create New List (inline at top):**
- Input field + "Add" button
- On click Add: Creates list and checks it immediately
- Validation:
  - Max 50 characters
  - If duplicate: Show error toast "List already exists"

**List Checkboxes:**
- Shows all existing lists in alphabetical order
- Checked = song is in this list
- Unchecked = song is not in this list
- Toggle to add/remove from list

**Adding Song to List:**
- New song is added at the **bottom** of the list (highest position number)
- Position can only be changed on the List Detail page

**Duplicate Detection:**
- If user tries to add song to list it's already in: Show toast "Song already in list"
- Shouldn't happen with checkbox UI, but defensive check

**Save Button:**
- Applies all changes (adds/removes from lists)
- Closes modal
- Shows success toast: "Lists updated"

**Cancel Button:**
- Discards all changes
- Closes modal

---

### 6. Lists Page (`/lists`)

Page showing all user's lists with management options.

#### Layout

```
┌─────────────────────────────────┐
│ ← Lists                    [☰]  │
├─────────────────────────────────┤
│                      [+ New List]│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Setlist A              [⋮]  │ │ ← List card
│ │ 12 songs                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Favorites              [⋮]  │ │
│ │ 8 songs                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Worship Set            [⋮]  │ │
│ │ 0 songs                     │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### List Card Design

**Structure:**
- Full width card
- Top row: List name (bold) + Dropdown menu [⋮] (right-aligned)
- Second row: Song count (smaller, muted)
- Click anywhere on card (except dropdown) → Navigate to List Detail page

**Dropdown Menu (per list):**
- Rename
- Delete
- (Bulk actions when in selection mode)

#### Sorting

- **Alphabetical by list name** (A-Z)

#### Bulk Selection Mode

Same as All Songs page:
- Checkboxes appear on each card
- Select all / Deselect all buttons
- Bulk actions: Delete selected lists

#### Actions

**+ New List Button:**
- Opens "Create List" modal/form
- Input: List name (max 50 chars)
- Optional: Description field
- Creates empty list

**Rename List:**
- Opens inline edit or modal
- Change list name
- Validation: max 50 chars, no duplicates

**Delete List:**
- Confirmation: "Delete list '[List Name]'? Songs will not be deleted."
- On confirm: Deletes list and all list_items entries
- Songs remain in database

#### Empty State

**No lists exist:**
```
┌─────────────────────────────────┐
│         📋                      │
│  No lists yet                   │
│  Create a list to organize      │
│  your songs                     │
│                                 │
│      [+ New List]               │
└─────────────────────────────────┘
```

---

### 7. List Detail Page (`/lists/:id`)

Page showing songs within a specific list, with ordering controls.

#### Layout

```
┌─────────────────────────────────┐
│ ← Setlist A                [☰]  │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☰ Yesterday            [⋮]  │ │ ← Drag handle + Song
│ │   The Beatles          ↑ ↓  │ │    card with arrows
│ │   🏷️ Rock, Covers           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☰ Let It Be            [⋮]  │ │
│ │   The Beatles          ↑ ↓  │ │
│ │   🏷️ Rock                   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☰ Day One              [⋮]  │ │
│ │   Casting Crowns       ↑ ↓  │ │
│ │   🏷️ Worship                │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Search bar...            ] [🔍]│ ← Same search/filter as All Songs
└─────────────────────────────────┘
```

#### Song Card in List

**Differences from All Songs page:**
- **Drag handle (☰)** on left for drag-and-drop reordering
- **Up/down arrows (↑ ↓)** on right for manual reordering
- **No lists indicator** (redundant - they're already in this list)
- **Tags still shown** (useful context)
- Same dropdown menu as All Songs page, plus "Remove from List" option

#### Reordering

**Drag and Drop:**
- Touch/mouse drag the ☰ handle
- Shows visual feedback while dragging
- Drop to new position updates `list_items.position` for affected songs

**Up/Down Arrows:**
- Up arrow: Move song one position up
- Down arrow: Move song one position down
- Disabled when at top/bottom of list

**Behavior:**
- Reordering updates position values in database
- Changes saved immediately (no explicit save needed)
- Shows brief toast: "Order updated"

#### Search & Filter

**Same functionality as All Songs page:**
- Search by title (200ms debounce)
- Filter by tags (opens same modal)
- Combined search + tag filtering
- Only shows songs that are both in this list AND match filters

#### Dropdown Menu (per song in list)

**Actions:**
- Edit
- Duplicate (creates new song, NOT added to this list automatically)
- Manage Tags
- Manage Lists (can remove from this list or add to others)
- Remove from List (specific to this context)
- Delete

**Remove from List:**
- Removes song from this list only (song still exists)
- No confirmation needed (not destructive)
- Shows toast: "Removed from [List Name]"

#### Bulk Selection Mode

Same as All Songs page:
- Checkboxes on cards
- Bulk actions:
  - Remove selected songs from this list
  - Delete selected songs (from entire database)
  - Add selected songs to other list(s)
  - Assign/remove tags

#### Back Button

**← Back arrow in header:**
- Returns to Lists page

#### Empty State (filtered)

**No songs in list:**
```
┌─────────────────────────────────┐
│         📋                      │
│  This list is empty             │
│  Add songs from the All Songs   │
│  page                           │
└─────────────────────────────────┘
```

**No songs match search/filter:**
```
┌─────────────────────────────────┐
│         🔍                      │
│  No songs match in this list    │
└─────────────────────────────────┘
```

---

### 8. Tags Page (`/tags`)

Page showing all tags with management options.

#### Layout

```
┌─────────────────────────────────┐
│ ← Tags                     [☰]  │
├─────────────────────────────────┤
│                      [+ New Tag] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Rock                   [⋮]  │ │ ← Tag card
│ │ 45 songs                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Worship                [⋮]  │ │
│ │ 32 songs                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Covers                 [⋮]  │ │
│ │ 18 songs                    │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### Tag Card Design

**Structure:**
- Full width card
- Top row: Tag name (bold) + Dropdown menu [⋮] (right-aligned)
- Second row: Song count (smaller, muted)
- **No click action** on tag card (just display)

**Dropdown Menu (per tag):**
- Rename
- Delete

#### Sorting

- **Alphabetical by tag name** (A-Z)
- Case-sensitive sort

#### Actions

**+ New Tag Button:**
- Opens "Create Tag" modal/form
- Input: Tag name (max 50 chars)
- Creates tag (not assigned to any songs yet)
- Validation: No duplicates (case-sensitive)

**Rename Tag:**
- Opens inline edit or modal
- Change tag name
- Validation:
  - Max 50 chars
  - No duplicates (case-sensitive)
  - If duplicate: Show error toast "Tag already exists"
- On save: Updates tag name, all song associations remain (by tag ID)

**Delete Tag:**
- Confirmation: "Delete tag 'Rock'? It will be removed from all songs."
- On confirm:
  - Deletes all song_tags entries for this tag
  - Deletes tag itself
  - Shows toast: "Tag deleted"

#### Empty State

**No tags exist:**
```
┌─────────────────────────────────┐
│         🏷️                      │
│  No tags yet                    │
│  Create tags to organize        │
│  your songs                     │
│                                 │
│      [+ New Tag]                │
└─────────────────────────────────┘
```

---

### 9. Artists Page (`/artists`)

Page showing all artists with management options.

#### Layout

```
┌─────────────────────────────────┐
│ ← Artists                  [☰]  │
├─────────────────────────────────┤
│                   [+ New Artist] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ The Beatles            [⋮]  │ │ ← Artist card
│ │ 12 songs                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Casting Crowns         [⋮]  │ │
│ │ 8 songs                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ U2                     [⋮]  │ │
│ │ 0 songs                     │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### Artist Card Design

**Structure:**
- Full width card
- Top row: Artist name (bold) + Dropdown menu [⋮] (right-aligned)
- Second row: Song count (smaller, muted)
- Optional: Click anywhere on card → Filter songs list to show only this artist's songs

**Dropdown Menu (per artist):**
- Rename
- Delete

#### Sorting

- **Alphabetical by artist name** (A-Z)
- Case-sensitive sort

#### Actions

**+ New Artist Button:**
- Opens "Create Artist" modal/form
- Input: Artist name (max 100 chars)
- Creates artist (not assigned to any songs yet)
- Validation:
  - No duplicates (case-sensitive)
  - If duplicate: Show error toast "Artist already exists"
  - Name normalization: trim whitespace, collapse multiple spaces to single space

**Rename Artist:**
- Opens inline edit or modal
- Change artist name
- Validation:
  - Max 100 chars
  - No duplicates (case-sensitive)
  - Name normalization applied
  - If duplicate: Show error toast "Artist already exists"
- On save: Updates artist name for all songs (by artist ID)
- Shows toast: "Artist renamed"

**Delete Artist:**
- If artist is used by songs: Show error toast "Cannot delete artist used by [X] songs"
- If artist has 0 songs:
  - Confirmation: "Delete artist '[Artist Name]'?"
  - On confirm:
    - Deletes artist record
    - Shows toast: "Artist deleted"

#### Empty State

**No artists exist:**
```
┌─────────────────────────────────┐
│         🎤                      │
│  No artists yet                 │
│  Create artists to organize     │
│  your songs                     │
│                                 │
│      [+ New Artist]             │
└─────────────────────────────────┘
```

---

## Confirmation Dialogs

All destructive actions require confirmation.

### Delete Song

**Message:** "Delete '[Song Title]'? This cannot be undone."  
**Buttons:** Cancel | Delete

### Delete Tag

**Message:** "Delete tag '[Tag Name]'? It will be removed from all songs."  
**Buttons:** Cancel | Delete

### Delete List

**Message:** "Delete list '[List Name]'? Songs will not be deleted."  
**Buttons:** Cancel | Delete

### Delete Artist

**Message:** "Delete artist '[Artist Name]'?"  
**Buttons:** Cancel | Delete

**Note:** Only shown when artist has 0 songs. If artist is used by songs, show error toast instead.

### Create New Artist

**Message:** "Create new artist: [name]?"  
**Additional info (if similar artists exist):** "Did you mean: [Similar Artist Name]?"  
**Buttons:** Cancel | Create | [Use Similar Artist]

### Bulk Delete Songs

**Message:** "Delete [X] songs? This cannot be undone."  
**Buttons:** Cancel | Delete

### Unsaved Changes

**Message:** "You have unsaved changes. Discard them?"  
**Buttons:** Cancel | Discard

---

## Toast Notifications

All toast notifications are:
- **Discrete** (small, bottom or top of screen)
- **Auto-dismiss** after 3 seconds
- **Dark theme** consistent with app

### Success Toasts (Green/confirmation tone)

- "Song created"
- "Song updated"
- "Song deleted"
- "Song duplicated"
- "Tags updated"
- "Lists updated"
- "Order updated"
- "Tag created"
- "Tag renamed"
- "Tag deleted"
- "List created"
- "List renamed"
- "List deleted"
- "Removed from [List Name]"
- "Artist created"
- "Artist renamed"
- "Artist deleted"
- "[X] songs deleted"
- "[X] songs added to [List Name]"
- "Tags assigned to [X] songs"
- "Tags removed from [X] songs"

### Error Toasts (Red/warning tone)

- "Title is required"
- "Title is too long (max 100 characters)"
- "Tag already exists"
- "List already exists"
- "Artist already exists"
- "Cannot delete artist used by [X] songs"
- "Song already in list"
- "Network error. Please try again."
- "Failed to save. Please try again."
- "Invalid POC ID (must be 4 characters or empty)"

### Info Toasts (Blue/neutral tone)

- None currently defined

---

## Loading States

**Spinner:** Use single style throughout app (spinning circle or dots)

**When to show:**
- Fetching songs/tags/lists from database
- Saving changes
- Deleting items
- Any operation > 500ms

**Where to show:**
- For full page loads: Center of screen with overlay
- For individual operations: Inline (e.g., button shows spinner instead of text)

---

## Form Validation

### Real-time Validation

- **Title field:** Show error on blur if empty
- **Field lengths:** Show character count when approaching limit (e.g., "85/100")
- **POC ID:** Show error on blur if not empty and not 4 characters

### Submit Validation

- All validations run on save/create button click
- First error field is focused
- Inline error messages shown below each invalid field
- Submit button disabled while saving

---

## Responsive Behavior

### Mobile (< 640px)

- Single column layout
- Full width cards
- Sticky header and bottom bar
- Touch-friendly tap targets (min 44x44px)
- Hamburger menu
- Modals are full-screen overlays

### Tablet (640px - 1024px)

- Same as mobile, but wider cards (max-width)
- More comfortable spacing
- Modal dialogs (not full-screen)

### Desktop (> 1024px)

- Consider 2-column or grid layout for song cards
- Hover states become visible (currently none defined)
- Keyboard shortcuts potential (future enhancement)

---

## Accessibility Notes

- All interactive elements keyboard accessible
- Proper focus management in modals
- ARIA labels for icon buttons
- Color contrast meets WCAG AA standards
- Screen reader friendly (semantic HTML)

---

## Future Enhancements (Post-V1)

- Click on song card opens chart viewer (V2)
- Hover effects on cards
- Keyboard shortcuts
- Advanced search (by tags, artist, etc.)
- Export features
- Sharing features (V3)
- Light mode toggle
- Custom themes

---

**End of UI/UX Specification**
