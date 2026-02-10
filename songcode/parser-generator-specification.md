# SongCode Parser/Generator Specification

**Version 1.0**

## Table of Contents

1. [Overview](#overview)
2. [Input and Output](#input-and-output)
3. [File Format Specifications](#file-format-specifications)
4. [Phase 1: First Pass Parsing](#phase-1-first-pass-parsing)
5. [Phase 2: Pattern Transformation](#phase-2-pattern-transformation)
6. [Phase 3: Validation](#phase-3-validation)
7. [Phase 4: Prompter Generation](#phase-4-prompter-generation)
8. [Error Handling](#error-handling)
9. [Algorithm Details](#algorithm-details)
10. [Edge Cases](#edge-cases)

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

## File Format Specifications

### Character Encoding

**Encoding**: UTF-8  
**Validation**: Strict

The parser must:
- Accept only valid UTF-8 encoded files
- Reject files with invalid UTF-8 sequences
- Reject files with null bytes (`\0`)
- Return **E0.2** error for encoding issues

**Invalid UTF-8 includes**:
- Incomplete multibyte sequences
- Invalid byte patterns
- Null bytes

### Line Ending Normalization

**Supported formats**: 
- LF (`\n`) - Unix/Linux/macOS
- CRLF (`\r\n`) - Windows

**Processing**:
1. Normalize all line endings to LF internally
2. Accept mixed line endings in same file
3. Process during initial file read (before Phase 1)

**Algorithm**:
```
content = read_file()
content = content.replace("\r\n", "\n")  // Normalize CRLF to LF
content = content.replace("\r", "\n")    // Normalize standalone CR to LF
```

### Escape Sequences

**SongCode does not support escape sequences.**

All characters are treated literally:
- `\n` in file content → literal backslash + 'n' (not newline)
- `\t` in file content → literal backslash + 't' (not tab)
- `\\` in file content → literal backslash + backslash

**Special text in lyrics**:
- `***text***` → info style (no escaping needed)
- `:::text:::` → musicianInfo style (no escaping needed)
- To use literal `***` in lyrics without styling, don't close the marker

**Example**:
```
--
This has ***bold*** style     → style: "info" (because starts and ends with ***)
This has ***incomplete         → style: "default" (no end marker)
```

### Maximum Limits

#### Pattern Limits

**Maximum pattern count**: 26 (A-Z)
- Pattern IDs are assigned alphabetically
- First unique pattern → "A"
- 26th unique pattern → "Z"
- If 27th pattern needed → **ERROR** (exceeds limit)

**Maximum pattern reference depth**: 1 level
- Pattern can reference another pattern: `$1` in `$2` ✓
- Pattern cannot reference pattern that references another: `$1` in `$2` in `$3` ✗

**Pattern definition order**: 
- Patterns must be defined before use
- Forward references not allowed
- Pattern `$2` can use `$1` only if `$1` defined first

**Loop repeat count**: No maximum
- `[A;G]2` ✓ (minimum)
- `[A;G]100` ✓ (allowed)
- `[A;G]10000` ✓ (allowed, but may be slow)

**Nested loops**: Not supported (returns **E2.1.3** error)

#### Section Limits

**Maximum sections**: No limit
- Song can have any number of sections

**Maximum measures per pattern**: No limit

**Maximum total measures**: No limit

#### String Length Limits

| Field | Maximum Length |
|-------|----------------|
| Metadata: `@name` | 200 characters |
| Metadata: `@bpm` | N/A (numeric 0-400) |
| Metadata: `@time` | N/A (format `n/4`) |
| Metadata: `@original` | 50 characters |
| Metadata: `@end` | 50 characters |
| Metadata: `@warning` | 50 characters |
| Section name | 50 characters |
| Section comment | No limit |
| Lyric line | No limit |
| Pattern description | No limit |

### Section-Level Metadata

**Allowed keys**: Only `@bpm` and `@time`

**Validation**:
- `@bpm`: Same as global (integer 0-400)
- `@time`: Same as global (denominator must be 4)

**Not allowed at section level**:
- `@name` (song-level only)
- `@original` (song-level only)
- `@end` (song-level only)
- `@warning` (song-level only)

Using non-allowed keys at section level → **E1.3.6** error

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
| `original` | base chord | valid base chord | null |
| `capo` | integer | 1-20 | null |
| `bpm` | integer | 0-400 | null |
| `time` | time sig | `n/4` (V1: denominator must be 4) | 4/4 |
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

**V1 Restriction**: Only denominator `4` is allowed. The denominator represents quarter notes (full beats).

Examples:
- `4/4` ✓ Valid
- `3/4` ✓ Valid
- `6/4` ✓ Valid
- `3/8` ✗ Invalid (denominator must be 4)
- `6/8` ✗ Invalid (denominator must be 4)

#### Error Conditions

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Non-consecutive metadata lines → **E1.1.1** (SYNTAX ERROR)
- Invalid key → **E1.1.2** (SYNTAX ERROR)
- Invalid value for @bpm → **E1.1.3** (VALIDATION ERROR)
- Invalid denominator → **E1.1.4** (VALIDATION ERROR)
- Invalid time signature format → **E1.1.5** (SYNTAX ERROR)

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

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Non-consecutive pattern blocks → **E1.2.1** (SYNTAX ERROR)
- Undefined pattern reference → **E1.2.3** (REFERENCE ERROR)
- Circular reference → **E1.2.4** (REFERENCE ERROR)
- Pattern redefinition → **E1.2.2** (SYNTAX ERROR)

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
        "time": null,
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

**Empty Patterns**:

Empty patterns are valid and useful during the writing process:

```songcode
$1


Verse
$1
--
First line
Second line
```

**Purpose**: Allows writers to create the song skeleton/structure first and progressively add patterns and timing.

**Representation**:
- `section.pattern.sc`: `""` (empty string)
- Later in Phase 2: `json: null`, `measures: 0`

**Important**: For sections with only lyrics and no chords, prefer using silence symbols (`_`) instead of empty patterns to maintain proper timing:
```songcode
Verse (correct approach)
_; _; _; _
--
First line _2
Second line _2
```

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
- **Format**: `_before pattern` or `_after pattern` (single line only)
- Parse pattern description from the same line (everything after the modifier keyword)
- Store in `section.pattern.before.sc` or `section.pattern.after.sc`
- Create object: `{ sc: "pattern_description", json: null, measures: null }`
- The `json` and `measures` properties will be populated in Phase 2

**Syntax Support in `_before`/`_after` patterns**:
- ✅ Chords: `Am`, `D7`, `Ebm9`
- ✅ Symbols: `;` (measure separator), `%` (repeat), `_` (silence), `=` (remover)
- ✅ Loops: `[A;G]3`
- ✅ Multiple chords per measure: `Am D G`
- ❌ Line breaks: `:` is NOT allowed
- ❌ Pattern variables: `$1`, `$2`, etc. are NOT allowed

**Examples**:
```songcode
# Valid
_before Am;D;E
_before [A;G]2
_before Am D %;E =

# Invalid
_before $1              ← Error: Pattern variables not allowed
_before A;G:D;E        ← Error: Line breaks not allowed in _before/_after
```

**Error Conditions**:

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Pattern variable in `_before`/`_after` → **E1.3.4** (SYNTAX ERROR)
- Line break in `_before`/`_after` → **E1.3.5** (SYNTAX ERROR)

#### Section-Level Metadata

Lines starting with `@` in the pattern area override global metadata for that section:
- `@bpm 140` → `section.pattern.bpm = 140`
- `@time 3/4` → `section.pattern.time = {numerator: 3, denominator: 4}`

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
- After whitespace normalization (see below)
- `Am D;Am` and `Am D ; Am   ` are considered equal
- `[A ; G]3` and `[ A ; G ] 3` are considered equal

**Normalization Process**:

The normalized version is stored in `livenotes.patterns[id].sc`. Normalization occurs during pattern parsing.

**Algorithm**:

1. **Character normalization**:
   - Convert all tabs to spaces
   - Convert all newlines (`\n`) to `;` (measure separator)
   - Convert all carriage returns (`\r`) to `;` (measure separator)

2. **Split by semicolon** to get individual measures

3. **For each measure**:
   - Trim leading and trailing whitespace
   - Collapse multiple consecutive spaces into single space

4. **Rejoin measures** with `;`

5. **Remove spaces around special characters**:
   - Remove space after `[`
   - Remove space before `]`
   - Remove space before and after `;`
   - Remove space between `]` and following digit

6. **Final trim** of entire pattern

**Examples**:

```
Input:  "  Am   D  "
Output: "Am D"

Input:  "Am D  ;  G   E "
Output: "Am D;G E"

Input:  " [  A ; G ] 3  "
Output: "[A;G]3"

Input:  "A  %  ;  _   = "
Output: "A %;_ ="

Input:  "A\tD\nG   E"       (with tab and newline)
Output: "A D;G E"
```

#### Error Conditions

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Missing `--` separator before lyrics → **E1.3.1** (SYNTAX ERROR) - only if lyrics present
- Invalid modifier value → **E1.3.2** (VALIDATION ERROR)
- Invalid measures-and-beats notation → **E1.3.3** (SYNTAX ERROR)
- Invalid section-level metadata → **E1.3.6** (VALIDATION ERROR)

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

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Invalid chord notation → **E2.1.1** (SYNTAX ERROR)
- Remover not at end → **E2.1.2** (SYNTAX ERROR)
- Mismatched loop brackets → **E2.1.3** (SYNTAX ERROR)
- Loop without repeat count → **E2.1.4** (SYNTAX ERROR)

#### Empty Pattern Handling

If `patterns[id].sc` is an empty string:

**Processing**:
- Skip transformation algorithm
- Set `patterns[id].json = null`
- Set `patterns[id].measures = 0`

**Valid use case**: Song skeleton during writing process

**Example**:
```json
{
    "A": {
        "sc": "",
        "json": null,
        "measures": 0
    }
}
```

**Note**: Empty patterns are placeholders. For lyrics-only sections with timing, use silence symbols (`_`) instead.

### Step 2.2: Transform Modifier Patterns

Apply the same transformation algorithm (from Step 2.1) to pattern descriptions in modifiers.

#### Algorithm

For each section:
1. If `section.pattern.before` exists and `before.sc` is not empty:
   - Transform `section.pattern.before.sc` → `section.pattern.before.json`
   - Use the same transformation algorithm as Step 2.1
   - Calculate measures: `section.pattern.before.measures = calculate_measures(before.json)`

2. If `section.pattern.after` exists and `after.sc` is not empty:
   - Transform `section.pattern.after.sc` → `section.pattern.after.json`
   - Use the same transformation algorithm as Step 2.1
   - Calculate measures: `section.pattern.after.measures = calculate_measures(after.json)`

#### Example

**Input** (`section.pattern.before.sc`):
```songcode
[Am;D]2;E
```

**Output** (`section.pattern.before.json`):
```json
[
    "loopStart",
    [["Am", ""]],
    [["D", ""]],
    "loopEnd:2",
    [["E", ""]]
]
```

**Measures**: 5 (2 × 2 from loop + 1 after loop)

#### Error Conditions

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Invalid chord in `_before`/`_after` → **E2.2.1/E2.2.2** (SYNTAX ERROR)
- Mismatched loop brackets → **E2.2.3/E2.2.4** (SYNTAX ERROR)

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

For each measure in every pattern (including `_before` and `_after` patterns), validate that chords fit the time signature.

#### Time Signature Resolution

1. **For main patterns** (in `livenotes.patterns`):
   - Use global time signature from `meta.time` (default: 4/4)

2. **For section patterns and modifiers**:
   - Get effective time signature:
     - If `section.pattern.time` is set → use section time signature
     - Otherwise → use global time signature from `meta.time`
   - Apply to:
     - Main pattern validation
     - `_before` pattern validation (if present)
     - `_after` pattern validation (if present)

**Important**: `_before` and `_after` patterns inherit the section's effective time signature. They cannot have different time signatures.

#### Validation Algorithm

1. Get effective time signature (section-level or global)
2. For each measure in pattern JSON:
   - Count chord positions (chords, `%`, `_`, including `=`)
   - Calculate beats per position: `time_signature_numerator / position_count`
   - **Validate beats per position is an integer** (this check happens BEFORE `=` processing)
   - If not an integer → **ERROR**: "Invalid number of positions in measure: beats per position must be a whole number"
   - Calculate actual beats in measure: `time_signature_numerator - (count_of_"=" × beats_per_position)`
   - If number of beats is 0 or negative, measure is considered nonexistent

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

#### Remover (`=`) Symbol Behavior

**Formula for beats in a measure**:
```
beats_per_position = time_signature_numerator / position_count
measure_beats = time_signature_numerator - (count_of_"=" × beats_per_position)
```

Each `=` symbol removes exactly `beats_per_position` beats from the measure.

**Examples in 4/4 time**:

1. `A G % =` (4 positions)
   - Beats per position: 4 ÷ 4 = 1 beat
   - One `=` removes 1 beat
   - Result: 3 beats (A:1, G:1, %:1)

2. `A =` (2 positions)
   - Beats per position: 4 ÷ 2 = 2 beats
   - One `=` removes 2 beats
   - Result: 2 beats (A gets 2 beats)

3. `Em G` (2 positions, no `=`)
   - Beats per position: 4 ÷ 2 = 2 beats
   - Result: 4 beats (Em:2, G:2)

4. `A B = =` (4 positions)
   - Beats per position: 4 ÷ 4 = 1 beat
   - Two `=` symbols remove 2 beats
   - Result: 2 beats (A:1, B:1)

**Examples in 3/4 time**:

1. `A G =` (3 positions)
   - Beats per position: 3 ÷ 3 = 1 beat
   - One `=` removes 1 beat
   - Result: 2 beats (A:1, G:1)

#### Error Conditions

See [Error Catalog](#comprehensive-error-catalog) for complete error messages.

- Invalid beat division → **E3.1.1** (VALIDATION ERROR)
- Invalid beat division in `_before` → **E3.1.2** (VALIDATION ERROR)
- Invalid beat division in `_after` → **E3.1.3** (VALIDATION ERROR)
- Remover not at end → **E2.1.2** (SYNTAX ERROR)

#### Example: Section with Time Signature Override

```songcode
@time 4/4       ← Global

Verse
@time 3/4       ← Section override
$1
_before A D     ← ERROR: 2 chords in 3/4 = 1.5 beats each (invalid)
```

**Correct version**:
```songcode
@time 4/4       

Verse
@time 3/4
$1
_before A D E   ← Valid: 3 chords in 3/4 = 1 beat each
```

### Step 3.2: Calculate Section Measure Counts

For each section, calculate total measures considering:
- Base pattern measures
- `_repeat` modifier
- `_cutStart` modifier
- `_cutEnd` modifier
- `_before` pattern
- `_after` pattern

#### Order of Operations

The effective pattern for a section is constructed as:

```
[_before pattern] + [main pattern with cuts applied] + [_after pattern]
```

**Important**: `_cutStart` and `_cutEnd` only affect the main pattern, not `_before` or `_after`.

#### Algorithm

```javascript
// 0. Check if pattern is empty (json = null)
if (patterns[pattern.id].json === null):
    // Empty pattern: all modifiers are bypassed
    section_measures = 0
    // Skip to step 6

// 1. Start with base pattern measures (considering repeat)
section_measures = patterns[pattern.id].measures * pattern.repeat

// 2. Apply cutStart to main pattern (measure-by-measure removal)
if (pattern.cutStart):
    // 2.1 Remove full measures
    section_measures -= pattern.cutStart[0]
    
    // 2.2 Remove additional beats from next measure
    beats_to_cut = pattern.cutStart[1]
    if (beats_to_cut > 0):
        // Get beats in the first remaining measure (AFTER "=" processing)
        first_measure_beats = calculate_measure_beats(first_remaining_measure)
        
        if (beats_to_cut >= first_measure_beats):
            // Remove entire measure (excess beats are "lost")
            section_measures -= 1
        // else: measure stays with reduced beats (partial cut)

// 3. Apply cutEnd to main pattern (works same as cutStart but from end)
if (pattern.cutEnd):
    // 3.1 Remove full measures from end
    section_measures -= pattern.cutEnd[0]
    
    // 3.2 Remove additional beats from previous measure
    beats_to_cut = pattern.cutEnd[1]
    if (beats_to_cut > 0):
        // Get beats in the last remaining measure (AFTER "=" processing)
        last_measure_beats = calculate_measure_beats(last_remaining_measure)
        
        if (beats_to_cut >= last_measure_beats):
            // Remove entire measure (excess beats are "lost")
            section_measures -= 1
        // else: measure stays with reduced beats (partial cut)

// 4. Add _before pattern measures (not affected by cuts)
if (pattern.before):
    section_measures += calculate_measures(pattern.before.json)

// 5. Add _after pattern measures (not affected by cuts)
if (pattern.after):
    section_measures += calculate_measures(pattern.after.json)

// 6. Store final count
section.pattern.measures = section_measures
```

**Key Concept: "Lost Beats"**

When cutting beats from a measure:
- If `beats_to_cut >= measure_beats`: Remove entire measure
- Excess beats are "lost" and don't carry to the next/previous measure
- No beat carry-over between measures

**Note**: `calculate_measures(json)` uses the same algorithm as Step 2.3 (handles loops correctly).

**Note**: `calculate_measure_beats(measure)` calculates beats AFTER processing `=` symbols using the formula:
```
beats_per_position = time_signature_numerator / position_count
measure_beats = time_signature_numerator - (count_of_"=" × beats_per_position)
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
        "time": null,
        "cutStart": [1, 3],
        "cutEnd": [0, 2],
        "before": [["F#", "7"]],
        "after": [["G#", "7M"], ["%"]]
    }
}
```

Result :
1. Section measures: 13 × 3 = 39
2. Apply cutStart [1, 3]:
   - 2.1: Remove 1 full measure: 39 - 1 = 38
   - 2.2: Cut 3 additional beats
     - First remaining measure is `[["G", ""], "="]`
     - Beats per position: 4 ÷ 2 = 2
     - Measure beats: 4 - (1 × 2) = 2 beats
     - Since 3 beats to cut >= 2 measure beats → Remove entire measure
     - Section measures: 38 - 1 = 37
     - Note: 1 beat is "lost" (excess doesn't carry forward)
3. Apply cutEnd [0, 2]:
   - 3.1: Remove 0 full measures: 37 - 0 = 37
   - 3.2: Cut 2 additional beats from end
     - Last remaining measure is `["%"]` (repeat of `[["E", "G", "D", "="]]`)
     - Beats per position: 4 ÷ 4 = 1
     - Measure beats: 4 - (1 × 1) = 3 beats
     - Since 2 beats to cut < 3 measure beats → Measure stays (partial cut)
     - Measure has 1 beat remaining (just the "E" chord)
     - Section measures: 37 (no change)
4. Add before pattern: 1 measure → 37 + 1 = 38
5. Add after pattern: 2 measures → 38 + 2 = 40
6. Final section measures = 40

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
        "time": null,
        "cutStart": [3, 0],
        "cutEnd": null,
        "before": [["Em"]],
        "after": null
    }
}
```

The result : Em;A;G;A;G;A;G. 

**Calculation**:
1. Base pattern: 2 measures × 4 repeats = 8 measures
2. Apply cutStart [3, 0]:
   - Remove 3 full measures: 8 - 3 = 5 measures
   - No additional beats to cut
3. Add before pattern: 1 measure → 5 + 1 = 6 measures
4. No after pattern
5. Final section measures = 6 measures (Em, A, G, A, G, A, G = 7 chords but only 6 measures due to spacing)

**Note**: Even though cutStart wanted to remove 3 measures, and the single pattern instance only has 2 measures, the pattern is repeated 4 times (8 total measures), so cutStart can remove 3 complete measures. The "lost beats" concept only applies to partial beat cuts within a single measure, not to full measure removals.

### Step 3.3: Validate Lyric Timing

#### All-or-Nothing Rule

1. Count lyrics with measure counts
2. Count lyrics without measure counts
3. If both counts > 0 → **E3.3.1** (VALIDATION ERROR)

See [Error Catalog](#comprehensive-error-catalog) for complete error message.

#### Measure Count Validation

For each section:
1. Sum all lyric measure counts
2. Compare with section's total measures
3. If not equal → **E3.3.2** (VALIDATION ERROR)

See [Error Catalog](#comprehensive-error-catalog) for complete error message.

#### Empty Pattern Exception

**If section has an empty pattern** (`json = null`, `measures = 0`):
- Lyric measure counts are not validated
- Lyrics can exist without measure counts (or with any measure count values)
- This is valid during the writing process (song skeleton)

**Example** (valid during composition):
```songcode
$1


Verse
$1
--
First line
Second line
Third line
```

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
    "time": "4/4"
}
```

### Step 4.2: Process Each Section

For each section:

**Note**: If section has an empty pattern (`json = null`), skip this section entirely in prompter generation. Empty patterns don't produce prompter items.

#### Substep 4.2.1: Check for Tempo Changes

- If section has `pattern.bpm` or `pattern.time` override
- Add tempo item to prompter:
  ```json
  {
      "type": "tempo",
      "bpm": <value>,
      "time": "<numerator>/<denominator>"
  }
  ```

#### Substep 4.2.2: Expand Pattern to Measure Stack

Build an ordered array of measures (the "measure stack") by:

1. **Add `_before` measures** (if present):
   - Expand loops in `pattern.before.json`
   - Add all measures to stack

2. **Add main pattern measures**:
   - Start with `patterns[pattern.id].json`
   - Expand all loops (see Substep 4.2.3)
   - Repeat entire pattern `pattern.repeat` times
   - Apply `_cutStart` (see Substep 4.2.4)
   - Apply `_cutEnd` (see Substep 4.2.4)
   - Add remaining measures to stack

3. **Add `_after` measures** (if present):
   - Expand loops in `pattern.after.json`
   - Add all measures to stack

**Result**: Ordered array of measures `[M1, M2, M3, ...]` ready for consumption

#### Substep 4.2.3: Loop Expansion Algorithm

To expand loops in a pattern:

```
for each element in pattern:
    if element == "loopStart":
        marker_index = current_index
        continue
    
    if element starts with "loopEnd:":
        repeat_count = extract_number(element)  // e.g., "loopEnd:3" → 3
        loop_content = elements between marker_index and current_index
        
        // Repeat loop content N times
        for i = 1 to repeat_count:
            add loop_content to output
        
        // Remove loop markers
        continue
    
    if element is measure:
        add to output (will be processed in loop expansion)
```

**Example**:
```json
// Input
["loopStart", [["A",""]], [["D",""]], "loopEnd:3"]

// Output (markers removed, content repeated 3 times)
[[["A",""]], [["D",""]], [["A",""]], [["D",""]], [["A",""]], [["D",""]]]
```

#### Substep 4.2.4: Beat Removal with cutStart/cutEnd

Both `_cutStart` and `_cutEnd` use `[measures, beats]` notation and follow the same algorithm as Phase 3 validation:

**For cutStart** (remove from beginning):
```
measures_to_remove = cutStart[0]
beats_to_remove = cutStart[1]

// Step 1: Remove complete measures
remove first measures_to_remove measures from pattern

// Step 2: Remove beats from next measure
if beats_to_remove > 0:
    next_measure = first remaining measure
    measure_beats = count_beats(next_measure)  // After "=" processing
    
    if beats_to_remove >= measure_beats:
        // Remove entire measure (beat loss occurs)
        remove next_measure
    else:
        // Keep measure (implementation-specific how to mark partial removal)
        // Note: In prompter context, typically remove entire measure
        remove beats_to_remove beats from beginning of next_measure
```

**For cutEnd** (remove from end):
- Same algorithm but process from the end of the pattern
- Remove last N measures
- Remove beats from the end of the last remaining measure

**Key principle**: Beats to remove can only affect one measure. Excess beats are lost (no carry-over).

**Example with cutStart [1, 2]**:
```
Pattern: [A(4 beats), B(2 beats), C(4 beats), D(4 beats)] in 4/4 time
Step 1: Remove 1 complete measure → [B, C, D]
Step 2: Remove 2 beats from B (beginning) → B has 0 beats left
Step 3: Remove B entirely (beat loss)
Result: [C, D]
```

#### Substep 4.2.5: Pair Lyrics with Measures

**Note**: Lyric measure counts are optional. This substep only applies when lyrics have measure counts specified.

For each lyric line with measure count:

1. Take N measures from the beginning of the measure stack (where N = lyric's measure count)
2. Remove those measures from the stack
3. Create prompter content item:
   ```json
   {
       "type": "content",
       "style": <determine from lyric text>,
       "lyrics": <lyric text>,
       "chords": [
           {
               "repeats": 1,
               "pattern": <the N measures>
           }
       ]
   }
   ```
4. Apply pattern optimization (see Substep 4.2.6)
5. Add to prompter array

**Sections with no lyrics**: If a section has no lyric lines, or lyrics without measure counts, the measures from the measure stack are not consumed. This is valid.

**Validation**: If all lyrics have measure counts, the sum must equal the section's total measures (validated in Phase 3).

#### Substep 4.2.6: Pattern Optimization Algorithm

For each prompter content item, optimize the chord pattern by detecting repetitions:

```
start with: repeats = 1, pattern = [full measure array]

while pattern.length is even AND pattern.length > 1:
    first_half = pattern[0 ... pattern.length/2]
    second_half = pattern[pattern.length/2 ... end]
    
    if first_half equals second_half:
        // Optimization possible
        pattern = first_half
        repeats = repeats * 2
    else:
        // No more optimization possible
        break

result: {repeats: repeats, pattern: pattern}
```

**Example**:
```json
// Initial pattern (8 measures)
[["A",""], ["B",""], ["C",""], ["D",""], ["A",""], ["B",""], ["C",""], ["D",""]]

// Iteration 1: Divide [A,B,C,D] == [A,B,C,D] ✓
// Result: repeats=2, pattern=[["A",""], ["B",""], ["C",""], ["D",""]]

// Iteration 2: Divide [A,B] != [C,D] ✗
// Stop optimization

// Final result:
{
    "repeats": 2,
    "pattern": [["A",""], ["B",""], ["C",""], ["D",""]]
}
```


### Step 4.3: Determine Lyric Style

Based on lyric content:

- If lyric **starts with** `***` **AND ends with** `***`: `style: "info"`
- If lyric **starts with** `:::` **AND ends with** `:::`: `style: "musicianInfo"`
- Otherwise: `style: "default"`

**Examples**:
```
"***Guitar Solo***"     → style: "info"
":::Watch drummer:::"   → style: "musicianInfo"
"Living easy"           → style: "default"
"***Incomplete"         → style: "default" (no ending marker)
"Complete***"           → style: "default" (no starting marker)
```

**Note**: Section names do NOT automatically appear in the prompter. If you want a section name to be visible in the prompter, add it as a lyric line (often as `***Section Name***`).

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

### Error Message Format

All error messages follow this standardized format:

```
[ERROR TYPE]: [Error description]
Line [N]: [Specific context]
Expected: [What should have been]
Fix: [Suggestion for correction]
```

**Components**:
- **Error Type**: One of `SYNTAX ERROR`, `VALIDATION ERROR`, `REFERENCE ERROR`
- **Line Number**: Location in the SongCode file where error occurred
- **Error Description**: Clear explanation of what went wrong
- **Expected** (optional): What the parser expected to find
- **Fix**: Actionable suggestion for resolving the error

### Error Categories

1. **SYNTAX ERROR**: Invalid SongCode syntax (Phase 1, 2)
2. **VALIDATION ERROR**: Valid syntax but invalid semantics (Phase 3)
3. **REFERENCE ERROR**: Undefined or circular references (Phase 1)

### Example Error Messages

**Good**:
```
SYNTAX ERROR: Non-consecutive pattern definitions
Line 15: Found pattern definition $3 after section began
Expected: All pattern definitions before first section
Fix: Move pattern $3 to the pattern definitions block at the beginning
```

**Bad**:
```
ERROR: Invalid file
```

---

## Comprehensive Error Catalog

### Phase 1: First Pass Parsing

#### 1.1 Metadata Errors (SYNTAX ERROR)

**E1.1.1 - Non-consecutive metadata**
```
SYNTAX ERROR: Metadata must be consecutive at the beginning of the file
Line [N]: Found metadata '@[key]' after content began
Expected: All metadata at file start without gaps
Fix: Move all @key lines to the beginning of the file
```

**E1.1.2 - Unknown metadata key**
```
SYNTAX ERROR: Unknown metadata key
Line [N]: '@[key]' is not a valid metadata key
Expected: Valid keys are @name, @bpm, @time, @original, @end, @warning
Fix: Use a valid metadata key or remove this line
```

**E1.1.3 - Invalid BPM value**
```
VALIDATION ERROR: Invalid value for @bpm
Line [N]: '@bpm [value]' is outside valid range
Expected: Integer value between 0 and 400
Fix: Use a BPM value between 0 and 400
```

**E1.1.4 - Invalid time signature denominator**
```
VALIDATION ERROR: Invalid time signature denominator
Line [N]: '@time [num]/[denom]' has invalid denominator
Expected: Denominator must be 4 (V1 restriction)
Fix: Use format like 3/4 or 4/4 (denominator must be 4)
```

**E1.1.5 - Invalid time signature format**
```
SYNTAX ERROR: Invalid time signature format
Line [N]: '@time [value]' is not in correct format
Expected: Format 'n/4' where n is a positive integer
Fix: Use format like '3/4' or '6/4'
```

#### 1.2 Pattern Definition Errors

**E1.2.1 - Non-consecutive pattern blocks** (SYNTAX ERROR)
```
SYNTAX ERROR: Pattern definitions must be consecutive
Line [N]: Found pattern definition $[n] after section began
Expected: All pattern definitions before first section
Fix: Move all $n pattern blocks together before sections
```

**E1.2.2 - Pattern redefinition** (SYNTAX ERROR)
```
SYNTAX ERROR: Pattern already defined
Line [N]: Pattern $[n] is already defined
Expected: Each pattern number used only once
Fix: Use a different pattern number or remove duplicate definition
```

**E1.2.3 - Undefined pattern reference** (REFERENCE ERROR)
```
REFERENCE ERROR: Undefined pattern
Line [N]: Pattern $[n] is not defined
Expected: Pattern must be defined before use
Fix: Define pattern $[n] in the pattern definitions section
```

**E1.2.4 - Circular reference** (REFERENCE ERROR)
```
REFERENCE ERROR: Circular reference detected
Line [N]: Pattern references form a cycle: $[a] → $[b] → $[a]
Expected: Pattern references must not be circular
Fix: Remove circular dependency in pattern definitions
```

**E1.2.5 - Pattern reference depth exceeded** (REFERENCE ERROR)
```
REFERENCE ERROR: Pattern reference depth exceeds maximum
Line [N]: Pattern $[n] requires depth > 1 to resolve
Expected: Maximum reference depth is 1 (direct substitution only)
Fix: Pattern can only reference patterns that don't themselves contain references
Example: $3 can contain $1, but $3 cannot contain $2 if $2 contains $1
```

#### 1.3 Section Parsing Errors

**E1.3.1 - Missing lyrics separator** (SYNTAX ERROR)
```
SYNTAX ERROR: Section must have '--' separator before lyrics
Line [N]: Lyrics found without '--' separator
Expected: '--' on its own line before lyrics
Fix: Add '--' line before lyrics
```

**E1.3.2 - Invalid _repeat value** (VALIDATION ERROR)
```
VALIDATION ERROR: Invalid value for _repeat
Line [N]: '_repeat [value]' is invalid
Expected: Integer value ≥ 2
Fix: Use _repeat 2 or higher (or remove modifier if only 1 repetition)
```

**E1.3.3 - Invalid measures-and-beats notation** (SYNTAX ERROR)
```
SYNTAX ERROR: Invalid cutStart/cutEnd value
Line [N]: '_[modifier] [value]' format is invalid
Expected: Format 'n' or 'n-m' where n and m are integers
Fix: Use format like '2', '1-3', or '-2'
```

**E1.3.4 - Pattern variable in _before/_after** (SYNTAX ERROR)
```
SYNTAX ERROR: Pattern variables not allowed in _before/_after modifiers
Line [N]: Found pattern variable $[n] in _[modifier]
Expected: Inline pattern description only
Fix: Replace $[n] with actual chords (e.g., '_before A;D' instead of '_before $1')
```

**E1.3.5 - Line break in _before/_after** (SYNTAX ERROR)
```
SYNTAX ERROR: Line breaks not allowed in _before/_after modifiers
Line [N]: Found ':' (line break) in _[modifier] pattern
Expected: Single-line pattern only
Fix: Use semicolons (;) instead of line breaks (:) in _before/_after
```

**E1.3.6 - Invalid section-level metadata** (VALIDATION ERROR)
```
VALIDATION ERROR: Invalid section-level metadata
Line [N]: Section '@[key] [value]' is invalid
Expected: Valid values (same rules as global metadata)
Fix: [Same fixes as corresponding global metadata error]
```

---

### Phase 2: Pattern Transformation

#### 2.1 Pattern Syntax Errors (SYNTAX ERROR)

**E2.1.1 - Invalid chord notation**
```
SYNTAX ERROR: Invalid chord
Line [N]: '[chord]' is not a valid chord
Expected: Valid base chord (A-G with optional # or b, and optional 'm') followed by extension
Fix: Use valid chord like Am, C#7, or Bbm9
```

**E2.1.2 - Remover not at end**
```
SYNTAX ERROR: Remover (=) must be at end of measure
Line [N]: '=' symbol found before last position in measure
Expected: '=' symbols only at end of measure
Fix: Move '=' to the end: 'A D E =' instead of 'A = D E'
```

**E2.1.3 - Mismatched loop brackets**
```
SYNTAX ERROR: Loop not properly closed
Line [N]: Loop started with '[' but missing ']n'
Expected: Every '[' must have matching ']n'
Fix: Close loop with ']n' where n is repeat count
```

**E2.1.4 - Loop without repeat count**
```
SYNTAX ERROR: Loop missing repeat count
Line [N]: Found ']' without repeat number
Expected: Format ']n' where n ≥ 2
Fix: Add repeat count like ']3' (minimum 2)
```

#### 2.2 Modifier Pattern Errors (SYNTAX ERROR)

**E2.2.1 - Invalid chord in _before**
```
SYNTAX ERROR: Invalid chord in _before pattern
Line [N]: '[chord]' in _before is not valid
Expected: Valid chord notation
Fix: Use valid chord like Am, G7, or D
```

**E2.2.2 - Invalid chord in _after**
```
SYNTAX ERROR: Invalid chord in _after pattern
Line [N]: '[chord]' in _after is not valid
Expected: Valid chord notation
Fix: Use valid chord like Am, G7, or D
```

**E2.2.3 - Mismatched loop in _before**
```
SYNTAX ERROR: Loop not properly closed in _before pattern
Line [N]: _before pattern has unclosed loop
Expected: Every '[' must have matching ']n'
Fix: Close loop in _before pattern
```

**E2.2.4 - Mismatched loop in _after**
```
SYNTAX ERROR: Loop not properly closed in _after pattern
Line [N]: _after pattern has unclosed loop
Expected: Every '[' must have matching ']n'
Fix: Close loop in _after pattern
```

---

### Phase 3: Validation

#### 3.1 Measure Content Validation (VALIDATION ERROR)

**E3.1.1 - Invalid beat division**
```
VALIDATION ERROR: Invalid number of positions in measure
Line [N]: [count] chords don't fit in [num]/[denom] time
Expected: Beats per position must be a whole number
Fix: Use [suggestions] chords for [num]/[denom] time (e.g., 1, 2, or 4 chords for 4/4)
```

**E3.1.2 - Invalid beat division in _before**
```
VALIDATION ERROR: Invalid measure in _before pattern
Line [N]: [count] chords don't fit in [num]/[denom] time in _before pattern
Expected: Beats per position must be a whole number
Fix: Adjust _before pattern to use valid chord count for time signature
```

**E3.1.3 - Invalid beat division in _after**
```
VALIDATION ERROR: Invalid measure in _after pattern
Line [N]: [count] chords don't fit in [num]/[denom] time in _after pattern
Expected: Beats per position must be a whole number
Fix: Adjust _after pattern to use valid chord count for time signature
```

#### 3.3 Lyrics Timing Validation (VALIDATION ERROR)

**E3.3.1 - Mixed lyric measure counts**
```
VALIDATION ERROR: All lyrics must have measure counts, or none
Line [N]: Section has mix of lyrics with and without measure counts
Expected: Either all lyrics have _n counts, or none do
Fix: Add measure counts to all lyrics, or remove all measure counts
```

**E3.3.2 - Lyric measures don't match**
```
VALIDATION ERROR: Lyric measures don't match section measures
Line [N]: Lyrics total [sum] measures but section has [total] measures
Expected: Sum of lyric measures must equal section total
Fix: Adjust lyric measure counts or pattern to match (difference: [diff])
```

---

### Additional Errors

#### Empty or Invalid Content (SYNTAX ERROR)

**E0.1 - Empty file**
```
SYNTAX ERROR: Empty file
Expected: Valid SongCode content
Fix: Add song content (patterns, sections, or at minimum metadata)
```

**E0.2 - Invalid character encoding**
```
SYNTAX ERROR: File contains invalid characters
Line [N]: Character encoding issue detected
Expected: Valid UTF-8 encoding
Fix: Save file with UTF-8 encoding
```

---

### Error Reporting Guidelines for Implementers

**For each error**:
1. **Stop immediately** (fail-fast approach)
2. **Include line number** when possible
3. **Provide context** from the actual file
4. **Use exact error format** from catalog above
5. **Substitute placeholders** with actual values:
   - `[N]` → actual line number
   - `[key]` → actual key name
   - `[value]` → actual value
   - `[n]` → actual pattern number
   - `[chord]` → actual chord text
   - `[count]` → actual chord count
   - `[num]/[denom]` → actual time signature
   - `[modifier]` → actual modifier name

**Example implementation**:
```python
def report_error(error_code, line_num, **kwargs):
    # Get template from catalog
    template = ERROR_CATALOG[error_code]
    
    # Substitute values
    message = template.format(line=line_num, **kwargs)
    
    # Stop parsing
    raise ParseError(message)
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
function getBeatsPerMeasure(time):
    return time.numerator
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
    // Step 1: Character normalization
    pattern = replace_all_tabs_with_space(pattern)
    pattern = replace_all_newlines_with_semicolon(pattern)  // \n → ;
    pattern = replace_all_carriage_returns_with_semicolon(pattern)  // \r → ;
    
    // Step 2: Split by semicolon (measure separator)
    measures = split(pattern, ";")
    
    // Step 3: Normalize each measure
    normalized_measures = []
    for each measure in measures:
        measure = trim_leading_trailing_spaces(measure)
        measure = collapse_multiple_spaces_to_single_space(measure)
        normalized_measures.append(measure)
    
    // Step 4: Rejoin measures
    pattern = join(normalized_measures, ";")
    
    // Step 5: Remove spaces around special characters
    pattern = remove_all_spaces_after("[")
    pattern = remove_all_spaces_before("]")
    pattern = remove_all_spaces_before_and_after(";")
    pattern = remove_spaces_between("]", digit)
    
    // Step 6: Final trim
    pattern = trim_leading_trailing_spaces(pattern)
    
    return pattern

// Examples:
// "  Am   D  " → "Am D"
// "Am D  ;  G   E " → "Am D;G E"
// " [  A ; G ] 3  " → "[A;G]3"
// "A\tD\nG E" → "A D;G E"
```

### Circular Reference Detection

Detects when pattern definitions form a cycle (e.g., `$1` → `$2` → `$1`).

**Algorithm**: Stack-based tracking during pattern resolution

```
resolution_stack = []  // Global tracking stack

function resolvePatternVariable(pattern_id, current_line):
    // Check if already in resolution stack (circular reference)
    if pattern_id in resolution_stack:
        // Build cycle path for error message
        cycle_path = resolution_stack + [pattern_id]
        cycle_string = " → ".join(["$" + id for id in cycle_path])
        
        throw E1.2.4:
            "REFERENCE ERROR: Circular reference detected"
            "Line [current_line]: " + cycle_string
            "Expected: Pattern references must not be circular"
            "Fix: Remove circular dependency in pattern definitions"
    
    // Add to stack
    resolution_stack.push(pattern_id)
    
    // Resolve pattern content (substitute pattern variables)
    pattern_content = patterns[pattern_id].sc
    
    // Process pattern content - if it contains other pattern variables,
    // recursively resolve them (will detect deeper cycles)
    for each "$n" in pattern_content:
        resolvePatternVariable(n, current_line)
    
    // Remove from stack after successful resolution
    resolution_stack.pop()
    
    return resolved_pattern_content
```

**Example detection**:

```songcode
$1
A;$2

$2
D;$1    ← Circular reference detected here
```

**Error output**:
```
REFERENCE ERROR: Circular reference detected
Line 5: Pattern references form a cycle: $2 → $1 → $2
Expected: Pattern references must not be circular
Fix: Remove circular dependency in pattern definitions
```

### Pattern Variable Resolution

**Rule**: Patterns must be defined before use (no forward references).

**Resolution depth**: Maximum 1 level
- ✓ Allowed: `$2` contains `$1` (depth 1)
- ✗ Not allowed: `$3` contains `$2` which contains `$1` (depth 2)

**Algorithm**:

```
function resolvePattern(pattern_id):
    pattern = patterns[pattern_id]
    
    if pattern.sc contains no variables:
        return pattern.sc  // No resolution needed
    
    // Check depth (count how many times we need to resolve)
    depth = 0
    temp_content = pattern.sc
    
    while temp_content contains "$":
        depth++
        if depth > 1:
            throw E1.2.5:
                "REFERENCE ERROR: Pattern reference depth exceeds maximum"
                "Line [N]: Pattern $[n] requires depth > 1 to resolve"
        
        // Replace all variables in this level
        for each "$n" in temp_content:
            if n not defined yet:
                throw E1.2.3: "Pattern $n is not defined"
            
            // Check for circular reference
            resolvePatternVariable(n, pattern_line_number)
            
            // Substitute
            temp_content = temp_content.replace("$n", patterns[n].sc)
    
    return temp_content
```

**Valid examples**:

```songcode
# Depth 0: No variables
$1
A;D;G
✓ Valid

# Depth 1: One level of variables
$1
A;D

$2
$1;G;E
✓ Valid (depth 1)

# Depth 2: NOT ALLOWED
$1
A;D

$2
$1;G

$3
$2;E    ← ERROR: Would require depth 2 to fully resolve
✗ Invalid
```

**Forward reference example (not allowed)**:

```songcode
$2
$1;G    ← ERROR: $1 not defined yet

$1
A;D
✗ Invalid - patterns must be defined before use
```

**Processing order**:
1. Parse all pattern definitions (Phase 1.3)
2. Validate no forward references
3. Resolve pattern variables in order
4. Detect circular references during resolution

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
**Prompter**: Section's measures are expanded but not consumed by lyrics. If you want section to appear in prompter, add lyrics (e.g., `***Intro***`).

### 5. Empty Pattern

```songcode
$1


Verse
$1
--
First line
Second line
```

**Handling**: Valid (placeholder during composition)  
**JSON**: `"json": null`, `"measures": 0`  
**Modifiers**: All modifiers bypassed (`_repeat`, `_cutStart`, `_cutEnd`, `_before`, `_after`)  
**Validation**: Lyric measure counts not validated  
**Prompter**: Section skipped entirely  
**Use case**: Song skeleton during writing process  
**Note**: For lyrics-only sections with timing, use silence symbols (`_`) instead

### 6. Pattern Variable Self-Reference

```songcode
$1
A;$1
```

**Handling**: ERROR (infinite recursion)  
**Detection**: Track resolution stack

### 7. Unicode in Lyrics

```songcode
--
Café au lait ☕ _2
```

**Handling**: Accept UTF-8 characters in lyrics

### 8. Very Long Songs

**Handling**: No limit

### 9. Floating Point Beat Divisions

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
