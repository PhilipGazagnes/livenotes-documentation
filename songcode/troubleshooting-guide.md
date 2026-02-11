# SongCode Troubleshooting Guide

**When Things Go Wrong: Practical Solutions**

---

## Table of Contents

1. [Common Syntax Errors](#common-syntax-errors)
2. [Timing and Measure Count Issues](#timing-and-measure-count-issues)
3. [Pattern Problems](#pattern-problems)
4. [Metadata Errors](#metadata-errors)
5. [Modifier Issues](#modifier-issues)
6. [Time Signature Problems](#time-signature-problems)
7. [Reading Error Messages](#reading-error-messages)
8. [Debugging Workflows](#debugging-workflows)

---

## Common Syntax Errors

### ❌ Missing `--` Separator

**Error**: Parser can't find lyrics or gets confused about structure

**Example**:
```songcode
Verse
G;C;D;G
First line of lyrics    ← ERROR: Missing --
```

**Fix**: Add `--` before lyrics
```songcode
Verse
G;C;D;G
--
First line of lyrics _4
```

**Why**: The `--` tells the parser where chords end and lyrics begin.

---

### ❌ Empty Lines in Wrong Places

**Error**: Pattern appears to have sections, metadata appears after patterns

**Example**:
```songcode
$1
A;G

            ← ERROR: Empty line splits pattern definition

D;E
```

**Fix**: Remove empty lines within pattern definitions
```songcode
$1
A;G
D;E
```

**Why**: Empty lines separate major blocks (metadata → patterns → sections). Empty line within a pattern ends that pattern definition.

---

### ❌ Spaces in Chord Names

**Error**: Parser sees two chords instead of one

**Example**:
```songcode
Am 7;G;D    ← ERROR: "Am 7" is seen as two chords
```

**Fix**: Remove space
```songcode
Am7;G;D
```

**Why**: Spaces within a measure mean multiple chords. `Am 7` = "Am chord then 7 chord" (2 beats each in 4/4).

---

### ❌ Pattern Numbers After Sections Start

**Error**: Non-consecutive pattern definitions

**Example**:
```songcode
$1
A;G;D

Verse        ← Sections started
$1
--
Lyrics

$2           ← ERROR: Pattern after sections
D;E
```

**Fix**: Move all pattern definitions before sections
```songcode
$1
A;G;D

$2
D;E

Verse
$1
--
Lyrics
```

**Why**: All pattern definitions must come before any section begins.

---

## Timing and Measure Count Issues

### 🔍 "Measure counts don't add up"

**Problem**: Sum of lyric measure counts ≠ pattern measures

**Debugging Steps**:

1. **Calculate pattern measures**
   ```songcode
   $1
   A;G;D;G    ← 4 measures
   ```

2. **Apply modifiers**
   ```songcode
   Verse
   $1
   _repeat 2    ← 4 × 2 = 8 measures
   ```

3. **Sum lyric counts**
   ```songcode
   Line 1 _2    ← 2 measures
   Line 2 _2    ← 2 measures
   Line 3 _2    ← 2 measures
   Total: 6     ← ERROR: Should be 8!
   ```

4. **Fix**: Adjust lyric counts or pattern
   ```songcode
   Line 1 _2
   Line 2 _2
   Line 3 _2
   Line 4 _2    ← Now totals 8 ✓
   ```

---

### 🔍 "All-or-Nothing" Timing Error

**Error**: Mixed timing (some lyrics have `_n`, others don't)

**Example**:
```songcode
--
Line 1 _2      ← Has count
Line 2         ← ERROR: Missing count
Line 3 _1      ← Has count
```

**Fix Option 1**: Add counts to all
```songcode
--
Line 1 _2
Line 2 _3
Line 3 _1
```

**Fix Option 2**: Remove all counts
```songcode
--
Line 1
Line 2
Line 3
```

**Why**: Either all lyrics have measure counts or none do. No mixing.

---

### 🔍 Using `_cutEnd` with Wrong Math

**Problem**: Cut more measures than exist

**Example**:
```songcode
$1
A;G;D;G      ← 4 measures

Verse
$1
_cutEnd 5    ← ERROR: Trying to remove 5 from 4!
--
Lyrics _1    ← Pattern would have -1 measures
```

**Effect**: Parser will remove all measures, leaving empty pattern

**Fix**: Don't cut more than exists
```songcode
Verse
$1
_cutEnd 3    ← Remove 3, leaves 1 measure
--
Lyrics _1
```

---

### 🔍 Measure Count Calculation with Modifiers

**Complex Example**:
```songcode
$1
A;G;D;G           ← Base: 4 measures

Verse
$1
_repeat 2         ← Step 1: 4 × 2 = 8 measures
_cutStart 1       ← Step 2: 8 - 1 = 7 measures
_cutEnd 2         ← Step 3: 7 - 2 = 5 measures
_before Am;Am     ← Step 4: 5 + 2 = 7 measures
_after G          ← Step 5: 7 + 1 = 8 measures
--
Lyrics need to total 8 measures
```

**Order of operations**:
1. Repeat pattern
2. Apply cutStart
3. Apply cutEnd
4. Add before pattern
5. Add after pattern

---

## Pattern Problems

### 🔍 "Pattern variable not found"

**Error**: Undefined pattern reference

**Example**:
```songcode
Verse
$5           ← ERROR: $5 never defined
--
Lyrics
```

**Fix**: Define pattern before using it
```songcode
$5
A;G;D;G

Verse
$5
--
Lyrics
```

---

### 🔍 "Circular reference detected"

**Error**: Pattern references itself (directly or indirectly)

**Example 1** (Direct):
```songcode
$1
A;$1;G       ← ERROR: $1 references itself
```

**Example 2** (Indirect):
```songcode
$1
A;$2;G

$2
D;$1;E       ← ERROR: $1 → $2 → $1 (circular)
```

**Fix**: Break the cycle
```songcode
$1
A;G

$2
D;$1;E       ← OK: $2 uses $1, but $1 doesn't use $2
```

---

### 🔍 "Pattern reference depth exceeded"

**Error**: Pattern references pattern that references another pattern

**Example**:
```songcode
$1
A;G

$2
$1;D         ← $2 uses $1 (depth 1)

$3
$2;E         ← ERROR: $3 uses $2 which uses $1 (depth 2)
```

**Why**: Maximum reference depth is 1

**Fix**: Flatten pattern references
```songcode
$1
A;G

$2
$1;D

$3
A;G;D;E      ← Use explicit chords instead of $2
```

---

### 🔍 "My pattern looks different in two sections"

**Q**: I used `$1` in two sections, but they behave differently. Why?

**A**: Modifiers affect the pattern within that section only.

**Example**:
```songcode
$1
A;G;D;G      ← 4 measures

Verse 1
$1           ← Uses 4 measures (no modifiers)
--
Lyrics _4

Verse 2
$1
_repeat 2    ← Uses 8 measures (modifier applied)
--
Lyrics _8
```

**Pattern is shared, modifiers are per-section.**

---

## Metadata Errors

### 🔍 "Non-consecutive metadata"

**Error**: Metadata appears after content starts

**Example**:
```songcode
@name My Song

$1              ← Content started
A;G

@bpm 120        ← ERROR: Metadata after patterns
```

**Fix**: Move all metadata to the top
```songcode
@name My Song
@bpm 120

$1
A;G
```

---

### 🔍 "Invalid BPM value"

**Error**: BPM outside valid range (0-400)

**Example**:
```songcode
@bpm 500       ← ERROR: Too high
@bpm -10       ← ERROR: Negative
```

**Fix**: Use valid range
```songcode
@bpm 120       ← OK
```

---

### 🔍 "Invalid time signature"

**Error**: Denominator is not 4 (V1 restriction)

**Example**:
```songcode
@time 6/8      ← ERROR: Denominator must be 4 in V1
```

**Fix**: Use denominator 4
```songcode
@time 3/4      ← OK
@time 6/4      ← OK (represents 6 quarter notes per measure)
```

**Note**: In V1, only quarter-note time signatures are supported.

---

## Modifier Issues

### 🔍 "`_before` with pattern variable"

**Error**: Using `$n` in `_before` or `_after`

**Example**:
```songcode
Verse
$1
_before $2     ← ERROR: Pattern variables not allowed
--
Lyrics
```

**Fix**: Write pattern explicitly
```songcode
Verse
$1
_before Am;D;G     ← OK: Explicit chords
--
Lyrics
```

**Why**: `_before` and `_after` only accept inline patterns, not pattern references.

---

### 🔍 "`_before` with line break"

**Error**: Using `:` in `_before` or `_after`

**Example**:
```songcode
Verse
$1
_before A;G:D;E    ← ERROR: Line breaks not allowed
--
Lyrics
```

**Fix**: Remove line break
```songcode
Verse
$1
_before A;G;D;E    ← OK
--
Lyrics
```

**Why**: `_before` and `_after` are single-line only.

---

### 🔍 "`_repeat` with value 1"

**Error**: `_repeat 1` is redundant/invalid

**Example**:
```songcode
$1
_repeat 1      ← ERROR: Minimum is 2
```

**Fix**: Remove modifier or use ≥ 2
```songcode
$1             ← OK: Play once (default)

# OR

$1
_repeat 2      ← OK: Play twice
```

---

## Time Signature Problems

### 🔍 "Beats don't divide evenly"

**Error**: Chord positions don't fit time signature

**Example in 4/4**:
```songcode
@time 4/4

Verse
A D E          ← 3 positions: 4 ÷ 3 = 1.33 beats each (ERROR)
```

**Fix**: Use positions that divide evenly
```songcode
@time 4/4

Verse
A D E F        ← 4 positions: 4 ÷ 4 = 1 beat each (OK)
```

**Valid 4/4 configurations**:
- 1 position = 4 beats each
- 2 positions = 2 beats each
- 4 positions = 1 beat each

---

**Example in 3/4**:
```songcode
@time 3/4

Verse
A D            ← 2 positions: 3 ÷ 2 = 1.5 beats each (ERROR)
```

**Fix**:
```songcode
@time 3/4

Verse
A D E          ← 3 positions: 3 ÷ 3 = 1 beat each (OK)
```

**Valid 3/4 configurations**:
- 1 position = 3 beats
- 3 positions = 1 beat each

---

### 🔍 "Remover with time signature"

**Complex case**: Remover in non-4/4 time

**Example**:
```songcode
@time 3/4

Verse
A D =          ← 3 positions in 3/4: each = 1 beat
               ← Remove 1 beat: 3 - 1 = 2 beats total
```

**Rule**: Each `=` removes (beats per position) beats

**More examples**:
```songcode
# 4/4 time
A =            ← 2 positions: 4÷2 = 2 beats each
               ← Remove 2 beats: total = 2 beats

A D G =        ← 4 positions: 4÷4 = 1 beat each
               ← Remove 1 beat: total = 3 beats
```

---

## Reading Error Messages

### Error Message Format

```
[ERROR TYPE]: [Description]
Line [N]: [Context]
Expected: [What should be]
Fix: [Suggestion]
```

### Common Error Codes

**E1.1.x - Metadata errors**
- Check metadata is at file start
- Check key names are valid
- Check value ranges

**E1.2.x - Pattern errors**
- Check patterns are consecutive
- Check pattern references exist
- Check for circular references

**E1.3.x - Section errors**
- Check section format (name, --, lyrics)
- Check modifier syntax
- Check pattern references

**E2.x.x - Pattern transformation errors**
- Check pattern syntax (loops, chords)
- Check chord notation

**E3.x.x - Validation errors**
- Check measure counts
- Check time signatures
- Check lyric timing

**Full catalog**: See [Parser Spec - Error Catalog](parser-generator-specification.md#comprehensive-error-catalog)

---

## Debugging Workflows

### 🔍 Workflow 1: "My song won't parse"

1. **Check file structure**
   - Metadata at top (if any)
   - Pattern definitions next (if any)
   - Sections last
   - Empty lines separate blocks

2. **Check each section**
   - Has section name
   - Has `--` if lyrics present
   - No empty lines within section

3. **Check patterns**
   - All defined before sections
   - No forward references
   - No circular references

4. **Read error message**
   - Note line number
   - Check that line and surrounding context
   - Apply suggested fix

---

### 🔍 Workflow 2: "Timing is wrong"

1. **Calculate base pattern measures**
   ```
   Count semicolons + 1
   Or count measures if complex loops
   ```

2. **Apply all modifiers in order**
   ```
   1. _repeat
   2. _cutStart
   3. _cutEnd
   4. _before
   5. _after
   ```

3. **Sum lyric measure counts**
   ```
   Add all _n values
   ```

4. **Compare**
   ```
   Pattern measures = Lyric sum?
   If not → adjust lyrics or pattern
   ```

5. **Check all-or-nothing rule**
   ```
   All lyrics have _n OR none do
   ```

---

### 🔍 Workflow 3: "Pattern isn't working as expected"

1. **Verify pattern is defined**
   ```
   Search for $n in pattern definitions
   ```

2. **Check pattern content**
   ```
   Is syntax correct?
   Are chords spelled correctly?
   Are loops correct?
   ```

3. **Check section modifiers**
   ```
   Does section have _repeat, _cutEnd, etc?
   These change how pattern is used
   ```

4. **Manually expand pattern**
   ```
   Write out what pattern should produce
   Apply modifiers step-by-step
   Compare with expected behavior
   ```

---

### 🔍 Workflow 4: "Parser accepts it, but output is wrong"

1. **Validate you're using correct parser**
   ```
   Check parser version matches spec
   ```

2. **Check JSON output**
   ```
   Look at patterns object
   Look at sections array
   Are pattern IDs correct?
   Are measures calculated correctly?
   ```

3. **Trace through phases**
   ```
   Phase 1: Input parsed correctly?
   Phase 2: Patterns transformed correctly?
   Phase 3: Validation passed?
   Phase 4: Prompter looks correct?
   ```

4. **Compare with Highway to Hell example**
   ```
   See convertion-examples/highway-to-hell/
   Is your case similar?
   What's different?
   ```

---

## Quick Diagnostic Checklist

Use this checklist when something goes wrong:

**File Structure**:
- [ ] Metadata at top (if present)
- [ ] Pattern definitions before sections
- [ ] Sections separated by empty lines
- [ ] No empty lines within blocks

**Syntax**:
- [ ] All sections have `--` before lyrics
- [ ] No spaces in chord names (unless intentional)
- [ ] Patterns use `;` to separate measures
- [ ] Pattern variables defined before use

**Timing**:
- [ ] Measure counts match pattern length
- [ ] All lyrics have `_n` or none do
- [ ] Modifiers applied in correct order
- [ ] Cut values don't exceed pattern length

**Patterns**:
- [ ] No circular references
- [ ] No forward references
- [ ] Reference depth ≤ 1
- [ ] Pattern numbers exist in definitions

**Time Signatures**:
- [ ] Denominator is 4 (V1 restriction)
- [ ] Chord positions divide evenly into numerator
- [ ] Removers respect beats per position

**Modifiers**:
- [ ] `_repeat` value ≥ 2
- [ ] `_before`/`_after` don't use pattern variables
- [ ] `_before`/`_after` don't use line breaks
- [ ] Cut notation is valid ([m[-b]])

---

## Still Stuck?

1. **Re-read the error message carefully**
   - Line numbers are accurate
   - Fix suggestions are helpful
   - Context shows what's wrong

2. **Start with a minimal example**
   - Remove sections until it works
   - Add back one section at a time
   - Find which section causes the problem

3. **Check the examples**
   - [Quick Start Tutorial](songcode-quick-start-tutorial.md)
   - [Highway to Hell example](convertion-examples/highway-to-hell/)
   - [Quick Reference Card](quick-reference-card.md)

4. **Consult the full documentation**
   - [Language Reference](songcode-language-reference.md) - Full syntax
   - [Parser Specification](parser-generator-specification.md) - How it works
   - [INDEX](INDEX.md) - Navigate all docs

---

**Remember**: The parser is very precise. Small syntax issues cause clear error messages. Read the error, check the line number, and apply the fix!

**Last Updated**: February 11, 2026
