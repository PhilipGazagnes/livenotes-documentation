# Livenotes JSON Structure Reference

**Version 1.0**

## Table of Contents

1. [Overview](#overview)
2. [Top-Level Structure](#top-level-structure)
3. [Meta Object](#meta-object)
4. [Patterns Object](#patterns-object)
5. [Sections Array](#sections-array)
6. [Prompter Array](#prompter-array)
7. [Data Types](#data-types)
8. [Complete Example](#complete-example)
9. [Usage Notes](#usage-notes)

---

## Overview

The Livenotes JSON format is the structured output generated from SongCode files. It contains all information needed to display and play a song in the Livenotes application.

### Purpose

- **Structured data**: Meta, patterns, and sections for logical song organization
- **Linear data**: Prompter array for display/scrolling/teleprompter view
- **Machine-readable**: Ready for consumption by music applications
- **Complete**: All timing, chord, and lyric information

---

## Top-Level Structure

```json
{
    "meta": {},
    "patterns": {},
    "sections": [],
    "prompter": []
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `meta` | Object | Song-level metadata (tempo, time signature, artist, etc.) |
| `patterns` | Object | Reusable chord progression patterns |
| `sections` | Array | Structural sections (verse, chorus, etc.) |
| `prompter` | Array | Linear display format for scrolling/teleprompter |

---

## Meta Object

Contains song-level information and settings.

### Structure

```json
{
    "meta": {
        "name": "Highway to Hell",
        "artist": "AC/DC",
        "bpm": 120,
        "timeSignature": {
            "numerator": 4,
            "denominator": 4
        },
        "originalFirstChordRoot": "A",
        "guitarCapo": null,
        "pitch": null,
        "warning": "Faire gaffe",
        "end": "Fin studio"
    }
}
```

### Properties

#### `name`
- **Type**: String or null
- **Description**: Song title
- **Max length**: 100 characters

#### `artist`
- **Type**: String or null
- **Description**: Artist or band name
- **Max length**: 100 characters

#### `bpm`
- **Type**: Integer or null
- **Range**: 0-400
- **Description**: Tempo in beats per minute

#### `timeSignature`
- **Type**: Object
- **Structure**:
  ```json
  {
      "numerator": 4,
      "denominator": 4
  }
  ```
- **Description**: Time signature for the song
- **Default**: `{"numerator": 4, "denominator": 4}`

#### `originalFirstChordRoot`
- **Type**: String (base chord) or null
- **Description**: Root note of the first chord in the original recording
- **Example**: `"A"`, `"Dm"`, `"Bb"`

#### `guitarCapo`
- **Type**: Integer or null
- **Range**: 1-20
- **Description**: Guitar capo position

#### `pitch`
- **Type**: Number or null
- **Range**: -10 to 10 (multiples of 0.5)
- **Description**: Pitch transposition calculated from `originalFirstChordRoot` vs actual first chord
- **Computed**: Automatically calculated, not specified in SongCode

#### `warning`
- **Type**: String or null
- **Max length**: 100 characters
- **Description**: Important performance notes or warnings

#### `end`
- **Type**: String or null
- **Max length**: 100 characters
- **Description**: How the song ends

---

## Patterns Object

Contains reusable chord progression patterns identified by alphabetical keys.

### Structure

```json
{
    "patterns": {
        "A": {
            "sc": "A;G;%;A",
            "json": [
                [["A", ""]],
                [["G", ""]],
                ["%"],
                [["A", ""]]
            ],
            "measures": 4
        },
        "B": {
            "sc": "[A;G;%;A]3\n:\nA;G;%;E;%",
            "json": [
                "loopStart",
                [["A", ""]],
                [["G", ""]],
                ["%"],
                [["A", ""]],
                "loopEnd:3",
                "newLine",
                [["A", ""]],
                [["G", ""]],
                ["%"],
                [["E", ""]],
                ["%"]
            ],
            "measures": 17
        }
    }
}
```

### Pattern Object

Each pattern is keyed by a letter (A, B, C, ...) and contains:

#### `sc`
- **Type**: String
- **Description**: Original SongCode pattern description
- **Purpose**: Reference/debugging

#### `json`
- **Type**: Array
- **Description**: Parsed JSON representation of the pattern
- **Elements**:
  - **Measure arrays**: `[[chord1], [chord2], ...]`
  - **Loop markers**: `"loopStart"`, `"loopEnd:n"`
  - **Line breaks**: `"newLine"`

#### `measures`
- **Type**: Integer
- **Description**: Total number of measures in the pattern
- **Calculation**: Includes loop expansions

### JSON Pattern Elements

#### Measure Array
```json
[["A", ""], ["D", "7"], ["%"], ["_"], ["="]]
```

Each measure is an array containing:

**Chord**: `[baseChord, extension]`
```json
[["Am", "7"]]        // Am7 chord
[["G", "sus4"]]      // Gsus4 chord
[["D", ""]]          // D major (no extension)
```

**Special Symbols**: String values
```json
["%"]    // Repeat previous chord
["_"]    // Silence
["="]    // Remove beats
```

#### Loop Markers
```json
"loopStart"          // Begin loop
"loopEnd:3"          // End loop, repeat 3 times total
```

#### Line Break
```json
"newLine"            // Visual line break for formatting
```

### Example Pattern

**SongCode**:
```songcode
$1
[A;D % G D]3
:
A;D;%
```

**JSON**:
```json
"A": {
    "sc": "[A;D % G D]3\n:\nA;D;%",
    "json": [
        "loopStart",
        [["A", ""]],
        [["D", ""], "%", ["G", ""], ["D", ""]],
        "loopEnd:3",
        "newLine",
        [["A", ""]],
        [["D", ""]],
        ["%"]
    ],
    "measures": 9
}
```

**Measure calculation**:
- Loop body: 2 measures (A, then D % G D)
- Loop repeats: 3 times = 6 measures
- After loop: 3 measures (A, D, %)
- **Total**: 9 measures

---

## Sections Array

Contains the structural sections of the song (verses, choruses, etc.).

### Structure

```json
{
    "sections": [
        {
            "name": "Verse",
            "comment": "Watch tempo",
            "pattern": {
                "id": "B",
                "repeat": 1,
                "bpm": null,
                "timeSignature": null,
                "cutStart": null,
                "cutEnd": null,
                "before": null,
                "after": null
            },
            "lyrics": [
                ["Living easy, living free", 2],
                ["Season ticket on a one-way ride", 2]
            ]
        }
    ]
}
```

### Section Object

#### `name`
- **Type**: String
- **Description**: Section name (e.g., "Verse", "Chorus", "Bridge")

#### `comment`
- **Type**: String or null
- **Description**: Optional comment about the section
- **Example**: "Watch tempo", "Slower here"

#### `pattern`
- **Type**: Object
- **Description**: Pattern usage and modifiers for this section

##### Pattern Properties

###### `id`
- **Type**: String (pattern key)
- **Description**: References a pattern from the `patterns` object
- **Example**: `"A"`, `"B"`, `"C"`

###### `repeat`
- **Type**: Integer
- **Description**: Number of times to repeat the pattern
- **Default**: 1
- **Example**: 2 means play the pattern twice

###### `bpm`
- **Type**: Integer or null
- **Description**: Section-specific tempo override
- **Example**: 140 (faster than global tempo)

###### `timeSignature`
- **Type**: Object or null
- **Description**: Section-specific time signature override
- **Structure**: Same as meta.timeSignature

###### `cutStart`
- **Type**: Array `[measures, beats]` or null
- **Description**: Cut measures/beats from the beginning
- **Example**: `[1, 2]` = cut 1 measure and 2 beats from start

###### `cutEnd`
- **Type**: Array `[measures, beats]` or null
- **Description**: Cut measures/beats from the end
- **Example**: `[2, 0]` = cut 2 measures from end

###### `before`
- **Type**: Object or null
- **Description**: Pattern to play before the main pattern
- **Structure**:
  ```json
  {
      "sc": "Am;D",
      "json": [[["Am", ""]], [["D", ""]]],
      "measures": 2
  }
  ```

###### `after`
- **Type**: Object or null
- **Description**: Pattern to play after the main pattern
- **Structure**: Same as `before`

#### `lyrics`
- **Type**: Array of arrays
- **Description**: Lyric lines with measure counts
- **Structure**: `[lyric_text, measure_count]`
- **Example**:
  ```json
  [
      ["First line", 2],
      ["Second line", 3]
  ]
  ```

### Complete Section Example

```json
{
    "name": "Chorus",
    "comment": null,
    "pattern": {
        "id": "C",
        "repeat": 2,
        "bpm": null,
        "timeSignature": null,
        "cutStart": null,
        "cutEnd": [1, 0],
        "before": null,
        "after": {
            "sc": "G;A",
            "json": [[["G", ""]], [["A", ""]]],
            "measures": 2
        }
    },
    "lyrics": [
        ["I'm on the highway to hell", 2],
        ["Highway to hell", 2]
    ]
}
```

---

## Prompter Array

Linear array for display/scrolling view. Expands all patterns and pairs each lyric with its chords.

### Structure

```json
{
    "prompter": [
        {
            "type": "tempo",
            "bpm": 120,
            "timeSignature": "4/4"
        },
        {
            "type": "content",
            "style": "info",
            "lyrics": "Intro",
            "chords": [
                {
                    "repeats": 2,
                    "pattern": [
                        [["A", ""]],
                        [["G", ""]],
                        ["%"],
                        [["A", ""]]
                    ]
                }
            ]
        }
    ]
}
```

### Item Types

#### Tempo Item

Indicates tempo or time signature change.

```json
{
    "type": "tempo",
    "bpm": 120,
    "timeSignature": "4/4"
}
```

**Properties**:
- `type`: Always `"tempo"`
- `bpm`: Integer (tempo)
- `timeSignature`: String format (e.g., `"4/4"`, `"3/4"`)

#### Content Item

Displays lyric with chord progression.

```json
{
    "type": "content",
    "style": "default",
    "lyrics": "Living easy, living free",
    "chords": [
        {
            "repeats": 1,
            "pattern": [
                [["A", ""]],
                [["G", ""]]
            ]
        }
    ]
}
```

**Properties**:

##### `type`
- **Value**: `"content"`

##### `style`
- **Type**: String
- **Values**:
  - `"default"`: Normal lyric line
  - `"info"`: Information visible to all (from `***text***`)
  - `"musicianInfo"`: Information visible to musicians only (from `:::text:::`)

##### `lyrics`
- **Type**: String
- **Description**: The lyric text to display

##### `chords`
- **Type**: Array of chord pattern objects
- **Description**: Chord progressions for this lyric line

### Chord Pattern Object

```json
{
    "repeats": 2,
    "pattern": [
        [["A", ""]],
        [["D", ""], "%", ["G", ""], ["D", ""]]
    ]
}
```

#### `repeats`
- **Type**: Integer
- **Description**: Number of times the pattern repeats
- **Optimization**: Pattern is simplified to reduce redundancy
- **Example**: If a pattern appears 4 times identically, it's stored once with `repeats: 4`

#### `pattern`
- **Type**: Array of measures
- **Description**: Array of measure arrays
- **Structure**: Each measure is an array of chord/symbol elements

### Prompter Generation Logic

1. **Start with tempo item** using global metadata
2. **For each section**:
   - Add tempo item if section has tempo changes
   - Expand pattern (resolve loops, apply modifiers)
   - For each lyric line:
     - Take the specified number of measures
     - Create content item with lyric + chords
     - Optimize pattern (detect repetitions)

### Style Detection

Based on lyric content:
- `***Guitar Solo***` → `style: "info"`
- `:::Watch drummer:::` → `style: "musicianInfo"`
- Normal lyrics → `style: "default"`

### Pattern Optimization Example

**Before optimization**:
```json
{
    "repeats": 1,
    "pattern": [
        [["A", ""]],
        [["D", ""]],
        [["A", ""]],
        [["D", ""]]
    ]
}
```

**After optimization**:
```json
{
    "repeats": 2,
    "pattern": [
        [["A", ""]],
        [["D", ""]]
    ]
}
```

The algorithm detects that the pattern can be split in half with both halves identical.

---

## Data Types

### Chord Notation

**Format**: `[baseChord, extension]`

```json
[["Am", "7"]]       // Am7
[["G", "sus4"]]     // Gsus4
[["D", ""]]         // D (no extension)
```

### Time Signature

**Format**: Object with numerator and denominator

```json
{
    "numerator": 3,
    "denominator": 4
}
```

### Measures and Beats Array

**Format**: `[measures, beats]`

```json
[2, 0]      // 2 measures, 0 beats
[1, 2]      // 1 measure, 2 beats
[0, 3]      // 0 measures, 3 beats
```

---

## Complete Example

Here's a minimal but complete Livenotes JSON:

```json
{
    "meta": {
        "name": "Simple Song",
        "artist": "The Band",
        "bpm": 100,
        "timeSignature": {
            "numerator": 4,
            "denominator": 4
        },
        "originalFirstChordRoot": null,
        "guitarCapo": null,
        "pitch": null,
        "warning": null,
        "end": null
    },
    "patterns": {
        "A": {
            "sc": "G;C;D;G",
            "json": [
                [["G", ""]],
                [["C", ""]],
                [["D", ""]],
                [["G", ""]]
            ],
            "measures": 4
        }
    },
    "sections": [
        {
            "name": "Verse",
            "comment": null,
            "pattern": {
                "id": "A",
                "repeat": 2,
                "bpm": null,
                "timeSignature": null,
                "cutStart": null,
                "cutEnd": null,
                "before": null,
                "after": null
            },
            "lyrics": [
                ["First line", 2],
                ["Second line", 2],
                ["Third line", 2],
                ["Fourth line", 2]
            ]
        }
    ],
    "prompter": [
        {
            "type": "tempo",
            "bpm": 100,
            "timeSignature": "4/4"
        },
        {
            "type": "content",
            "style": "default",
            "lyrics": "First line",
            "chords": [
                {
                    "repeats": 1,
                    "pattern": [
                        [["G", ""]],
                        [["C", ""]]
                    ]
                }
            ]
        },
        {
            "type": "content",
            "style": "default",
            "lyrics": "Second line",
            "chords": [
                {
                    "repeats": 1,
                    "pattern": [
                        [["D", ""]],
                        [["G", ""]]
                    ]
                }
            ]
        },
        {
            "type": "content",
            "style": "default",
            "lyrics": "Third line",
            "chords": [
                {
                    "repeats": 1,
                    "pattern": [
                        [["G", ""]],
                        [["C", ""]]
                    ]
                }
            ]
        },
        {
            "type": "content",
            "style": "default",
            "lyrics": "Fourth line",
            "chords": [
                {
                    "repeats": 1,
                    "pattern": [
                        [["D", ""]],
                        [["G", ""]]
                    ]
                }
            ]
        }
    ]
}
```

---

## Usage Notes

### For Application Developers

#### Using Sections
- Use `sections` array for **structural view** (editing, overview)
- Navigate by section names
- Apply section-level modifiers when playing

#### Using Prompter
- Use `prompter` array for **linear view** (performance, scrolling)
- Display one item at a time
- Scroll through for teleprompter mode
- Use `style` to format info vs lyrics differently

#### Rendering Chords
- Parse chord arrays: `[["Am", "7"]]` → Display as "Am7"
- Handle special symbols: `%` (repeat), `_` (silence), `=` (shortened)
- Use `repeats` value to show pattern repetition visually

#### Tempo Changes
- Watch for `type: "tempo"` items in prompter
- Update metronome/click track accordingly
- Display tempo change notification

### For Parser Developers

#### Pattern ID Assignment
- Assign alphabetically in order of first appearance
- Compare patterns after variable substitution
- Match on base pattern only (ignore modifiers)

#### Prompter Optimization
- Always try to simplify patterns
- Check if pattern can be divided into equal halves
- Repeat optimization recursively

#### Error Handling
- Validate all measure counts
- Check chord/beat divisions fit time signature
- Ensure lyric timing matches section measures

---

## Summary

The Livenotes JSON format provides:

1. **Meta**: Song information and settings
2. **Patterns**: Reusable chord progressions with multiple representations (SC, JSON, measures)
3. **Sections**: Structural organization with patterns and modifiers
4. **Prompter**: Linear display format optimized for performance

This dual representation (structured + linear) enables both editing/organization and performance/display use cases.

For information on how SongCode is parsed into this format, see the **Parser/Generator Specification** document.
