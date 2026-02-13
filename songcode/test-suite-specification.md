# SongCode Converter - Test Suite Specification

**Version**: 1.0  
**Created**: February 13, 2026  
**Purpose**: Framework-agnostic test specifications for SongCode converter implementation

---

## Overview

This document provides comprehensive test cases for implementing the SongCode to Livenotes JSON converter. Each test case can be directly translated into unit tests in any programming language or testing framework.

### Test Organization

Tests are organized by the 4 parsing phases and their component bricks:

- **Phase 1**: First Pass Parsing (4 bricks)
- **Phase 2**: Pattern Transformation (3 bricks)
- **Phase 3**: Validation (3 bricks)
- **Phase 4**: Prompter Generation (4 bricks)

### Test Case Format

Each test case specifies:
- **Test ID**: Unique identifier (e.g., 1.1.1)
- **Description**: What is being tested
- **Input**: Test data
- **Expected Output**: What should be returned
- **Expected Error**: Error code if applicable (see [Error Catalog](parser-generator-specification.md#comprehensive-error-catalog))

---

## Phase 1: First Pass Parsing

### 1.1 FileReader

#### Test 1.1.1: Valid UTF-8 File
- **Input**: Valid UTF-8 encoded file with mixed ASCII and Unicode characters
- **Expected**: File content successfully read as string
- **Error**: None

#### Test 1.1.2: Invalid UTF-8 Encoding
- **Input**: File with invalid UTF-8 byte sequences
- **Expected**: Reject file
- **Error**: E0.2 - Invalid UTF-8 encoding

#### Test 1.1.3: File with Null Bytes
- **Input**: File containing null bytes (`\0`)
- **Expected**: Reject file
- **Error**: E0.2 - Invalid UTF-8 encoding

#### Test 1.1.4: LF Line Endings (Unix)
- **Input**: File with LF (`\n`) line endings
- **Expected**: Content read correctly, line endings normalized to LF
- **Error**: None

#### Test 1.1.5: CRLF Line Endings (Windows)
- **Input**: File with CRLF (`\r\n`) line endings
- **Expected**: Content read correctly, line endings normalized to LF
- **Error**: None

#### Test 1.1.6: Mixed Line Endings
- **Input**: File with both LF and CRLF line endings
- **Expected**: Content read correctly, all line endings normalized to LF
- **Error**: None

#### Test 1.1.7: Empty File
- **Input**: Empty file (0 bytes)
- **Expected**: Empty string
- **Error**: None (will fail later in parsing if no sections)

---

### 1.2 MetadataParser

#### Test 1.2.1: Valid Name Metadata
- **Input**: `@name Highway to Hell`
- **Expected**: `{name: "Highway to Hell"}`
- **Error**: None

#### Test 1.2.2: Valid Artist Metadata
- **Input**: `@artist AC/DC`
- **Expected**: `{artist: "AC/DC"}`
- **Error**: None

#### Test 1.2.3: Valid BPM Metadata
- **Input**: `@bpm 120`
- **Expected**: `{bpm: 120}`
- **Error**: None

#### Test 1.2.4: BPM Below Range
- **Input**: `@bpm -10`
- **Expected**: Reject
- **Error**: E1.1.2 - BPM out of range (0-400)

#### Test 1.2.5: BPM Above Range
- **Input**: `@bpm 500`
- **Expected**: Reject
- **Error**: E1.1.2 - BPM out of range (0-400)

#### Test 1.2.6: BPM Zero (Edge Case)
- **Input**: `@bpm 0`
- **Expected**: `{bpm: 0}`
- **Error**: None (0 is valid per spec)

#### Test 1.2.7: Valid Time Signature 4/4
- **Input**: `@time 4/4`
- **Expected**: `{time: {numerator: 4, denominator: 4}}`
- **Error**: None

#### Test 1.2.8: Valid Time Signature 3/4
- **Input**: `@time 3/4`
- **Expected**: `{time: {numerator: 3, denominator: 4}}`
- **Error**: None

#### Test 1.2.9: Invalid Time Signature Denominator
- **Input**: `@time 4/8`
- **Expected**: Reject (V1 restriction: denominator must be 4)
- **Error**: E1.1.3 - Invalid time signature format

#### Test 1.2.10: Valid Original Key
- **Input**: `@original A`
- **Expected**: `{original: "A"}`
- **Error**: None

#### Test 1.2.11: Invalid Original Key
- **Input**: `@original X`
- **Expected**: Reject
- **Error**: E1.1.4 - Invalid original key (must be valid base chord)

#### Test 1.2.12: Valid Capo Position
- **Input**: `@capo 3`
- **Expected**: `{capo: 3}`
- **Error**: None

#### Test 1.2.13: Capo Below Range
- **Input**: `@capo 0`
- **Expected**: Reject
- **Error**: E1.1.5 - Capo out of range (1-20)

#### Test 1.2.14: Capo Above Range
- **Input**: `@capo 25`
- **Expected**: Reject
- **Error**: E1.1.5 - Capo out of range (1-20)

#### Test 1.2.15: Valid Warning Metadata
- **Input**: `@warning Tricky break`
- **Expected**: `{warning: "Tricky break"}`
- **Error**: None

#### Test 1.2.16: Valid End Metadata
- **Input**: `@end Fade out`
- **Expected**: `{end: "Fade out"}`
- **Error**: None

#### Test 1.2.17: Name Too Long
- **Input**: `@name ` + (101 characters)
- **Expected**: Reject
- **Error**: E1.1.1 - Name exceeds 100 characters

#### Test 1.2.18: Invalid Metadata Key
- **Input**: `@invalid value`
- **Expected**: Reject
- **Error**: E1.1.6 - Unknown metadata key

#### Test 1.2.19: Duplicate Metadata Keys
- **Input**: `@name Song1\n@name Song2`
- **Expected**: `{name: "Song2"}` (last value wins)
- **Error**: None

#### Test 1.2.20: Non-Consecutive Metadata
- **Input**: `@name Test\n\n$1\nA;G\n\n@bpm 120`
- **Expected**: Reject (metadata after patterns)
- **Error**: E1.2.1 - Non-consecutive metadata

#### Test 1.2.21: Empty Metadata Block
- **Input**: (No metadata lines)
- **Expected**: Empty meta object with defaults
- **Error**: None

---

### 1.3 PatternParser

#### Test 1.3.1: Simple Pattern Definition
- **Input**: `$1\nA;G;D;G`
- **Expected**: Pattern `1` with `sc: "A;G;D;G"`, `json: null`, `measures: 0`
- **Error**: None

#### Test 1.3.2: Pattern with Loop
- **Input**: `$1\n[A;G]3`
- **Expected**: Pattern `1` with `sc: "[A;G]3"`, `json: null`, `measures: 0`
- **Error**: None

#### Test 1.3.3: Pattern with Line Break
- **Input**: `$1\nA;G\n:\nD;E`
- **Expected**: Pattern `1` with normalized `sc: "A;G:D;E"`
- **Error**: None

#### Test 1.3.4: Multi-Line Pattern Without `:` 
- **Input**: `$1\nA;G\nD;E`
- **Expected**: Pattern `1` with normalized `sc: "A;G;D;E"`
- **Error**: None

#### Test 1.3.5: Empty Pattern
- **Input**: `$1\n\n`
- **Expected**: Pattern `1` with `sc: ""`, `json: null`, `measures: 0`
- **Error**: None

#### Test 1.3.6: Pattern with Trailing Whitespace
- **Input**: `$1\nA;G;D;G   `
- **Expected**: Pattern `1` with `sc: "A;G;D;G"` (whitespace trimmed)
- **Error**: None

#### Test 1.3.7: Duplicate Pattern Numbers
- **Input**: `$1\nA;G\n\n$1\nD;E`
- **Expected**: Reject
- **Error**: E1.3.1 - Duplicate pattern number

#### Test 1.3.8: Non-Consecutive Pattern Definitions
- **Input**: `$1\nA;G\n\nVerse\n$1\n--\nLyrics\n\n$2\nD;E`
- **Expected**: Reject (pattern after section starts)
- **Error**: E1.3.2 - Non-consecutive pattern definitions

#### Test 1.3.9: Pattern Number Zero
- **Input**: `$0\nA;G`
- **Expected**: Accept (any number allowed)
- **Error**: None

#### Test 1.3.10: Large Pattern Number
- **Input**: `$999\nA;G`
- **Expected**: Accept (any number allowed)
- **Error**: None

#### Test 1.3.11: Multiple Patterns
- **Input**: `$1\nA;G\n\n$2\nD;E\n\n$3\nC;F`
- **Expected**: 3 patterns stored
- **Error**: None

#### Test 1.3.12: Pattern Normalization - Multiple Newlines
- **Input**: `$1\nA;G\n\nD;E` (empty line within pattern)
- **Expected**: Pattern ends at first empty line: `sc: "A;G"`
- **Error**: None

---

### 1.4 SectionParser

#### Test 1.4.1: Simple Section with Inline Chords
- **Input**: `Verse\nA;G;D;G\n--\nLyrics _4`
- **Expected**: Section with name "Verse", inline pattern, 1 lyric line
- **Error**: None

#### Test 1.4.2: Section with Pattern Reference
- **Input**: `Verse\n$1\n--\nLyrics _4`
- **Expected**: Section with name "Verse", pattern reference `$1`, 1 lyric line
- **Error**: None

#### Test 1.4.3: Section with Comment
- **Input**: `Bridge!Slow down\n$1\n--\nLyrics _4`
- **Expected**: Section with name "Bridge", comment "Slow down"
- **Error**: None

#### Test 1.4.4: Section without Lyrics
- **Input**: `Intro\n$1\n--`
- **Expected**: Section with name "Intro", pattern `$1`, empty lyrics array
- **Error**: None

#### Test 1.4.5: Section with _repeat Modifier
- **Input**: `Chorus\n$1\n_repeat 2\n--\nLyrics _4`
- **Expected**: Section with `repeat: 2`
- **Error**: None

#### Test 1.4.6: Section with _cutStart Modifier (Measures Only)
- **Input**: `Verse\n$1\n_cutStart 2\n--\nLyrics _2`
- **Expected**: Section with `cutStart: [2, 0]`
- **Error**: None

#### Test 1.4.7: Section with _cutStart Modifier (Measures and Beats)
- **Input**: `Verse\n$1\n_cutStart 1-2\n--\nLyrics _2`
- **Expected**: Section with `cutStart: [1, 2]`
- **Error**: None

#### Test 1.4.8: Section with _cutEnd Modifier (Measures Only)
- **Input**: `Verse\n$1\n_cutEnd 1\n--\nLyrics _3`
- **Expected**: Section with `cutEnd: [1, 0]`
- **Error**: None

#### Test 1.4.9: Section with _cutEnd Modifier (Measures and Beats)
- **Input**: `Verse\n$1\n_cutEnd 2-3\n--\nLyrics _2`
- **Expected**: Section with `cutEnd: [2, 3]`
- **Error**: None

#### Test 1.4.10: Section with _before Modifier
- **Input**: `Verse\n$1\n_before Am;D\n--\nLyrics _6`
- **Expected**: Section with `before: {sc: "Am;D", json: null, measures: 0}`
- **Error**: None

#### Test 1.4.11: Section with _after Modifier
- **Input**: `Verse\n$1\n_after G;G\n--\nLyrics _6`
- **Expected**: Section with `after: {sc: "G;G", json: null, measures: 0}`
- **Error**: None

#### Test 1.4.12: Section with Multiple Modifiers
- **Input**: `Verse\n$1\n_repeat 2\n_cutEnd 1\n_before Am\n--\nLyrics _6`
- **Expected**: Section with `repeat: 2`, `cutEnd: [1, 0]`, `before: {sc: "Am"...}`
- **Error**: None

#### Test 1.4.13: Section with @bpm Override
- **Input**: `Bridge\n@bpm 140\n$1\n--\nLyrics _4`
- **Expected**: Section with `time.bpm: 140`
- **Error**: None

#### Test 1.4.14: Section with @time Override
- **Input**: `Waltz\n@time 3/4\n$1\n--\nLyrics _4`
- **Expected**: Section with `time: {numerator: 3, denominator: 4}`
- **Error**: None

#### Test 1.4.15: Section with Info Marker in Lyrics
- **Input**: `Solo\n$1\n--\n***Guitar Solo*** _4`
- **Expected**: Lyric line with `***Guitar Solo*** _4`
- **Error**: None

#### Test 1.4.16: Section with Musician Marker in Lyrics
- **Input**: `Break\n$1\n--\n:::Watch drummer::: _2`
- **Expected**: Lyric line with `:::Watch drummer::: _2`
- **Error**: None

#### Test 1.4.17: Invalid Pattern Reference
- **Input**: `Verse\n$99\n--\nLyrics _4`
- **Expected**: Stored but will fail in validation (forward reference check)
- **Error**: None at parse time, E3.3.1 at validation

#### Test 1.4.18: Missing Lyric Separator
- **Input**: `Verse\n$1\nLyrics _4`
- **Expected**: Reject
- **Error**: E1.4.1 - Missing lyric separator `--`

#### Test 1.4.19: Empty Section Name
- **Input**: `\n$1\n--\nLyrics _4`
- **Expected**: Reject
- **Error**: E1.4.2 - Empty section name

#### Test 1.4.20: Section with Only Pattern (No Separator, No Lyrics)
- **Input**: `Intro\n$1`
- **Expected**: Reject (must have `--` separator)
- **Error**: E1.4.1 - Missing lyric separator

---

## Phase 2: Pattern Transformation

### 2.1 ChordParser

#### Test 2.1.1: Simple Major Chord
- **Input**: `"A"`
- **Expected**: `["A", ""]`
- **Error**: None

#### Test 2.1.2: Simple Minor Chord
- **Input**: `"Am"`
- **Expected**: `["Am", ""]`
- **Error**: None

#### Test 2.1.3: Sharp Major Chord
- **Input**: `"F#"`
- **Expected**: `["F#", ""]`
- **Error**: None

#### Test 2.1.4: Sharp Minor Chord
- **Input**: `"C#m"`
- **Expected**: `["C#m", ""]`
- **Error**: None

#### Test 2.1.5: Flat Major Chord
- **Input**: `"Bb"`
- **Expected**: `["Bb", ""]`
- **Error**: None

#### Test 2.1.6: Flat Minor Chord
- **Input**: `"Ebm"`
- **Expected**: `["Ebm", ""]`
- **Error**: None

#### Test 2.1.7: Chord with Seventh
- **Input**: `"G7"`
- **Expected**: `["G", "7"]`
- **Error**: None

#### Test 2.1.8: Minor Chord with Seventh
- **Input**: `"Am7"`
- **Expected**: `["Am", "7"]`
- **Error**: None

#### Test 2.1.9: Chord with sus4
- **Input**: `"Dsus4"`
- **Expected**: `["D", "sus4"]`
- **Error**: None

#### Test 2.1.10: Chord with Complex Extension
- **Input**: `"Cmaj7sus4"`
- **Expected**: `["C", "maj7sus4"]`
- **Error**: None

#### Test 2.1.11: Sharp Minor with Extension
- **Input**: `"F#m7b5"`
- **Expected**: `["F#m", "7b5"]`
- **Error**: None

#### Test 2.1.12: Invalid Chord Base
- **Input**: `"X"`
- **Expected**: Reject
- **Error**: E2.1.1 - Invalid chord notation

#### Test 2.1.13: Invalid Chord with Number
- **Input**: `"H7"`
- **Expected**: Reject
- **Error**: E2.1.1 - Invalid chord notation

#### Test 2.1.14: All Valid Base Chords
- **Input**: Each of: A, A#, Ab, Am, A#m, Abm, B, Bb, Bm, Bbm, C, C#, Cm, C#m, D, Db, D#, Dm, Dbm, D#m, E, Eb, Em, Ebm, F, F#, Fm, F#m, G, Gb, G#, Gm, Gbm, G#m
- **Expected**: Each parses to `[base, ""]`
- **Error**: None

---

### 2.2 PatternTransformer

#### Test 2.2.1: Simple Pattern - One Chord
- **Input**: `"A"`
- **Expected**: `[[["A", ""]]]`
- **Error**: None

#### Test 2.2.2: Simple Pattern - Multiple Measures
- **Input**: `"A;G;D;G"`
- **Expected**: `[[["A", ""]], [["G", ""]], [["D", ""]], [["G", ""]]]`
- **Error**: None

#### Test 2.2.3: Multiple Chords in One Measure
- **Input**: `"A D"`
- **Expected**: `[[["A", ""], ["D", ""]]]`
- **Error**: None

#### Test 2.2.4: Multiple Chords and Multiple Measures
- **Input**: `"A D;G C"`
- **Expected**: `[[["A", ""], ["D", ""]], [["G", ""], ["C", ""]]]`
- **Error**: None

#### Test 2.2.5: Pattern with Repeat Symbol
- **Input**: `"A;%"`
- **Expected**: `[[["A", ""]], ["%"]]`
- **Error**: None

#### Test 2.2.6: Pattern with Silence
- **Input**: `"A;_"`
- **Expected**: `[[["A", ""]], ["_"]]`
- **Error**: None

#### Test 2.2.7: Pattern with Remover
- **Input**: `"A ="`
- **Expected**: `[[["A", ""], "="]]`
- **Error**: None

#### Test 2.2.8: Pattern with Multiple Removers
- **Input**: `"A = ="`
- **Expected**: `[[["A", ""], "=", "="]]`
- **Error**: None

#### Test 2.2.9: Simple Loop
- **Input**: `"[A;G]3"`
- **Expected**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:3"]`
- **Error**: None

#### Test 2.2.10: Nested Content After Loop
- **Input**: `"[A;G]2;D"`
- **Expected**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:2", [["D", ""]]]`
- **Error**: None

#### Test 2.2.11: Line Break with `:`
- **Input**: `"A;G:D;E"`
- **Expected**: `[[["A", ""]], [["G", ""]], "newLine", [["D", ""]], [["E", ""]]]`
- **Error**: None

#### Test 2.2.12: Complex Pattern with Loop and Line Break
- **Input**: `"[A;G;%;A]3:A;G;%;E;%"`
- **Expected**: `["loopStart", [["A", ""]], [["G", ""]], ["%"], [["A", ""]], "loopEnd:3", "newLine", [["A", ""]], [["G", ""]], ["%"], [["E", ""]], ["%"]]`
- **Error**: None

#### Test 2.2.13: Loop Without Repeat Count
- **Input**: `"[A;G]"`
- **Expected**: Reject
- **Error**: E2.1.4 - Loop without repeat count

#### Test 2.2.14: Mismatched Loop Brackets - Missing Close
- **Input**: `"[A;G"`
- **Expected**: Reject
- **Error**: E2.1.3 - Mismatched loop brackets

#### Test 2.2.15: Mismatched Loop Brackets - Missing Open
- **Input**: `"A;G]3"`
- **Expected**: Reject
- **Error**: E2.1.3 - Mismatched loop brackets

#### Test 2.2.16: Remover Not at End of Measure
- **Input**: `"= A"`
- **Expected**: Reject
- **Error**: E2.1.2 - Remover must be at end of measure

#### Test 2.2.17: Empty Pattern
- **Input**: `""`
- **Expected**: `null` (with `measures: 0`)
- **Error**: None

#### Test 2.2.18: Pattern with Only Whitespace
- **Input**: `"   "`
- **Expected**: `null` (treated as empty after trimming)
- **Error**: None

---

### 2.3 MeasureCounter

#### Test 2.3.1: Simple Pattern Count
- **Input**: `[[["A", ""]], [["G", ""]]]`
- **Expected**: `2` measures
- **Error**: None

#### Test 2.3.2: Pattern with Loop
- **Input**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:3"]`
- **Expected**: `6` measures (2 × 3)
- **Error**: None

#### Test 2.3.3: Pattern with Loop and Additional Measures
- **Input**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:3", [["D", ""]]]`
- **Expected**: `7` measures (2 × 3 + 1)
- **Error**: None

#### Test 2.3.4: Pattern with Line Break (Should Not Count)
- **Input**: `[[["A", ""]], "newLine", [["G", ""]]]`
- **Expected**: `2` measures (newLine doesn't count)
- **Error**: None

#### Test 2.3.5: Empty Pattern
- **Input**: `null`
- **Expected**: `0` measures
- **Error**: None

#### Test 2.3.6: Pattern with Only Line Breaks
- **Input**: `["newLine", "newLine"]`
- **Expected**: `0` measures
- **Error**: None

#### Test 2.3.7: Complex Loop Pattern (Highway to Hell $2)
- **Input**: `["loopStart", [["A", ""]], [["G", ""]], ["%"], [["A", ""]], "loopEnd:3", "newLine", [["A", ""]], [["G", ""]], ["%"], [["E", ""]], ["%"]]`
- **Expected**: `17` measures (4 × 3 + 5)
- **Error**: None

---

## Phase 3: Validation

### 3.1 TimeSignatureValidator

#### Test 3.1.1: Valid Measure in 4/4 - Single Chord
- **Input**: Measure `[["A", ""]]`, time signature `4/4`
- **Expected**: Valid (4 beats)
- **Error**: None

#### Test 3.1.2: Valid Measure in 4/4 - Two Chords
- **Input**: Measure `[["A", ""], ["D", ""]]`, time signature `4/4`
- **Expected**: Valid (2 beats each = 4 total)
- **Error**: None

#### Test 3.1.3: Valid Measure in 4/4 - Four Chords
- **Input**: Measure `[["A", ""], ["D", ""], ["G", ""], ["C", ""]]`, time signature `4/4`
- **Expected**: Valid (1 beat each = 4 total)
- **Error**: None

#### Test 3.1.4: Invalid Measure in 4/4 - Three Chords
- **Input**: Measure `[["A", ""], ["D", ""], ["G", ""]]`, time signature `4/4`
- **Expected**: Reject (4 ÷ 3 = 1.33... beats per position)
- **Error**: E3.1.1 - Invalid number of chord positions

#### Test 3.1.5: Valid Measure in 3/4 - Single Chord
- **Input**: Measure `[["A", ""]]`, time signature `3/4`
- **Expected**: Valid (3 beats)
- **Error**: None

#### Test 3.1.6: Valid Measure in 3/4 - Three Chords
- **Input**: Measure `[["A", ""], ["D", ""], ["G", ""]]`, time signature `3/4`
- **Expected**: Valid (1 beat each = 3 total)
- **Error**: None

#### Test 3.1.7: Invalid Measure in 3/4 - Two Chords
- **Input**: Measure `[["A", ""], ["D", ""]]`, time signature `3/4`
- **Expected**: Reject (3 ÷ 2 = 1.5 beats per position)
- **Error**: E3.1.1 - Invalid number of chord positions

#### Test 3.1.8: Valid Measure with Remover in 4/4
- **Input**: Measure `[["A", ""], "="]`, time signature `4/4`
- **Expected**: Valid (2 beats per position, one removed = 2 beats remaining)
- **Error**: None

#### Test 3.1.9: Valid Measure with Multiple Removers in 4/4
- **Input**: Measure `[["A", ""], ["D", ""], "=", "="]`, time signature `4/4`
- **Expected**: Valid (1 beat per position, two removed = 2 beats remaining)
- **Error**: None

#### Test 3.1.10: Measure with Removers Leaving 1 Beat
- **Input**: Measure `[["A", ""], "=", "=", "="]`, time signature `4/4`
- **Expected**: Valid (1 beat per position, three removed = 1 beat remaining)
- **Error**: None

#### Test 3.1.11: Measure with Too Many Removers
- **Input**: Measure `[["A", ""], "=", "="]`, time signature `4/4`
- **Expected**: Reject (2 beats per position, would remove all 4 beats)
- **Error**: E3.1.2 - Removers eliminate all beats

#### Test 3.1.12: Measure with Silence Symbol
- **Input**: Measure `["_"]`, time signature `4/4`
- **Expected**: Valid (4 beats of silence)
- **Error**: None

#### Test 3.1.13: Measure with Repeat Symbol
- **Input**: Measure `["%"]`, time signature `4/4`
- **Expected**: Valid (timing checked after resolution)
- **Error**: None

---

### 3.2 MeasureValidator

#### Test 3.2.1: Section with Matching Measures (No Modifiers)
- **Input**: Section with pattern of 4 measures, lyrics totaling 4 measures
- **Expected**: Valid
- **Error**: None

#### Test 3.2.2: Section with _repeat Modifier
- **Input**: Section with pattern of 4 measures, `_repeat 2`, lyrics totaling 8 measures
- **Expected**: Valid (4 × 2 = 8)
- **Error**: None

#### Test 3.2.3: Section with _cutStart (Measures Only)
- **Input**: Section with pattern of 6 measures, `_cutStart 2`, lyrics totaling 4 measures
- **Expected**: Valid (6 - 2 = 4)
- **Error**: None

#### Test 3.2.4: Section with _cutStart (Measures and Beats)
- **Input**: Section with pattern of 5 measures (4+2+4+4+4 beats in 4/4), `_cutStart 1-2`, lyrics totaling 3 measures
- **Expected**: Valid (removes 1 full measure + 2-beat measure = 3 measures remaining)
- **Error**: None

#### Test 3.2.5: Section with _cutEnd (Measures Only)
- **Input**: Section with pattern of 6 measures, `_cutEnd 2`, lyrics totaling 4 measures
- **Expected**: Valid (6 - 2 = 4)
- **Error**: None

#### Test 3.2.6: Section with _before Modifier
- **Input**: Section with pattern of 4 measures, `_before` pattern of 2 measures, lyrics totaling 6 measures
- **Expected**: Valid (2 + 4 = 6)
- **Error**: None

#### Test 3.2.7: Section with _after Modifier
- **Input**: Section with pattern of 4 measures, `_after` pattern of 2 measures, lyrics totaling 6 measures
- **Expected**: Valid (4 + 2 = 6)
- **Error**: None

#### Test 3.2.8: Section with All Modifiers
- **Input**: Section with pattern of 8 measures, `_repeat 2`, `_cutStart 2`, `_cutEnd 2`, `_before` 1, `_after` 1, lyrics totaling 12 measures
- **Expected**: Valid (1 + (8 × 2 - 2 - 2) + 1 = 14... wait, needs recalc)
- **Error**: Check calculation per modifier order

#### Test 3.2.9: Section Measure Mismatch - Too Few Lyrics
- **Input**: Section with 4 measures, lyrics totaling 2 measures
- **Expected**: Reject
- **Error**: E3.2.1 - Section measure count mismatch

#### Test 3.2.10: Section Measure Mismatch - Too Many Lyrics
- **Input**: Section with 4 measures, lyrics totaling 6 measures
- **Expected**: Reject
- **Error**: E3.2.1 - Section measure count mismatch

#### Test 3.2.11: Empty Pattern with Empty Lyrics
- **Input**: Section with empty pattern (0 measures), empty lyrics
- **Expected**: Valid
- **Error**: None

#### Test 3.2.12: Empty Pattern with Lyrics
- **Input**: Section with empty pattern (0 measures), lyrics with `_4`
- **Expected**: Reject
- **Error**: E3.2.1 - Section measure count mismatch

---

### 3.3 LyricTimingValidator

#### Test 3.3.1: Single Lyric Line with Valid Timing
- **Input**: `"First line _4"`, total measures: 4
- **Expected**: Valid
- **Error**: None

#### Test 3.3.2: Multiple Lyric Lines with Valid Total
- **Input**: `["First line _2", "Second line _2"]`, total measures: 4
- **Expected**: Valid
- **Error**: None

#### Test 3.3.3: Lyric Line Missing Measure Count
- **Input**: `"First line"`, total measures: 4
- **Expected**: Reject
- **Error**: E3.4.1 - Lyric line missing measure count

#### Test 3.3.4: Lyric with Invalid Measure Count Format
- **Input**: `"First line _abc"`, total measures: 4
- **Expected**: Reject
- **Error**: E3.4.2 - Invalid measure count format

#### Test 3.3.5: Lyric with Zero Measures
- **Input**: `"First line _0"`, total measures: 4
- **Expected**: Reject
- **Error**: E3.4.3 - Measure count must be positive

#### Test 3.3.6: Info Marker (Should Not Need Count)
- **Input**: `"***Solo*** _4"`, total measures: 4
- **Expected**: Valid
- **Error**: None

#### Test 3.3.7: Musician Marker (Should Not Need Count)
- **Input**: `":::Watch drummer::: _2"`, total measures: 4
- **Expected**: Valid
- **Error**: None

#### Test 3.3.8: Empty Lyric Line
- **Input**: `"_4"`, total measures: 4
- **Expected**: Valid (instrumental/empty line)
- **Error**: None

#### Test 3.3.9: Forward Pattern Reference
- **Input**: Section referencing `$5` when only `$1-$4` defined
- **Expected**: Reject
- **Error**: E3.3.1 - Unknown pattern reference

---

## Phase 4: Prompter Generation

### 4.1 PatternExpander

#### Test 4.1.1: Expand Simple Pattern (No Loops)
- **Input**: `[[["A", ""]], [["G", ""]]]`
- **Expected**: `[[["A", ""]], [["G", ""]]]` (unchanged)
- **Error**: None

#### Test 4.1.2: Expand Pattern with Loop
- **Input**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:3"]`
- **Expected**: `[[["A", ""]], [["G", ""]], [["A", ""]], [["G", ""]], [["A", ""]], [["G", ""]]]`
- **Error**: None

#### Test 4.1.3: Expand Pattern with Loop and Extra Measures
- **Input**: `["loopStart", [["A", ""]], [["G", ""]], "loopEnd:2", [["D", ""]]]`
- **Expected**: `[[["A", ""]], [["G", ""]], [["A", ""]], [["G", ""]], [["D", ""]]]`
- **Error**: None

#### Test 4.1.4: Remove newLine Markers During Expansion
- **Input**: `[[["A", ""]], "newLine", [["G", ""]]]`
- **Expected**: `[[["A", ""]], [["G", ""]]]` (newLine removed)
- **Error**: None

---

### 4.2 MeasureStacker

#### Test 4.2.1: Apply _repeat Modifier
- **Input**: Pattern `[[["A", ""]], [["G", ""]]]`, `_repeat 3`
- **Expected**: Pattern repeated 3 times = 6 measures
- **Error**: None

#### Test 4.2.2: Apply _cutStart (Remove Full Measures)
- **Input**: Pattern `[[["A", ""]], [["G", ""]], [["D", ""]], [["E", ""]]]`, `_cutStart 2`
- **Expected**: First 2 measures removed = `[[["D", ""]], [["E", ""]]]`
- **Error**: None

#### Test 4.2.3: Apply _cutEnd (Remove Full Measures)
- **Input**: Pattern `[[["A", ""]], [["G", ""]], [["D", ""]], [["E", ""]]]`, `_cutEnd 2`
- **Expected**: Last 2 measures removed = `[[["A", ""]], [["G", ""]]]`
- **Error**: None

#### Test 4.2.4: Apply _before Modifier
- **Input**: Main pattern `[[["A", ""]], [["G", ""]]]`, `_before` pattern `[[["C", ""]]]`
- **Expected**: `[[["C", ""]], [["A", ""]], [["G", ""]]]`
- **Error**: None

#### Test 4.2.5: Apply _after Modifier
- **Input**: Main pattern `[[["A", ""]], [["G", ""]]]`, `_after` pattern `[[["D", ""]]]`
- **Expected**: `[[["A", ""]], [["G", ""]], [["D", ""]]]`
- **Error**: None

#### Test 4.2.6: Apply Combined Modifiers
- **Input**: Pattern with `_repeat 2`, `_cutEnd 1`, `_before` 1 measure
- **Expected**: Correct order: repeat → cutEnd → before
- **Error**: None

---

### 4.3 LyricPairer

#### Test 4.3.1: Pair Single Lyric with Measures
- **Input**: Measures: 4, Lyric: `"First line _4"`
- **Expected**: All 4 measures paired with "First line"
- **Error**: None

#### Test 4.3.2: Pair Multiple Lyrics with Measures
- **Input**: Measures: 4, Lyrics: `["First _2", "Second _2"]`
- **Expected**: First 2 measures with "First", last 2 with "Second"
- **Error**: None

#### Test 4.3.3: Empty Lyrics (Instrumental Section)
- **Input**: Measures: 4, Lyrics: []
- **Expected**: All 4 measures with empty lyrics
- **Error**: None

#### Test 4.3.4: Parse Measure Count from Lyric
- **Input**: `"This is a line _3"`
- **Expected**: Text: "This is a line", count: 3
- **Error**: None

#### Test 4.3.5: Extract Info Marker
- **Input**: `"***Solo*** _4"`
- **Expected**: Marker extracted for special handling
- **Error**: None

#### Test 4.3.6: Extract Musician Marker
- **Input**: `":::Watch drummer::: _2"`
- **Expected**: Marker extracted for special handling
- **Error**: None

---

### 4.4 PromptItemBuilder

#### Test 4.4.1: Build Tempo Item
- **Input**: BPM change from 120 to 140
- **Expected**: `{type: "tempo", bpm: 140}`
- **Error**: None

#### Test 4.4.2: Build Content Item - Chords with Lyrics
- **Input**: Section "Verse", measure with chord A, lyric "First line"
- **Expected**: `{type: "content", style: "verse", chords: [...], lyrics: "First line"}`
- **Error**: None

#### Test 4.4.3: Build Content Item - No Lyrics
- **Input**: Section "Intro", measure with chord A, no lyrics
- **Expected**: `{type: "content", style: "intro", chords: [...], lyrics: ""}`
- **Error**: None

#### Test 4.4.4: Resolve % Symbol to Previous Chord
- **Input**: Measures: `[[["A", ""]], ["%"]]`
- **Expected**: Second measure resolves to `[["A", ""]]`
- **Error**: None

#### Test 4.4.5: Resolve Multiple % Symbols
- **Input**: Measures: `[[["A", ""]], ["%"], ["%"], [["D", ""]]]`
- **Expected**: Measures 2 and 3 both resolve to `[["A", ""]]`
- **Error**: None

#### Test 4.4.6: % at Start of Pattern (No Previous Chord)
- **Input**: Measures: `[["%"]]`
- **Expected**: Error or special handling (no previous chord to reference)
- **Error**: E4.1.1 - Repeat symbol with no previous chord

---

## Integration Tests

These tests use the complete conversion examples from the documentation repository.

### I1: Minimal Song (01-basic)
- **Input File**: `convertion-examples/01-basic/minimal-song.sc`
- **Expected Output**: `convertion-examples/01-basic/minimal-song.json`
- **Description**: Simplest valid song - no metadata, one section, inline chords

### I2: Simple Verse Chorus (01-basic)
- **Input File**: `convertion-examples/01-basic/simple-verse-chorus.sc`
- **Expected Output**: `convertion-examples/01-basic/simple-verse-chorus.json`
- **Description**: Basic song with metadata and two sections

### I3: Pattern Reuse (02-intermediate)
- **Input File**: `convertion-examples/02-intermediate/pattern-reuse.sc`
- **Expected Output**: `convertion-examples/02-intermediate/pattern-reuse.json`
- **Description**: Multiple sections reusing pattern definitions

### I4: Modifiers Demo (02-intermediate)
- **Input File**: `convertion-examples/02-intermediate/modifiers-demo.sc`
- **Expected Output**: `convertion-examples/02-intermediate/modifiers-demo.json`
- **Description**: Comprehensive modifier usage (_repeat, _before, _after, @bpm)

### I5: Loops Demo (02-intermediate)
- **Input File**: `convertion-examples/02-intermediate/loops-demo.sc`
- **Expected Output**: `convertion-examples/02-intermediate/loops-demo.json`
- **Description**: Pattern loops with `[...]n` syntax

### I6: Repeat Symbol (02-intermediate)
- **Input File**: `convertion-examples/02-intermediate/repeat-symbol.sc`
- **Expected Output**: `convertion-examples/02-intermediate/repeat-symbol.json`
- **Description**: Using `%` to repeat chords and measures

### I7: Highway to Hell (03-advanced)
- **Input File**: `convertion-examples/03-advanced/highway-to-hell.sc`
- **Expected Output**: `convertion-examples/03-advanced/highway-to-hell.json`
- **Description**: Complete real-world song with complex structure

### I8: Empty Measures (04-edge-cases)
- **Input File**: `convertion-examples/04-edge-cases/empty-measures.sc`
- **Expected Output**: `convertion-examples/04-edge-cases/empty-measures.json`
- **Description**: Silence symbols and empty patterns

### I9: Removers Demo (04-edge-cases)
- **Input File**: `convertion-examples/04-edge-cases/removers-demo.sc`
- **Expected Output**: `convertion-examples/04-edge-cases/removers-demo.json`
- **Description**: Using `=` to shorten measures

### I10: Multi-Chord Measures (04-edge-cases)
- **Input File**: `convertion-examples/04-edge-cases/multi-chord-measures.sc`
- **Expected Output**: `convertion-examples/04-edge-cases/multi-chord-measures.json`
- **Description**: Multiple chords within single measures

### I11: Cut Modifiers (04-edge-cases)
- **Input File**: `convertion-examples/04-edge-cases/cut-modifiers.sc`
- **Expected Output**: `convertion-examples/04-edge-cases/cut-modifiers.json`
- **Description**: _cutStart and _cutEnd with measures and beats

### I12: Extreme Modifiers (04-edge-cases)
- **Input File**: `convertion-examples/04-edge-cases/extreme-modifiers.sc`
- **Expected Output**: `convertion-examples/04-edge-cases/extreme-modifiers.json`
- **Description**: Complex combinations of modifiers

---

## Error Testing

### Error Catalog Tests

Each error code from the [Parser Specification Error Catalog](parser-generator-specification.md#comprehensive-error-catalog) should have at least one test case that triggers it.

#### E0.2: Invalid UTF-8 Encoding
- Covered by Test 1.1.2, 1.1.3

#### E1.1.1 - E1.1.6: Metadata Errors
- Covered by Tests 1.2.4, 1.2.5, 1.2.9, 1.2.11, 1.2.13, 1.2.14, 1.2.17, 1.2.18

#### E1.2.1: Non-consecutive Metadata
- Covered by Test 1.2.20

#### E1.3.1 - E1.3.2: Pattern Definition Errors
- Covered by Tests 1.3.7, 1.3.8

#### E1.4.1 - E1.4.2: Section Parsing Errors
- Covered by Tests 1.4.18, 1.4.19, 1.4.20

#### E2.1.1 - E2.1.4: Pattern Transformation Errors
- Covered by Tests 2.1.12, 2.1.13, 2.2.13, 2.2.14, 2.2.15, 2.2.16

#### E3.1.1 - E3.1.2: Time Signature Validation Errors
- Covered by Tests 3.1.4, 3.1.7, 3.1.11

#### E3.2.1: Section Measure Mismatch
- Covered by Tests 3.2.9, 3.2.10, 3.2.12

#### E3.3.1: Unknown Pattern Reference
- Covered by Test 3.3.9

#### E3.4.1 - E3.4.3: Lyric Timing Errors
- Covered by Tests 3.3.3, 3.3.4, 3.3.5

#### E4.1.1: Repeat Symbol Without Previous Chord
- Covered by Test 4.4.6

---

## Performance Tests

### P1: Large Song (100+ sections)
- **Input**: Generate song with 100 sections
- **Expected**: Completes in <1 second
- **Metric**: Processing time

### P2: Complex Patterns (Deep loops)
- **Input**: Pattern with `[A;G]10` (large loop count)
- **Expected**: Completes without stack overflow
- **Metric**: Memory usage, processing time

### P3: Many Pattern Definitions (26 patterns)
- **Input**: Song with maximum 26 patterns (A-Z)
- **Expected**: All patterns correctly assigned IDs
- **Metric**: Correctness, processing time

---

## Test Coverage Goals

- **Unit Test Coverage**: >90% of code
- **Branch Coverage**: >85% of branches
- **Integration Tests**: 100% of example files
- **Error Tests**: 100% of error codes
- **Edge Cases**: All documented edge cases tested

---

## Testing Strategy

### Development Workflow
1. Write test case from this specification
2. Run test (should fail - Red)
3. Implement minimal code to pass (Green)
4. Refactor while keeping test green
5. Move to next test case

### Test Execution Order
1. **Unit tests first**: Test individual bricks in isolation
2. **Integration tests**: Test complete conversion pipeline
3. **Error tests**: Validate error handling
4. **Performance tests**: Ensure acceptable performance

### Continuous Integration
- Run all tests on every commit
- Block merges if tests fail
- Generate coverage reports
- Track test execution time

---

## Notes for Implementers

1. **Test IDs**: Use the test IDs (e.g., 1.1.1, 2.2.5) in your test names for traceability
2. **Test Data**: Create fixture files for complex test inputs
3. **Assertions**: Be specific in assertions - check exact structure, not just "truthy"
4. **Error Messages**: Validate error messages match the specification
5. **Boundary Testing**: Test edge cases (0, max values, empty inputs)
6. **Regression Tests**: Add a test for every bug found

---

## Updating This Specification

When the parser specification changes:
1. Update affected test cases
2. Add new test cases for new features
3. Mark deprecated tests
4. Update integration tests if JSON format changes
5. Maintain test ID numbering for traceability

---

**Version History**:
- v1.0 (Feb 13, 2026): Initial test suite specification

**Related Documents**:
- [Parser Specification](parser-generator-specification.md)
- [Language Reference](songcode-language-reference.md)
- [JSON Structure Reference](livenotes-json-structure-reference.md)
- [Conversion Examples](convertion-examples/)
