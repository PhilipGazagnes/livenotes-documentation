# SongCode Parser/Generator Specification

**Version 1.0**

## Table of Contents

1. [Overview](#overview)
2. [Input and Output](#input-and-output)
3. [Phase 1: First Pass Parsing](#phase-1-first-pass-parsing)
4. [Phase 2: Pattern Transformation](#phase-2-pattern-transformation)
5. [Phase 3: Validation](#phase-3-validation)
6. [Phase 4: Prompter Generation](#phase-4-prompter-generation)
7. [Error Handling](#error-handling)
8. [Algorithm Details](#algorithm-details)
9. [Edge Cases](#edge-cases)

---

## Overview

This document specifies how a SongCode (`.sc`) file is parsed and transformed into a Livenotes JSON structure.

### Process Flow

```
SongCode File (.sc)
    ↓
[Phase 1] First Pass Parsing
    ↓
[Phase 2] Pattern Transformation
    ↓
[Phase 3] Validation
    ↓
[Phase 4] Prompter Generation
    ↓
Livenotes JSON
```

### Design Principles

1. **Early validation**: Stop immediately on errors with clear feedback
2. **Separation of concerns**: Parse structure, then validate semantics
3. **Pattern reuse**: Patterns defined once, used many times
4. **Two representations**: Structured data (sections) + linear display (prompter)

---

## Input and Output

### Input: SongCode File

A text file with `.sc` extension containing:
- Optional metadata (starting with `@`)
- Optional pattern definitions (starting with `$`)
- Required sections (song structure)

### Output: Livenotes JSON

A JSON object with four top-level keys:

```json
{
    "meta": {},
    "patterns": {},
    "sections": [],
    "prompter": []
}
```

---

## Phase 1: First Pass Parsing

This phase reads the SongCode file and populates the initial structure.

### Step 1.1: Initialize Output

Create the base Livenotes JSON structure:

```json
{
    "meta": {},
    "patterns": {},
    "sections": [],
    "prompter": []
}
```

### Step 1.2: Parse Metadata

**Location**: Beginning of file  
**Start marker**: Lines starting with `@`  
**End marker**: First line not starting with `@` (excluding empty lines)

#### Algorithm

1. Read lines from the beginning
2. Skip empty lines
3. For each line starting with `@`:
   - Extract key and value
   - Validate key against allowed metadata keys
   - Validate value format for the specific key
   - Store in `livenotes.meta`
4. Continue until a non-`@`, non-empty line is found

#### Metadata Keys and Validation

| Key | Type | Validation | Default |
|-----|------|------------|---------|
| `name` | string | max 100 chars | null |
| `artist` | string | max 100 chars | null |
| `originalFirstChordRoot` | base chord | valid base chord | null |
| `guitarCapo` | integer | 1-20 | null |
| `bpm` | integer | 0-400 | null |
| `timeSignature` | time sig | `n/d` where d is power of 2 | 4/4 |
| `warning` | string | max 100 chars | null |
| `end` | string | max 100 chars | null |

#### Time Signature Parsing

Input: `4/4`  
Output:
```json
{
    "numerator": 4,
    "denominator": 4
}
```

#### Error Conditions

- Non-consecutive metadata lines → **ERROR**: "Metadata must be consecutive at the beginning of the file"
- Invalid key → **ERROR**: "Unknown metadata key: @invalidKey"
- Invalid value → **ERROR**: "Invalid value for @bpm: must be 0-400"

### Step 1.3: Parse Pattern Definitions

**Location**: After metadata, before sections  
**Start marker**: Lines starting with `$`
**End marker**: First section (line not starting with `$` after patterns)

#### Algorithm

1. After metadata parsing, look for lines starting with `$`
2. For each pattern block:
   - First line: `$n` where n is the pattern identifier
   - Following lines (until empty line): pattern description
   - Store in temporary map: `patternDefinitions[$n] = "description"`
3. Continue until a line that doesn't start with `$` is found

#### Pattern Variable Resolution

Pattern definitions can reference other pattern variables:

```songcode
$1
A;G

$2
$1;D;E
```

**Resolution**:
1. Parse all pattern definitions into temporary storage
2. For each definition, recursively replace `$n` references with their definitions
3. Store the fully expanded pattern description

#### Error Conditions

- Non-consecutive pattern blocks → **ERROR**: "Pattern definitions must be consecutive"
- Undefined pattern reference → **ERROR**: "Pattern $5 is not defined"
- Circular reference → **ERROR**: "Circular reference detected: $1 → $2 → $1"
- Redefinition → **ERROR**: "Pattern $1 is already defined"

### Step 1.4: Parse Sections

**Location**: After metadata and patterns  
**Delimiter**: Empty lines separate sections

#### Section Structure

```
SectionName[!Comment]
[Section Metadata (optional)]
[Pattern Description or $n (optional)]
[Pattern Modifiers (optional)]
--
Lyric Line 1
Lyric Line 2
...
```

#### Algorithm

1. Split remaining file content by empty lines (each block is a section)
2. For each section block:
   - **Line 1**: Parse name and optional comment
     - Split by `!` if present
     - `section.name = name`
     - `section.comment = comment` (or null)
   
   - **After Line 1, before `--`**: Pattern area
     - Collect lines starting with `@` → section-level metadata
     - Collect lines starting with `_` → pattern modifiers
     - Remaining lines → pattern description
   
   - **After `--`**: Lyrics area
     - Each line is a lyric
     - Parse measure count if present (`_n` at end)
     - Store as `[lyric_text, measure_count]`

#### Section Object Structure

```json
{
    "name": "Verse",
    "comment": "Watch tempo",
    "pattern": {
        "id": null,
        "repeat": 1,
        "bpm": null,
        "timeSignature": null,
        "cutStart": null,
        "cutEnd": null,
        "before": null,
        "after": null
    },
    "lyrics": [
        ["First line", 2],
        ["Second line", 2]
    ]
}
```

#### Pattern Description Processing

1. Check if description is a pattern variable (`$n`)
2. If yes, replace with the stored pattern definition
3. Store the expanded description temporarily as `section.pattern.sc`

**Note**: a pattern can be empty

#### Pattern Modifier Parsing

**`_repeat n`**:
- Parse integer n (must be ≥ 2)
- Store in `section.pattern.repeat`

**`_cutStart` and `_cutEnd`**:
- Parse measures-and-beats notation
- Convert to `[measures, beats]` array
- Examples:
  - `2` → `[2, 0]`
  - `1-2` → `[1, 2]`
  - `-3` → `[0, 3]`

**`_before` and `_after`**:
- Parse pattern description
- Store in `section.pattern.before.sc` or `section.pattern.after.sc`
- Create object: `{ sc: "pattern_description", json: null, measures: null }`

#### Section-Level Metadata

Lines starting with `@` in the pattern area override global metadata for that section:
- `@bpm 140` → `section.pattern.bpm = 140`
- `@timeSignature 3/4` → `section.pattern.timeSignature = {numerator: 3, denominator: 4}`

#### Pattern ID Assignment

As sections are parsed, assign pattern IDs alphabetically ("A", "B", "C", ...):

1. For the first section:
   - Assign pattern ID "A"
   - Store pattern description in `livenotes.patterns["A"].sc`
   - Set `section.pattern.id = "A"`

2. For subsequent sections:
   - Compare pattern description (before modifiers) with existing patterns
   - If match found: reuse that pattern ID
   - If no match: create new pattern ID (next letter)
   - Set `section.pattern.id = "[ID]"`

**Pattern Matching Rules**:
- Match on base pattern description only (ignore modifiers)
- After pattern variable substitution
- Whitespace should be normalized
- `Am D;Am` and `Am D ; Am   ` are equal
- **Normalization process**: Delete useless whitespaces in each measure (before the first chord, after the last chord, more than 1 space between chords)

#### Error Conditions

- Missing `--` separator before lyrics → **ERROR**: "Section must have '--' separator before lyrics" (if no lyrics, `--` separator is not mandatory)
- Invalid modifier value → **ERROR**: "Invalid value for _repeat: must be ≥ 2"
- Invalid measures-and-beats notation → **ERROR**: "Invalid cutEnd value: 1-a-2"

---

## Phase 2: Pattern Transformation

Transform pattern descriptions from SongCode syntax to JSON representation.

### Step 2.1: Parse Pattern Descriptions

For each pattern in `livenotes.patterns`:
- Input: `patterns[id].sc` (string)
- Output: `patterns[id].json` (array)

#### Pattern Description Syntax

| Syntax | Meaning | JSON Output |
|--------|---------|-------------|
| `;` | Measure separator | Split into array elements |
| `[` | Loop start | `"loopStart"` |
| `]n` | Loop end | `"loopEnd:n"` |
| `:` | Line break | `"newLine"` |
| `A`, `Dm7`, etc. | Chord | `[["A", ""], ["Dm", "7"]]` |
| `%` | Repeat chord | `"%"` |
| `_` | Silence | `"_"` |
| `=` | Remover | `"="` |

#### Transformation Algorithm

1. **Line breaks**:
   - Replace `;` with newline
   - Replace `[` with newline + `"loopStart"` + newline
   - Replace `]n` with newline + `"loopEnd:n"` + newline
   - Replace `:` with newline + `"newLine"` + newline

2. **For each line** (measure):
   - If line is a special marker (`"loopStart"`, `"loopEnd:n"`, `"newLine"`):
     - Add directly to JSON array
   - If line is a measure:
     - Split by spaces to get items
     - For each item:
       - If `%`, `_`, or `=`: add as string
       - If chord: split into base and extension, add as `[base, extension]`
     - Add measure array to JSON array

#### Chord Parsing

**Algorithm**:
1. Match longest valid base chord from the beginning
2. Remaining characters are the extension
3. Return `[base, extension]`

**Example**:
- Input: `Am7sus4`
- Match: `Am` (base)
- Remaining: `7sus4` (extension)
- Output: `["Am", "7sus4"]`

**Base Chord Recognition**:
- Try three characters: `A#m`, `Abm`, `Bbm`, etc.
- Try two characters: `Am`, `A#`, `Ab`, `Bb`, etc.
- Try one character: `A`, `B`, `C`, etc.

#### Example Transformation

**Input**:
```songcode
[A;G;%;A]3
:
A;G;%;E;%
```

**Output**:
```json
[
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
]
```

#### Error Conditions

- Invalid chord notation → **ERROR**: "Invalid chord: Xm (not a valid base chord)"
- Remover not at end → **ERROR**: "Remover (=) must be at end of measure"
- Mismatched loop brackets → **ERROR**: "Loop started but not closed"

### Step 2.2: Parse Modifier Patterns

Apply the same transformation to pattern descriptions in modifiers:
- `section.pattern.before.sc` → `section.pattern.before.json`
- `section.pattern.after.sc` → `section.pattern.after.json`

### Step 2.3: Calculate Pattern Measure Counts

For each pattern in `livenotes.patterns`, calculate total measures:

#### Algorithm

1. Initialize count = 0
2. Initialize loop stack = []
3. For each element in pattern JSON:
   - If `"loopStart"`: push current count to stack
   - If `"loopEnd:n"`:
     - Pop start count from stack
     - Calculate loop measures = current count - start count
     - Add loop measures × (n - 1) to count
   - If `"newLine"`: skip
   - If measure array: count++
4. Store in `patterns[id].measures`

#### Example

Pattern:
```json
[
    "loopStart",
    [["A", ""]],
    [["G", ""]],
    "loopEnd:3",
    [["D", ""]]
]
```

Calculation:
1. Count measures in loop body: 2
2. Multiply by repetitions: 2 × 3 = 6
3. Add measures after loop: 6 + 1 = 7

---

## Phase 3: Validation

Validate the parsed and transformed data.

### Step 3.1: Validate Measure Contents

For each measure in every pattern, validate that chords fit the time signature.

#### Algorithm

1. Get time signature (section-level or global)
2. For each measure:
   - Get amount of beats by substracting the number of `=` from the time signature numerator
   - If number of beats is 0, measure is considered unexistent 
   - Count chord positions (chords, `%`, `_`, but not `=`)
   - Calculate beats per position: `amount_of_beats / position_count`
   - Validate beats per position is an integer number

#### Beat Division Validation

In 4/4 time (4 beats per measure):
- 1 position: 4 beats/position ✓
- 2 positions: 2 beats/position ✓
- 3 positions: 1.33 beats/position ✗ (invalid)
- 4 positions: 1 beat/position ✓
- 5 positions: 0.8 beats/position ✗ (invalid)

In 3/4 time (3 beats per measure):
- 1 position: 3 beats/position ✓
- 2 positions: 1.5 beats/position ✗ (invalid)
- 3 positions: 1 beat/position ✓
- 4 positions: 0.75 beats/position ✗ (invalid)

**Rule**: Beats per position must be an integer

#### Remover Validation

**Example** (4/4 time):
```songcode
A G % =    ← 4 positions
```

- Positions without removers: 3 (A, G, %)
- Each gets: 3 / 3 = 1 beats

**Example**:
- `A =` means 2 equal divisions of 2 beats
- `=` removes its beats
- The remaining chord gets: 2 beats

**Example**:
- `Em G` in 4/4 → 2 beats each
- `Em =` in 4/4 → 2 beats total (Em gets 2, = removes 2)

**Simplified rule**:
- All positions (including `=`) get equal beat division
- `=` removes its beats from the measure

So: `A G =` in 3/4:
- 3 positions: 1 beat each
- A: 1 beat, G: 1 beat, =: 1 beat removed
- Total: 2 beats

#### Error Conditions

- Invalid beat division → **ERROR**: "5 chords don't fit in 4/4 time"
- Remover not at end → **ERROR**: "Remover must be at end of measure"

### Step 3.2: Calculate Section Measure Counts

For each section, calculate total measures considering:
- Base pattern measures
- `_repeat` modifier
- `_cutStart` modifier
- `_cutEnd` modifier
- `_before` pattern
- `_after` pattern

#### Algorithm



```
// 1
section_measures = patterns[pattern.id].measures * pattern.repeat

// 2
if (pattern.cutStart):
    // 2.1
    section_measures -= pattern.cutStart[0]
    // 2.2
    if(<nb_of_beats_in_first_measure_after_cut_start> <= pattern.cutStart[1]) {
        section_measures -= 1
    }

// 3
if (pattern.cutEnd):
    // 3.1
    section_measures -= pattern.cutEnd[0]
    // 3.2
    if(<nb_of_beats_in_last_measure_after_cut_end> <= pattern.cutEnd[1]) {
        section_measures -= 1
    }

// 4
if (pattern.before):
    section_measures += calculate_measures(pattern.before.json)

// 5
if (pattern.after):
    section_measures += calculate_measures(pattern.after.json)

// 6
section.pattern.measures = section_measures
```

**Example** :

The "A" json pattern :

```json
{
    "A": {
        "sc": "[A;G =;G;A]2\n:\nA;G;%;E G D =;%",
        "json": [
            "loopStart",
            [["A", ""]],
            [["G", ""], "="],
            [["G", ""]],
            [["A", ""]],
            "loopEnd:2",
            "newLine",
            [["A", ""]],
            [["G", ""]],
            [["E", "G", "D", "="]],
            ["%"],
            ["%"]
        ],
        "measures": 13
    }
}
```

The section pattern modifiers

```json
{
    "name": "Verse",
    "comment": "Tricky pattern",
    "pattern": {
        "id": null,
        "repeat": 3,
        "bpm": null,
        "timeSignature": null,
        "cutStart": [1, 3],
        "cutEnd": [0, 2],
        "before": [["F#", "7"]],
        "after": [["G#", "7M"], ["%"]]
    }
}
```

Result :
1. Section measures: 13 x 3 = 39
2. 1. Remove nb of measures of cutStart: 39 - 1 = 38
2. 2. Nb of beats in cutStart is 3. The first measure of the pattern after the action of the cutStart is `[["G", ""], "="]`, that has 2 beats. 3 >= 2, so that measure has no beats left, it is considered unexisting, so remove it from section measures. Section measures = 38 - 1 = 37.
3. 1. Remove nb of measures of cutEnd: 37 - 0 = 37
3. 2. Nb of beats in cutEnd is 2. The last measure of the pattern after the action of the cutEnd is `["%"]` (repeat of `[["E", "G", "D", "="]]`), that has 3 beats. After cutting the beats, the measure has 1 beat left (the `["E"]`). That is a non-empty measure, that still counts as a measure, so we DO NOT remove 1 from the section measures.
4. Before pattern has 1 measure. 37 + 1 = 38
5. After pattern has 2 measures. 38 + 2 = 40
6. Section measures = 40

**Note** : The cutStart, cutEnd, before and after modifiers only applied to the edges of the pattern. The pattern, that is played 3 times, in the end has :
- The first occurence modified by cutStart and before
- The second occurence unchanged
- The third occurencemodified by cutEnd and after

**Note** : The edge modifiers only apply to the first and last occurences. If an edge modifier is set to remove more than the length of the edge occurence, the max it can remove is the length of the edge occurence. So part of that edge modifier would be useless.

**Example** :

The "A" json pattern :

```json
{
    "B": {
        "sc": "A;G",
        "json": [
            [["A", ""]],
            [["G", ""]]
        ],
        "measures": 2
    }
}
```

The section pattern modifiers

```json
{
    "name": "Verse",
    "comment": "Tricky pattern",
    "pattern": {
        "id": null,
        "repeat": 4,
        "bpm": null,
        "timeSignature": null,
        "cutStart": [3, 0],
        "cutEnd": null,
        "before": [["Em"]],
        "after": null
    }
}
```

The result : Em;A;G;A;G;A;G. Even though cutStart wanted to remove 3 measure, the pattern only has 2. So it removed just 2. Section measures = 7

### Step 3.3: Validate Lyric Timing

#### All-or-Nothing Rule

1. Count lyrics with measure counts
2. Count lyrics without measure counts
3. If both counts > 0 → **ERROR**: "All lyrics must have measure counts, or none"

#### Measure Count Validation

For each section:
1. Sum all lyric measure counts
2. Compare with section's total measures
3. If not equal → **ERROR**: "Lyric measures (15) don't match section measures (17)"

---

## Phase 4: Prompter Generation

Generate a linear, display-friendly representation of the song.

### Purpose

The prompter is designed for scrolling/teleprompter display. It expands all patterns, resolves all repeats, and pairs each lyric line with its chord progression.

### Step 4.1: Add Initial Tempo

```json
{
    "type": "tempo",
    "bpm": 120,
    "timeSignature": "4/4"
}
```

### Step 4.2: Process Each Section

For each section:

1. **Check for tempo changes**:
   - If section has `pattern.bpm` or `pattern.timeSignature`
   - Add tempo item to prompter

2. **Expand pattern**:
   - Start with `pattern.before` (if present)
   - Process main pattern :
        - Repeat pattern `pattern.repeat` times
        - Apply `_cutStart` and `_cutEnd`
            - if `_cutStart` has beats, it removes the FIRST BEATS of the measure
            - if `_cutEnd` has beats, it removes the LAST BEATS of the measure
            - if measures become empty after beat removal, remove them
        - Add it
   - Add `pattern.after` (if present)
   - Result: Complete measure stack for the section

3. **Pair with lyrics**:
   - For each lyric line:
     - Take the number of measures specified by lyric's measure count
     - Remove those measures from the measure stack
     - Create prompter item with lyric and measures

4. **Optimize chord patterns**:
   - For each prompter item, check if chord pattern can be simplified
   - If pattern can be split into N identical sub-patterns:
     - Keep one sub-pattern
     - Set `repeats: N`


### Determining Style

Based on lyric content:
- If lyric starts with `***` and ends with `***`: `style: "info"`
- If lyric starts with `:::` and ends with `:::`: `style: "musicianInfo"`
- Otherwise: `style: "default"`

### Example Prompter Item

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

---

## Error Handling

### Error Categories

1. **Syntax Errors**: Invalid SongCode syntax
2. **Validation Errors**: Valid syntax but invalid semantics
3. **Reference Errors**: Undefined references

### Error Response Format

When an error occurs, the parser should:
1. **Stop immediately** (fail-fast)
2. **Provide clear feedback**:
   - Error type
   - Location (line number if possible)
   - Expected vs actual
   - Suggestion for fix

### Example Error Messages

**Good**:
```
ERROR: Non-consecutive pattern definitions
Line 15: Found pattern definition $3 after section began
Fix: Move all pattern definitions before the first section
```

**Bad**:
```
ERROR: Invalid file
```

---

## Algorithm Details

### Measures-and-Beats Notation Parsing

Input formats:
- `"2"` → `[2, 0]`
- `"1-2"` → `[1, 2]`
- `"-3"` → `[0, 3]`

```
function parseMeasuresAndBeats(input):
    if input.contains('-'):
        parts = input.split('-')
        if parts[0] == '':
            return [0, parseInt(parts[1])]
        else:
            return [parseInt(parts[0]), parseInt(parts[1])]
    else:
        return [parseInt(input), 0]
```

### Time Signature Beats Calculation

```
function getBeatsPerMeasure(timeSignature):
    return timeSignature.numerator
```

Note: This is simplified. Full implementation should consider that in compound time signatures (like 6/8), the beat unit is different.

### Pattern Matching

```
function patternsMatch(pattern1, pattern2):
    // Remove whitespace variations
    normalized1 = normalizeWhitespace(pattern1)
    normalized2 = normalizeWhitespace(pattern2)
    
    return normalized1 == normalized2

function normalizeWhitespace(pattern):
    // remove white spaces before measure first chord
    // remove white spaces bofore measure last chord
    // keep only 1 space between chords
    return pattern
```

---

## Edge Cases

### 1. Empty Measure (All Removers)

```songcode
= = = =
```

**Handling**: Accept as valid (edge case)
**Result**: Measure is considered unexistent

### 2. Pattern with Only Loops

```songcode
$1
[A;G]4
```

**Handling**: Valid  
**Result**: 8 measures (A;G repeated 4 times)

### 3. Nested Loops

```songcode
[A;[B;C]2;D]3
```

**Handling**: Currently not supported  
**Result**: ERROR

### 4. Section with No Lyrics

```songcode
Intro
$1
```

**Handling**: Valid (empty lyrics array)

### 5. Pattern Variable Self-Reference

```songcode
$1
A;$1
```

**Handling**: ERROR (infinite recursion)  
**Detection**: Track resolution stack

### 6. Unicode in Lyrics

```songcode
--
Café au lait ☕ _2
```

**Handling**: Accept UTF-8 characters in lyrics

### 7. Very Long Songs

**Handling**: No limit

### 8. Floating Point Beat Divisions

In 4/4 with 3 chords: each gets 1.333... beats

**Handling**: ERROR : beats value must be integers 

---

## Summary

The parser transforms SongCode through four distinct phases:

1. **First Pass**: Parse file structure, extract metadata, patterns, and sections
2. **Pattern Transformation**: Convert SongCode pattern syntax to JSON
3. **Validation**: Ensure timing, measures, and references are correct
4. **Prompter Generation**: Create linear display representation

The process is fail-fast: any error stops immediately with clear feedback.

The output is a complete Livenotes JSON structure ready for use in the Livenotes application.
