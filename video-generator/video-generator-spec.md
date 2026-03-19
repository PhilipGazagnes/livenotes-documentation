# Video Generator — Specification

**Version 1.0 — POC**

## Table of Contents

1. [Overview](#overview)
2. [Inputs & Outputs](#inputs--outputs)
3. [Configuration Parameters](#configuration-parameters)
4. [Video Specifications](#video-specifications)
5. [Technical Stack](#technical-stack)
   - [Dependencies](#dependencies)
   - [Module Structure](#module-structure)
   - [Frame Pipeline](#frame-pipeline)
   - [Performance Strategy](#performance-strategy)
6. [Rendering Model](#rendering-model)
   - [Timeline Construction](#timeline-construction)
   - [Timing Calculations](#timing-calculations)
7. [Visual Layout](#visual-layout)
   - [Screen Layout](#screen-layout)
   - [Block Structure](#block-structure)
   - [Chord Row Format](#chord-row-format)
   - [Dot Row Format](#dot-row-format)
   - [Repeat Dots](#repeat-dots)
8. [Animation](#animation)
   - [Beat Dot Progression](#beat-dot-progression)
   - [Repeat Dot Progression](#repeat-dot-progression)
   - [Block Scroll Transition](#block-scroll-transition)
9. [Special Blocks](#special-blocks)
   - [Song Header Block](#song-header-block)
   - [Count-in Block](#count-in-block)
10. [Style Reference](#style-reference)

---

## Overview

The video generator takes a **Livenotes JSON** file and an **audio file** as input and produces a **karaoke-style video** that displays chords and lyrics in sync with the music.

The display is a vertically scrolling stack of content blocks — one per lyric line — that rolls upward like movie credits as the song progresses. The active block sits at the center of the screen. Beat position and chord repetitions are indicated by animated dot markers.

---

## Inputs & Outputs

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| Livenotes JSON | `.json` file | Structured song data: meta, patterns, sections, prompter |
| Audio file | `.mp3` or `.wav` | Recording of the song, including count-in beats at the start |

### Output

| Output | Type | Description |
|--------|------|-------------|
| Video file | `.mp4` | Full HD video with the audio muxed in |

---

## Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `countIn` | Integer ≥ 0 | `4` | Number of count-in beats present at the start of the audio file. These beats run at the song's initial BPM. Set to `0` if the audio starts on beat 1. |
| `anticipation` | Integer ≥ 0 | `0` | How many beats before a new block becomes active the scroll animation begins. `0` = scroll is instantaneous, triggered exactly on beat 1 of the new block. `1` = animation starts 1 beat early and completes on beat 1. `2` = 2 beats early, etc. |

---

## Video Specifications

| Property | Value |
|----------|-------|
| Resolution | 1920 × 1080 (Full HD) |
| Frame rate | 60 fps |
| Video codec | H.264 |
| Audio codec | AAC |
| Container | MP4 |
| Color scheme | Dark mode (see [Style Reference](#style-reference)) |

---

## Technical Stack

### Dependencies

| Package | Role |
|---------|------|
| `Pillow` | 2D frame rendering — text, shapes, dots |
| `ffmpeg-python` | FFmpeg subprocess wrapper — video encoding and audio muxing |
| FFmpeg (system binary) | H.264 encoding, AAC audio, MP4 container |

Python stdlib only beyond those two packages (`json`, `subprocess`, `math`, `dataclasses`).

### Module Structure

```
video_generator/
├── main.py              # Entry point — parses args, wires modules together
├── timeline.py          # Builds the event timeline from the Livenotes JSON
├── state.py             # Computes visual state at any timestamp t
├── renderer.py          # Renders a single frame (Pillow) given a visual state
├── encoder.py           # Manages the FFmpeg pipe — writes frames, muxes audio
└── layout.py            # Layout constants (sizes, colors, fonts, spacing)
```

**`main.py`**
- Reads the JSON file and audio file paths from CLI arguments
- Accepts `--count-in` and `--anticipation` parameters
- Calls `timeline.build()`, then runs the frame loop, then finalizes the video

**`timeline.py`**
- Walks the `prompter` array
- Handles `tempo` items (updates current BPM/time signature, no visual output)
- Computes absolute `start_time` and `duration` for every visual block
- Produces a flat, ordered list of timed events:
  - `BlockStart(t, block_data)` — a content or count-in block becomes active
  - `BeatFire(t, block_id, measure_idx, beat_idx, repeat_idx)` — a beat dot fires
  - `ScrollStart(t, from_block, to_block, duration)` — scroll animation begins

**`state.py`**
- Given timestamp `t` and the event list, returns a `VisualState` object:
  - Which block is active
  - Current scroll offset (0.0–1.0, interpolated for smooth scroll)
  - Which beat dot is lit per visible block
  - Which repeat dot is lit per visible block
- Scroll interpolation uses ease-in-out (`smoothstep`)

**`renderer.py`**
- Takes a `VisualState` and returns a `PIL.Image` (1920×1080, RGB)
- Draws background, then iterates visible blocks from bottom to top
- Each block: lyrics row → chord row → dot row
- Active block is drawn full brightness; others are dimmed by distance

**`encoder.py`**
- Opens an FFmpeg subprocess with stdin pipe
- Accepts frames as raw RGB bytes via `write_frame(image)`
- On `finalize(audio_path)`, closes the video pipe then runs a second FFmpeg pass to mux in the audio

### Frame Pipeline

```
for each frame n at t = n / 60.0:
    state  = state.compute(t)
    image  = renderer.render(state)
    encoder.write_frame(image)

encoder.finalize(audio_path)
```

FFmpeg is invoked with:
```
ffmpeg -f rawvideo -pix_fmt rgb24 -s 1920x1080 -r 60 -i pipe:0
       -i <audio_file>
       -c:v libx264 -crf 18 -preset fast
       -c:a aac -b:a 192k
       -shortest
       output.mp4
```

### Performance Strategy

Rendering every frame with Pillow is the bottleneck. Two optimizations apply:

**1. Skip identical frames**

Between two consecutive events (e.g., two beat fires), all frames are visually identical. Rather than re-rendering, the encoder duplicates the last frame:

```python
# pseudo-code
if state == last_state:
    encoder.repeat_last_frame()
else:
    image = renderer.render(state)
    encoder.write_frame(image)
    last_state = state
```

This is the dominant optimization — at 120 BPM in 4/4, beats are 0.5 s apart = 30 identical frames each.

**2. Scroll animation frames are the only unavoidable per-frame renders**

During a scroll transition of duration D seconds, D × 60 frames must each be rendered individually (scroll offset changes every frame). All other frames benefit from deduplication.

---

## Rendering Model

### Timeline Construction

The timeline is built by processing the `prompter` array sequentially and assigning an **absolute start time (in seconds)** to each visual block.

**Step 1 — Initialize clock**

```
current_time = 0
current_bpm = meta.bpm
current_time_sig = meta.time  (numerator / denominator)
```

**Step 2 — Insert count-in block**

If `countIn > 0`, insert a Count-in block at `t = 0` with duration:

```
count_in_duration = countIn × (60 / current_bpm)
current_time += count_in_duration
```

**Step 3 — Insert song header block**

Insert a Song Header block (title + artist from `meta`) at `t = 0`. This block has no duration of its own — it is a visual element at the top of the initial content stack and scrolls away as the song progresses.

**Step 4 — Process prompter items**

For each item in the `prompter` array:

- **If `type: "tempo"`** → silently update `current_bpm` and/or `current_time_sig`. No visual block is created. No time is consumed.

- **If `type: "content"`** → create a visual block with:
  - `start_time = current_time`
  - `duration = total_measures × seconds_per_measure`
  - Then advance: `current_time += duration`

Where:

```
seconds_per_beat    = 60 / current_bpm
seconds_per_measure = seconds_per_beat × current_time_sig.numerator
total_measures      = Σ (chord_group.repeats × chord_group.pattern.length)
                      for each chord_group in content_item.chords
```

### Timing Calculations

**Measure duration** at a given BPM and time signature:

```
seconds_per_measure = (60 / bpm) × time_numerator
```

Example: BPM 120, 4/4 → `(60 / 120) × 4 = 2.0 s` per measure.

**Beat duration**:

```
seconds_per_beat = 60 / bpm
```

**Block duration** (content item):

```
block_duration = Σ (chord_group.repeats × chord_group.pattern.length) × seconds_per_measure
```

**Beat absolute timestamps** within a block (for dot animation):

Each beat in the block has an absolute timestamp derived from its position in the sequence of measures. Given:
- Block starts at `t_block`
- Measure index `m` (0-based, after expanding repeats)
- Beat index `b` within that measure (0-based)

```
t_beat = t_block + (m × seconds_per_measure) + (b × seconds_per_beat)
```

---

## Visual Layout

### Screen Layout

```
┌─────────────────────────────────────────┐
│                                         │
│  Song Title — Artist Name               │  ← Song header (fades as song starts)
│                                         │
│  [past block]                           │  ← dimmed
│  [past block]                           │  ← dimmed
│                                         │
│  ████████████████████████████████████   │  ← ACTIVE BLOCK (centered)
│                                         │
│  [upcoming block]                       │  ← dimmed
│  [upcoming block]                       │  ← dimmed
│  [upcoming block]                       │  ← dimmed
│                                         │
└─────────────────────────────────────────┘
```

- The active block is vertically centered on screen.
- As many dimmed blocks as fit are shown above (past) and below (upcoming).
- Blocks scroll continuously upward; the transition is driven by the `anticipation` parameter.
- The song header sits at the top of the initial stack and scrolls off naturally.

### Block Structure

Each block occupies a fixed-height row and is composed of two lines:

```
Line 1 — Lyrics row:   Living easy, living free
Line 2 — Chord row:    A   |G   |G   |A         ..
Line 3 — Dot row:      ....|....|....|....
```

**Active block**: lyrics are bold, beat dots are bright.
**Inactive blocks**: all elements are dimmed.

### Chord Row Format

The chord row contains:

1. **Chord cells** — each chord name left-aligned within a fixed-width cell
2. **Measure separators** — a `|` character between measures
3. **Repeat dots** — on the far right, one dot per repeat (see [Repeat Dots](#repeat-dots))

**Chord cell width**: fixed at the same width as the dot row cells below (4 characters wide for 4/4, 3 for 3/4, etc. — one character per beat of the measure).

**Special chord symbols**:

| Symbol | Display |
|--------|---------|
| `["Am", "7"]` | `Am7` |
| `["G", ""]` | `G` |
| `%` | `%` |
| `_` | `_` |

**Multiple chords per measure**: displayed inline with a space separator within the cell:

```
A D |G   |E   |A D
.. ..|....|....|.. ..
```

Each chord sub-cell is proportional to its beat count within the measure.

**Example — 4/4, pattern `[A D, G, E, A D]`, repeats 2:**

```
A D |G   |E   |A D       ..
.. ..|....|....|.. ..
```

### Dot Row Format

Each beat in each measure has one dot. Dots are grouped by measure and separated by `|` to mirror the chord row above.

- **Active beat**: highlighted dot (bright accent color)
- **Past beats** (within the current pass): slightly brighter than inactive
- **Future beats**: dim

In 4/4, each measure produces 4 dots: `....`
In 3/4, each measure produces 3 dots: `...`

For measures with multiple chords, dots are grouped under their respective chord:

```
Chord row:   A D |G
Dot row:     .. ..|....
```

Where `A` gets 2 dots (2 beats) and `D` gets 2 dots (2 beats) in 4/4 time.

### Repeat Dots

When `chord_group.repeats > 1`, a row of dots appears to the right of the chord row, separated by a small gap:

- One dot per repetition
- The dot for the currently playing repetition is highlighted
- Dots for completed repetitions are dim
- Dots for future repetitions are dim

```
A   |G   |G   |A         ●○○    ← on first of 3 repetitions
....|....|....|....
```

If `repeats = 1`, no repeat dots are shown.

---

## Animation

### Beat Dot Progression

- At each beat boundary, the active dot advances to the next position.
- Beat boundaries are computed from absolute timestamps (see [Timing Calculations](#timing-calculations)).
- The active dot changes state instantaneously on the beat (no interpolation).
- At the end of one repetition of a pattern, the dot wraps back to the first dot of the first measure.
- The repeat dot advances simultaneously (see below).

### Repeat Dot Progression

- When a pattern repetition completes, the highlighted repeat dot advances to the next one.
- This happens exactly at the beat boundary that starts the new repetition.

### Block Scroll Transition

The scroll animation moves the entire content stack upward so that the next block becomes centered.

- **Trigger time**: `block_start_time − (anticipation × seconds_per_beat)`
- **Duration**: `anticipation × seconds_per_beat`
- **Easing**: smooth (ease-in-out)
- **When `anticipation = 0`**: the transition is instantaneous (single frame snap), triggered exactly at `block_start_time`.

The newly active block's beat dot animation starts independently at `block_start_time`, regardless of the scroll animation state.

---

## Special Blocks

### Song Header Block

Displays the song's title and artist from `meta`.

```
Highway to Hell — AC/DC
```

- Positioned at the top of the initial content stack (above the count-in block).
- Treated as a regular block with no duration: it has no beat dots and no chord row.
- Scrolls off naturally as the count-in and first content blocks animate upward.
- If `meta.name` or `meta.artist` is null, only the available field is shown. If both are null, this block is omitted.

### Count-in Block

Displayed if `countIn > 0`. It occupies the active center position during the count-in period.

**Structure**:

```
Line 1 — Label:    Count
Line 2 — Dot row:  ....          ← one dot per count-in beat
```

- Dot row contains exactly `countIn` dots.
- Beat dots animate at the song's initial BPM.
- No chord row, no repeat dots.
- When the count-in ends, the first content block scrolls into the active position.

---

## Style Reference

### Dark Mode Color Palette

| Element | Color |
|---------|-------|
| Background | `#111111` |
| Active lyrics text | `#FFFFFF` |
| Active chord text | `#FFFFFF` |
| Inactive block text | `#555555` |
| Active beat dot | `#F5A623` (amber) |
| Past beat dots (current pass) | `#888888` |
| Future / inactive beat dots | `#333333` |
| Active repeat dot | `#F5A623` (amber) |
| Inactive repeat dots | `#333333` |
| Measure separator `\|` | `#444444` |
| Song header text | `#AAAAAA` |

### Typography

| Element | Style |
|---------|-------|
| Active lyrics | Bold, large |
| Inactive lyrics | Regular, same size |
| `info` style lyrics | Italic |
| `musicianInfo` style lyrics | Italic (same as `info`) |
| Chord names | Monospace |
| Song header | Regular, slightly larger |
| Count-in label | Regular |

### Content Styles

The `style` field on each prompter content item maps as follows:

| `style` value | Rendering |
|---------------|-----------|
| `"default"` | Normal lyrics text |
| `"info"` | Italic text (visible to all) |
| `"musicianInfo"` | Italic text (visible to all in this context) |
