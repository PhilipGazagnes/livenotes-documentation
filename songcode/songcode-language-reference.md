# SongCode Language Reference

**Version 1.0**

## Table of Contents

1. [Introduction](#introduction)
2. [File Structure](#file-structure)
3. [Metadata](#metadata)
4. [Pattern Definitions](#pattern-definitions)
5. [Sections](#sections)
6. [Chord Notation](#chord-notation)
7. [Pattern Syntax](#pattern-syntax)
8. [Modifiers](#modifiers)
9. [Lyrics](#lyrics)
10. [Special Markers](#special-markers)
11. [Complete Examples](#complete-examples)
12. [Best Practices](#best-practices)
13. [Common Errors](#common-errors)

---

## Introduction

SongCode is a text-based notation language for writing musical chord charts with lyrics. It's designed to be:
- **Human-readable**: Easy to write and understand
- **Compact**: Use pattern definitions to avoid repetition
- **Precise**: Include timing information for exact playback
- **Flexible**: Support various musical structures and time signatures

A SongCode file (`.sc`) is parsed into a Livenotes JSON format for use in the Livenotes application.

---

## File Structure

Every SongCode file follows this three-part structure:

```
[Metadata]           ← Optional, at the beginning
[Pattern Definitions] ← Optional, after metadata
[Sections]           ← Required, the main content
```

### Rules:
- **Empty lines** separate blocks
- **Metadata** must come first (if present)
- **Pattern definitions** must come before sections (if present)
- **Sections** make up the rest of the file

---

## Metadata

Metadata appears at the beginning of the file and provides song-level information.

### Format

Each metadata line starts with `@` followed by a key and value:

```songcode
@key value
```

### Available Keys

#### `@name`
- **Type**: String (max 100 characters)
- **Description**: Song title
- **Example**: `@name Highway to Hell`

#### `@artist`
- **Type**: String (max 100 characters)
- **Description**: Artist or band name
- **Example**: `@artist AC/DC`

#### `@original`
- **Type**: Base chord (see [Chord Notation](#chord-notation))
- **Description**: The root note of the first chord in the original recording
- **Example**: `@original A`
- **Note**: Used to calculate pitch transposition

#### `@capo`
- **Type**: Integer (1-20)
- **Description**: Capo position
- **Example**: `@capo 3`
- **Note**: When the guitar capo is written, it is considered that the chords writen in the patterns are relative from the capo position. For example, with @capo 3, an Am chord in the file would in reality be a Cm.

#### `@bpm`
- **Type**: Integer (0-400)
- **Description**: Tempo in beats per minute
- **Example**: `@bpm 120`

#### `@time`
- **Type**: Time signature notation
- **Format**: `numerator/4` (V1: denominator must be 4)
- **Default**: `4/4`
- **V1 Restriction**: Only denominator `4` is supported (quarter note as beat unit)
- **Examples**: 
  - `@time 3/4` ✓ Valid
  - `@time 6/4` ✓ Valid
  - `@time 6/8` ✗ Invalid in V1 (denominator must be 4)

#### `@warning`
- **Type**: String (max 100 characters)
- **Description**: Important performance notes
- **Example**: `@warning Tricky break before solo`

#### `@end`
- **Type**: String (max 100 characters)
- **Description**: How the song ends
- **Example**: `@end On 1 after last measure`

### Example Metadata Block

```songcode
@name Highway to Hell
@artist AC/DC
@bpm 120
@time 4/4
@original A
@warning Rythmic pattern on break
@end Like studio version
```

### Rules:
- Metadata lines must be **consecutive** (empty lines between them are OK)
- All metadata keys are **optional**
- Non-consecutive metadata throughout the file causes an **error**
- Invalid keys or values cause an **error**

---

## Pattern Definitions

**📖 For Users**: This section describes how to write and use patterns  
**🔧 For Implementers**: See [Parser Spec - Phase 1.3](parser-generator-specification.md#step-13-parse-pattern-definitions) for parsing algorithm  
**📊 JSON Output**: See [JSON Structure - Patterns Object](livenotes-json-structure-reference.md#patterns-object)

> **Note**: This section explains what patterns do and how to write them. For implementation details, see the Parser Specification.

Pattern definitions allow you to write chord progressions once and reuse them throughout the song.

**Key Benefits**:
- **Avoid duplication**: Define a progression once, use it multiple times
- **Easy maintenance**: Change the pattern once, all sections update
- **Use with modifiers**: A single pattern can be varied per section using modifiers (`_cutStart`, `_cutEnd`, `_before`, `_after`, `_repeat`)

**Pattern Reuse Philosophy**: Instead of creating multiple similar patterns (like Pattern A, Pattern A-shortened, Pattern A-with-intro), create **one pattern** and use **modifiers** to adapt it per section.

### Format

```songcode
$n
pattern description
```

Where:
- `$n` is the pattern identifier (e.g., `$1`, `$2`, `$10`)
- Pattern description follows on subsequent lines until an empty line

### Example

```songcode
$1
A;G;%;A

$2
[A;G;%;A]3
:
A;G;%;E;%

$3
[A;D % G D]3
:
A;D;%
```

### Formatting Flexibility

**Multi-line patterns**: You can write patterns across multiple lines for readability. Newlines between measures act as implicit `;` separators.

```songcode
# These are identical:

# Version 1: All on one line
$1
A;G D;D G;A;E;C;E;%

# Version 2: Split across lines
$1
A;G D;D G;A
E;C;E;%
```

**Line breaks**: Use `:` to indicate a visual line break (for UI display):

```songcode
# These are identical:

# One line with explicit :
$2
[A;G;%;A]3:A;G;%;E;%

# Multiple lines (: creates line break)
$2
[A;G;%;A]3
:
A;G;%;E;%
```

**Note**: The parser normalizes patterns to a single-line canonical form internally, so formatting is purely for human readability.

### Rules:
- Pattern identifiers can be **any number** (`$1`, `$2`, `$100`)
- Numbers don't have to be **sequential**
- All pattern definitions must be **consecutive** (before sections begin)
- Pattern definitions can **reference other patterns**:
  ```songcode
  $1
  A;G
  
  $2
  $1;D;E    ← Valid! Expands to: A;G;D;E
  ```
- Cannot **redefine** a pattern (causes error)
- Cannot **reference undefined** patterns (causes error)

---

## Sections

Sections are the main building blocks of a song (verses, choruses, etc.).

### Format

```songcode
SectionName
pattern description or $n
--
lyric line 1
lyric line 2
```

Or with a comment:

```songcode
SectionName!Comment
pattern description
--
lyric line
```

### Components

#### 1. Section Header
- **Format**: `Name` or `Name!Comment`
- The `!` separates the name from an optional comment
- **Example**: `Break!Rythmic pattern`

#### 2. Pattern Description
- Can be a pattern variable (`$1`, `$2`, etc.)
- Or a full pattern description
- Optional modifiers can appear here (see [Modifiers](#modifiers))

#### 3. Lyrics Separator
- A line containing only `--`
- Marks the start of lyrics

#### 4. Lyrics
- One or more lines of lyrics
- Each line can have a measure count (see [Lyrics](#lyrics))

### Example

```songcode
Intro
$1
_repeat 2
--
***Intro*** _8

Verse
$2
--
Living easy, living free _2
Season ticket on a one-way ride _2
```

### Rules:
- Sections are separated by **empty lines**
- Each section must have a **name** (first line)
- Pattern can be **inline** or **reference** a definition
- Lyrics are **optional** but the `--` separator is **required** if you want lyrics

---

## Chord Notation

### Base Chords

A chord consists of a **base chord** and an optional **extension**.

**Valid base chords:**

```
A   A#  Ab  Am  A#m  Abm
B   Bb      Bm  Bbm
C   C#      Cm  C#m
D   Db  D#  Dm  Dbm  D#m
E   Eb      Em  Ebm
F   F#      Fm  F#m
G   Gb  G#  Gm  Gbm  G#m
```

### Extensions

Extensions are added directly after the base chord (no space):

```songcode
Am7        ← Base: Am, Extension: 7
G7sus4     ← Base: G,  Extension: 7sus4
Dm7b5      ← Base: Dm, Extension: 7b5
```

**Rules:**
- **No spaces** between base and extension (e.g., `Am 7` is invalid)
- Extensions are **not validated** (you can write any extension)
- Spaces indicate **multiple chords** in a measure

### Examples

```songcode
A          ← A major
Am         ← A minor
Am7        ← A minor 7
A7sus4     ← A dominant 7 suspended 4
Dbm9#11    ← D-flat minor 9 sharp 11 (any extension works)
```

---

## Pattern Syntax

**📖 For Users**: This section describes pattern syntax from the writer's perspective  
**🔧 For Implementers**: See [Parser Spec - Phase 2](parser-generator-specification.md#phase-2-pattern-transformation) for transformation details  
**📊 JSON Output**: See [JSON Structure - Pattern JSON Arrays](livenotes-json-structure-reference.md#json-pattern-elements)

> **Note**: This explains the syntax rules. The Parser Spec explains how to transform patterns into JSON.

Patterns describe the chord progression structure using a specific syntax.

### Basic Elements

#### Measures
Separated by semicolons (`;`):

```songcode
A;G;D;E
```
This creates 4 measures, one chord per measure.

#### Multiple Chords per Measure
Use spaces within a measure:

```songcode
A D;G;E    ← Measure 1: A and D (2 beats each in 4/4)
```

Beat division is **always equal**:
- In 4/4 time: `A D` = 2 beats each, `A D G E` = 1 beat each
- In 3/4 time: `A D E` = 1 beat each, `A D` = 1.5 beats each

#### Chord Repeat: `%`
Repeats the previous chord:

```songcode
A;%;G    ← A for 1 measure, A for 1 measure, G for 1 measure
```

```songcode
A % G D    ← In one measure: A, A, G, D (1 beat each in 4/4)
```

#### Silence: `_`
Represents one beat of silence (no chord):

```songcode
A _ G _    ← A, silence, G, silence (1 beat each in 4/4)
```

```songcode
A;_        ← Measure 1: A (4 beats), Measure 2: silence (4 beats)
```

#### Measure Remover: `=`
Removes beats from the end of a measure.

**How it works:**
1. Each position in a measure gets an equal share of beats
2. The `=` symbol removes its share of beats from the measure
3. Formula: `beats_per_position = time_signature_numerator / position_count`
4. Each `=` removes exactly `beats_per_position` beats

**Examples in 4/4 time:**
```songcode
Em =       ← 2 positions: 4÷2 = 2 beats each
           ← Em gets 2 beats, = removes 2 beats
           ← Result: 2 beats total

Em G Am =  ← 4 positions: 4÷4 = 1 beat each
           ← Em, G, Am each get 1 beat, = removes 1 beat
           ← Result: 3 beats total

A = = =    ← 4 positions: 4÷4 = 1 beat each
           ← A gets 1 beat, three = symbols remove 3 beats
           ← Result: 1 beat total
```

**Rules:**
- `=` must **always be at the end** of a measure
- Multiple `=` symbols are allowed: `A = =` (removes 2 beats in 4/4)
- `A _ = G` is **invalid** (remover not at end) → causes error
- `A G _ =` is **valid** (remover at end)

#### Loops
Repeat a section of the pattern:

```songcode
[A;G;D]3    ← Play A;G;D three times total
```

**Format**: `[pattern]n` where `n` is the number of total repetitions

#### Line Breaks: `:`
Visual formatting for multi-line patterns:

```songcode
[A;G;D]3
:
E;F
```

The `:` creates a visual break (used for display formatting in the app).

### Complete Pattern Example

```songcode
$2
[A;G;%;A]3    ← Loop 3 times
:             ← Line break
A;G;%;E;%     ← Then play this
```

This pattern:
1. Plays A, G, G (%), A three times (12 measures)
2. Then plays A, G, G (%), E, E (%) once (5 measures)
3. Total: 17 measures

---

## Modifiers

**📖 For Users**: This section describes available modifiers and their effects  
**🔧 For Implementers**: See [Parser Spec - Phase 1.4](parser-generator-specification.md#pattern-modifier-parsing) for parsing, [Phase 3](parser-generator-specification.md#phase-3-validation) for validation  
**📊 JSON Output**: See [JSON Structure - Section Pattern Object](livenotes-json-structure-reference.md#pattern-object)

> **Note**: This explains what modifiers do. The Parser Spec explains how they're applied during validation and prompter generation.

Modifiers alter how a pattern is played in a specific section. They appear before the `--` separator.

### Purpose of Modifiers

Modifiers enable **pattern reuse with variation**. Instead of defining multiple similar patterns, you define **one pattern** and use modifiers to adapt it for each section.

**Example Scenario**: A song has an 8-measure chord progression. The intro uses measures 3-8, the verse uses all 8 measures, and the chorus uses measures 1-5.

**❌ Without modifiers** (duplicating patterns):
```songcode
$1
D;A;Bm;G;D;A;Bm;G    ← Full progression

$2  
Bm;G;D;A;Bm;G        ← Intro (cut first 2)

$3
D;A;Bm;G;D           ← Chorus (cut last 3)
```

**✅ With modifiers** (reusing one pattern):
```songcode
$1
D;A;Bm;G;D;A;Bm;G    ← Single definition

Intro
$1
_cutStart 2          ← Start at measure 3
--
***Intro*** _6

Verse
$1                   ← Use full pattern
--
First verse line _8

Chorus
$1
_cutEnd 3            ← End at measure 5
--
Chorus line _5
```

**Result**: One pattern definition, multiple uses with variations. Changes to the base pattern automatically apply to all sections.

---

### `_repeat`

Repeats the entire pattern.

**Format**: `_repeat n` where n ≥ 2

```songcode
Intro
$1
_repeat 2    ← Play pattern $1 twice
--
***Intro*** _8
```

**Default**: 1 (pattern plays once)

### `_cutStart`

Cuts measures/beats from the beginning of the pattern.

**Format**: `_cutStart [measures][-beats]`

**Examples**:
- `_cutStart 2` → Cut first 2 measures
- `_cutStart 1-2` → Cut first 1 measure and 2 beats
- `_cutStart -3` → Cut first 3 beats

```songcode
Verse
$2
_cutStart 1    ← Skip first measure of pattern
--
Starting from measure 2 _16
```

**Pattern Reuse Example**:
```songcode
# Example: Reusing same pattern with different starts
$1
D;A;Bm;G;D;A;Bm;G

Intro
$1
_cutStart 2    ← Skip first 2, start at Bm
--
***Intro*** _6

Verse
$1             ← Use full pattern
--
Full verse _8
```

### `_cutEnd`

Cuts measures/beats from the end of the pattern.

**Format**: `_cutEnd [measures][-beats]`

**Examples**:
- `_cutEnd 2` → Cut last 2 measures
- `_cutEnd 1-2` → Cut last 1 measure and 2 beats
- `_cutEnd -3` → Cut last 3 beats

```songcode
Chorus
$3
_cutEnd 2    ← Omit last 2 measures of pattern
--
Highway to hell _7
```

**Pattern Reuse Example**:
```songcode
# Example: Same pattern with different endings
$1
D;A;Bm;G;D;A;Bm;G

Chorus
$1
_cutEnd 3      ← End after 5 measures
--
Short chorus _5

Bridge
$1
_cutEnd 1      ← End after 7 measures
--
Longer bridge _7
```

### `_before`

Adds measures before the pattern.

**Format**: `_before pattern` (single line)

```songcode
Verse
$2
_before Am D;E    ← Play Am D;E, then pattern $2
--
After the intro _18
```

**Syntax Support**:
- ✅ All chord notation
- ✅ Loops: `_before [A;G]3`
- ✅ Symbols: `%`, `_`, `=`
- ✅ Multiple chords: `_before Am D G;E`
- ❌ **Line breaks (`:`) NOT allowed**
- ❌ **Pattern variables (`$n`) NOT allowed**

**Examples**:
```songcode
# Valid examples
_before Am;D;E              ← 3 measures
_before [A G;D]2            ← Loop: 4 measures
_before Am %;D =;E          ← With symbols

# Invalid examples
_before $1                  ← ERROR: No pattern variables
_before A;G:D;E            ← ERROR: No line breaks
```

### `_after`

Adds measures after the pattern.

**Format**: `_after pattern` (single line)

```songcode
Verse
$2
_after D;E    ← Play pattern $2, then D;E
--
Ending with a twist _19
```

**Syntax Support**: Same as `_before` (see above)

**Examples**:
```songcode
# Valid examples
_after G;A                  ← 2 measures
_after [D;E]3              ← Loop: 6 measures
_after Am D;%;E =          ← With symbols

# Invalid examples
_after $2                   ← ERROR: No pattern variables
_after A:G                 ← ERROR: No line breaks
```

**Time Signature Note**: 
- `_before` and `_after` patterns inherit the section's time signature
- If the section has `@time`, both modifiers use that time signature
- Otherwise, they use the global time signature
- They must be valid in that time signature (beats per position must be integer)

Example:
```songcode
@time 4/4       ← Global

Verse
@time 3/4       ← Section override
$1
_before A D E   ← Valid: 3 chords in 3/4 = 1 beat each
_after F G C    ← Valid: 3 chords in 3/4 = 1 beat each

# This would be INVALID:
# _before A D   ← ERROR: 2 chords in 3/4 = 1.5 beats each
```

### Section-Level Metadata

You can override global metadata for a specific section:

```songcode
Bridge
@bpm 140
@time 3/4
$1
--
Faster section in 3/4 time _12
```

### Combining Modifiers

Multiple modifiers can be used together:

```songcode
Chorus
$3
_repeat 2
_cutEnd 1
_after G;A
--
Modified chorus _20
```

If the pattern is repeated, the _cutEnd, _cutStart, _after and _before, apply to the beginning of the first repetition and the end of the last. Example :

```songcode
Chorus
Em;G;A;C
_repeat 3
_cutStart 2
_before E7;%;F7;%
_cutEnd 1
_after G;A
```

Result :

```songcode
E7;%;F7;%;A;C;Em;G;A;C;Em;G;A;G;A
```

---

## Lyrics

Lyrics appear after the `--` separator in each section.

### Basic Format

```songcode
--
This is a lyric line
Another lyric line
```

### Measure Count

Add timing information with `_n` at the end of a line:

```songcode
--
Living easy, living free _2
Season ticket on a one-way ride _2
```

The number indicates how many measures that lyric line lasts.

**Format**: `lyric text _n` where n is a positive integer

### All or Nothing Rule

**Important**: If ANY lyric line in the song has a measure count, then ALL lyric lines must have measure counts. Otherwise, the parser will generate an error.

**Why?** The Prompter (display format) requires complete timing information. If you don't need timing, omit it from all lyrics.

### Validation

The sum of all lyric measure counts in a section must equal the total measures of the section's pattern (considering repeats and modifiers).

**Example**:
```songcode
Verse
A;G;D    ← 3 measures
--
First line _1
Second line _1
Third line _1    ← Total: 3 measures ✓
```

---

## Special Markers

### Information Markers: `***text***`

Display information visible to all viewers (audience and musicians):

```songcode
--
***Intro*** _4
***Guitar Solo*** _8
```

In the generated JSON, these get `style: "info"`.

### Musician-Only Markers: `:::text:::`

Display information visible only to musicians (hidden from audience view):

```songcode
--
:::Break::: _4
:::Watch the drummer::: _2
```

In the generated JSON, these get `style: "musicianInfo"`.

### Usage

These markers are typically used for:
- Instrumental sections: `***Solo***`, `***Intro***`
- Performance cues: `:::Cut:::`, `:::Watch for cue:::`
- Structural information: `***Bridge***`, `:::Instrumental:::`

---

## Complete Examples

### Simple Song

```songcode
@name Simple Song
@artist The Band
@bpm 100
@time 4/4

$1
G;C;D;G

Verse
$1
_repeat 2
--
First line of verse _2
Second line of verse _2
Third line of verse _2
Fourth line of verse _2

Chorus
$1
--
This is the chorus _4
```

### Complex Song with Loops and Modifiers

```songcode
@name Complex Example
@bpm 120
@time 4/4

$1
A;G;%;A

$2
[A;G;%;A]3
:
A;G;%;E;%

$3
[A;D % G D]3
:
A;D;%

Intro
$1
_repeat 2
--
***Intro*** _8

Verse
$2
--
Verse line one _2
Verse line two _2
Verse line three _2
Verse line four _2
Verse line five _2
Verse line six _2
Verse line seven _2
Verse line eight _3

Chorus
$3
--
Chorus line _2
Chorus line _2
Chorus line _2
Chorus line _3

Bridge
@bpm 140
D;E;F;G
_before Am;Am
_after Am;Am
--
:::Tempo switch::: _2
Bridge lyrics _4
:::Act crazy on bridge end::: _2
```

### Using Silence and Removers

```songcode
@time 4/4

Verse
A _ G _;D _ E _
--
***Rhythmic pattern*** _2

Break
[A]4;[_]2;[_]2;[Em;G;A;G]2
--
:::Hits::: _4
:::Silence::: _2
:::Vocal build up::: _2
***Solo*** _8

Shortened
Em G;Em =;G
--
Two and a half measures _3
```

---

## Best Practices

### 1. Use Pattern Definitions for Repeated Progressions

**Bad**:
```songcode
Verse 1
A;G;D;E
--
...

Verse 2
A;G;D;E
--
...
```

**Good**:
```songcode
$1
A;G;D;E

Verse 1
$1
--
...

Verse 2
$1
--
...
```

### 2. Be Consistent with Timing

Either include measure counts for all lyrics or for none:

**Bad**:
```songcode
Line one _2
Line two
Line three _1
```

**Good**:
```songcode
Line one _2
Line two _3
Line three _1
```

### 3. Use Comments for Complex Sections

```songcode
Bridge!Watch for tempo change
@bpm 140
$3
--
...
```

### 4. Validate Time Signatures

Make sure chords fit within measures:

**Bad** (in 3/4):
```songcode
A D G E    ← 4 beats in 3/4 time → ERROR
```

**Good** (in 3/4):
```songcode
A D G      ← 3 beats in 3/4 time → OK
```

### 5. Group Related Pattern Definitions

```songcode
$1
A;G;D

$2
$1;E;F    ← Build on $1

$3
$2;$1     ← Combine patterns
```

### 6. Use Descriptive Section Names

**Bad**:
```songcode
Part1
...

Part2
...
```

**Good**:
```songcode
Verse
...

Chorus
...

Bridge
...
```

But, in the end, write what makes the most sense for you !

---

## Common Errors

### 1. Non-Consecutive Metadata

**Error**:
```songcode
@name Song

$1
A;G

@bpm 120    ← ERROR: metadata after patterns
```

**Fix**: Keep all metadata at the top:
```songcode
@name Song
@bpm 120

$1
A;G
```

### 2. Non-Consecutive Pattern Definitions

**Error**:
```songcode
$1
A;G

Verse
$1
--
...

$2          ← ERROR: pattern after section
D;E
```

**Fix**: Define all patterns before sections:
```songcode
$1
A;G

$2
D;E

Verse
$1
--
...
```

### 3. Remover Not at End

**Error**:
```songcode
A = G D    ← ERROR: = not at end
```

**Fix**:
```songcode
A G D =    ← OK: = at end
```

### 4. Spaces in Chord Notation

**Error**:
```songcode
Am 7       ← ERROR: space between base and extension
```

**Fix**:
```songcode
Am7        ← OK: no space
```

### 5. Mismatched Measure Counts

**Error** (pattern has 4 measures):
```songcode
Verse
A;G;D;E    ← 4 measures
--
Line one _2
Line two _1    ← Only 3 measures total → ERROR
```

**Fix**:
```songcode
Verse
A;G;D;E    ← 4 measures
--
Line one _2
Line two _2    ← Total: 4 measures → OK
```

### 6. Chords Don't Fit Time Signature

**Error** (beats per position not an integer):
```songcode
@time 4/4

Verse
A D E      ← 3 chords in 4/4: 4÷3 = 1.33 beats each → ERROR
```

**Fix**:
```songcode
@time 4/4

Verse
A D E F    ← 4 chords in 4/4: 4÷4 = 1 beat each → OK
```

**Error** (in 3/4):
```songcode
@time 3/4

Verse
A D        ← 2 chords in 3/4: 3÷2 = 1.5 beats each → ERROR
```

**Fix**:
```songcode
@time 3/4

Verse
A D E      ← 3 chords in 3/4: 3÷3 = 1 beat each → OK
```

**Rule**: The number of positions in a measure must divide evenly into the time signature numerator.

### 7. Undefined Pattern Reference

**Error**:
```songcode
Verse
$5         ← ERROR: $5 not defined
--
...
```

**Fix**: Define the pattern first:
```songcode
$5
A;G;D

Verse
$5
--
...
```

### 8. Incomplete Timing Information

**Error**:
```songcode
--
Line one _2
Line two      ← ERROR: missing measure count
Line three _1
```

**Fix** (all or nothing):
```songcode
--
Line one _2
Line two _3
Line three _1
```

Or remove all timing:
```songcode
--
Line one
Line two
Line three
```

---

## Summary

SongCode provides a powerful, flexible way to notate songs with:
- **Metadata** for song information
- **Pattern definitions** to avoid repetition
- **Sections** to structure the song
- **Modifiers** to customize pattern usage
- **Precise timing** with measure counts
- **Special markers** for performance information

By following the syntax rules and best practices in this reference, you can create clear, maintainable song charts that parse correctly into Livenotes JSON format.

For information on how SongCode is parsed and transformed, see the **Parser/Generator Specification** document.
