# SongCode Documentation Issues & Clarifications Needed

**Created**: February 9, 2026  
**Status**: Working Document  
**Purpose**: Track documentation gaps and ambiguities that need resolution before implementing the converter

---

## ✅ Fixed Issues

### ~~Issue 1: JSON Structure Inconsistencies~~
**Status**: FIXED ✓

### ~~Issue 2: Chord Notation in JSON - Multiple Formats~~
**Status**: FIXED ✓

### ~~Issue 4: Pattern `measures` Count Algorithm Incomplete~~
**Status**: RESOLVED ✓  
Complete algorithm documented for:
- Beat counting with special symbols (`%`, `_`, `=`)
- cutStart/cutEnd measure removal with "lost beats" concept
- Validation rule: integer beats per position
- V1 restriction: only time signature denominator "4" allowed

---

## 🔴 Issue 3: Ambiguous `_before`/`_after` Structure

### Overview
The `_before` and `_after` modifiers are documented but lack critical implementation details across 4 key areas.

---

### 3.1 JSON Structure Format ✅ RESOLVED

**Current Documentation**:
- Parser spec (line 257-260): `{ sc: "pattern_description", json: null, measures: null }`
- JSON structure spec (lines 350-362): Shows complete example with all three properties filled

**ANSWERS**:

1. **When is the `json` property populated?**
   - ✅ **Phase 1**: `sc` key gets pattern description, `json` remains `null`
   - ✅ **Phase 2**: Transform `_before` and `_after` patterns into JSON format (same as Step 2.2)
   - ✅ **Phase 2**: Also calculate `measures` count for `_before` and `_after` patterns

2. **Can `_before`/`_after` patterns use all the same syntax as regular patterns?**
   - ✅ **YES** - Can contain loops: `_before [A;G]3`
   - ❌ **NO** - Cannot contain line breaks: `_before A;G:D;E` is INVALID
   - ✅ **YES** - Can contain `%`, `_`, `=`: `_before A;%;_` is valid
   - ❌ **NO** - Cannot reference pattern variables: `_before $1` is INVALID

**Documentation Updates Needed**:
- [ ] Add explicit Phase 2 transformation step for `_before`/`_after`
- [ ] Document full syntax support table (what's allowed, what's not)
- [ ] Add examples of valid complex `_before`/`_after` patterns
- [ ] Add examples of invalid patterns with error messages

---

### 3.2 Parsing and Validation ✅ RESOLVED

**Current Documentation**:
- Language reference shows simple examples: `_before Am D;E` and `_after D;E`
- Parser spec says "Parse pattern description" but doesn't detail the algorithm

**ANSWERS**:

3. **What's the exact parsing algorithm for `_before`/`_after`?**
   - ✅ **Single-line only**: Everything after `_before` on that line is the pattern
   - ❌ **Invalid**: Multi-line patterns are NOT supported
   
   ```songcode
   # VALID
   _before Am;D G;E
   
   # INVALID (will cause parse error)
   _before Am;D
   G;E
   ```

4. **How do pattern variables work in `_before`/`_after`?**
   - ❌ **NOT SUPPORTED**: Cannot use pattern variables in `_before`/`_after`
   - ❌ `_before $2` is INVALID and should cause an error
   - Must use inline pattern description only

**Documentation Updates Needed**:
- [ ] Add parsing algorithm: single-line pattern after `_before`/`_after`
- [ ] Add validation rule: no pattern variables allowed in modifiers
- [ ] Add error condition: "Pattern variables not allowed in _before/_after"
- [ ] Add examples showing valid and invalid usage

---

### 3.3 Measure Counting with `_before`/`_after` ✅ RESOLVED

**Current Documentation**:
- Phase 3.2 shows: `section_measures += calculate_measures(pattern.before.json)`
- But the algorithm for `calculate_measures()` on `_before`/`_after` is not detailed

**ANSWERS**:

5. **Do `_before`/`_after` patterns support loops?**
   
   - ✅ **YES** - Loops are supported (confirmed in 3.1/3.2)
   - ✅ Measure counting follows the same algorithm from Step 2.3
   - ✅ `calculate_measures(pattern.before.json)` uses the loop calculation algorithm

6. **What happens with `cutStart`/`cutEnd` and `_before`/`_after`?**
   
   ✅ **ANSWER: Interpretation B - Cut main pattern only**
   
   **Order of operations**:
   1. Start with base pattern measures
   2. Apply `_repeat` modifier
   3. Apply `_cutStart` to the main pattern
   4. Apply `_cutEnd` to the main pattern
   5. Add `_before` measures
   6. Add `_after` measures
   
   **Effective pattern**: `[before] + [pattern with cuts applied] + [after]`
   
   Example:
   ```
   _before A;G     ← 2 measures
   Pattern: D;E;F   ← 3 measures
   _cutStart 1      ← Cuts 1 measure from main pattern = 2 measures left
   _after X;Y      ← 2 measures
   
   Total: 2 + 2 + 2 = 6 measures
   ```

**Documentation Updates Needed**:
- [ ] Update Phase 3.2 algorithm to clarify order of operations
- [ ] Add worked example with all modifiers combined
- [ ] Reference Step 2.3 algorithm for loop calculation in _before/_after

---

### 3.4 Time Signature Validation ✅ RESOLVED

**Current Documentation**:
- Phase 3.1 validates measures fit time signature
- But doesn't explicitly mention validating `_before`/`_after` patterns

**ANSWERS**:

7. **Are `_before`/`_after` patterns validated against time signature?**
   
   ✅ **YES - Absolutely**
   
   - `_before` and `_after` patterns are validated against the effective time signature
   - Same validation rules as main patterns (beats per position must be integer)
   
8. **Can `_before`/`_after` have different time signatures than the main pattern?**
   
   ✅ **NO - They inherit the section's time signature**
   
   **Time signature inheritance rules**:
   - Time signature can only be overridden at the section level
   - `_before` and `_after` inherit the section's effective time signature
   - Effective time signature = section override OR global time signature
   
   Example:
   ```songcode
   @time 4/4       ← Global
   
   Verse
   @time 3/4       ← Section override
   $1              ← Validated in 3/4
   _before A D E   ← Validated in 3/4 (inherits from section)
   _after F G C    ← Validated in 3/4 (inherits from section)
   ```

**Documentation Updates Needed**:
- [ ] Add explicit validation step for `_before`/`_after` patterns in Phase 3.1
- [ ] Document time signature inheritance rules
- [ ] Add examples showing validation with section overrides
- [ ] Add error messages for invalid time signatures in `_before`/`_after`

---

## ✅ Issue 3 Complete

All sub-issues (3.1, 3.2, 3.3, 3.4) have been resolved!

---

## ✅ Issue 4: Pattern `measures` Count Algorithm Incomplete

**Status**: RESOLVED ✓

**Location**: Parser spec Phase 3.2 (lines 500-580)

---

### Beat Counting Algorithm with Special Symbols

**ANSWERS**:

9. **How to identify which measure comes "after" cutStart?**
   
   ✅ **Algorithm: Measure-by-measure removal with "lost beats" concept**
   
   Example with pattern in 4/4 time:
   ```json
   [
       [["A", ""]],        // Measure 1: 4 beats
       [["G", ""], "="],   // Measure 2: 2 beats (after "=")
       [["D", ""]],        // Measure 3: 4 beats
       [["E", ""]]         // Measure 4: 4 beats
   ]
   ```
   
   With `_cutStart [1, 3]`:
   1. Cut 1 complete measure → Remove Measure 1 entirely (4 beats cut)
   2. 3 beats remain to cut
   3. Look at next measure (original Measure 2): has 2 beats
   4. Cut 2 beats (entire measure) → Remove Measure 2 entirely
   5. **1 beat remains to cut but is "lost"** (doesn't carry to next measure)
   6. Final result: Measures 3 and 4 remain intact
   
   **Key principle**: Beats to remove can only affect the current measure. Excess beats are lost, not carried forward.

10. **How to count beats in a measure with special symbols?**
    
    ✅ **Algorithm**:
    
    **Step 1: Get time signature**
    - Denominator = 4: numerator represents **full beats** (quarter notes)
    - **V1 RESTRICTION**: Only denominator "4" is allowed
    - Other denominators (8, 16, etc.) should produce validation error
    
    **Step 2: Calculate beats per position**
    - Formula: `beats_per_position = time_signature_numerator / number_of_positions`
    - Example in 4/4 with 2 positions: 4 ÷ 2 = 2 beats per position
    
    **Step 3: Validate integer beats per position (BEFORE processing "=")**
    - If `beats_per_position` is not an integer → **ERROR**
    - Example: 4/4 with 3 positions → 4 ÷ 3 = 1.33... → ERROR
    - Error message: "Invalid number of positions in measure: beats per position must be a whole number"
    - This validation happens as early as possible in the parsing process
    
    **Step 4: Process "=" symbols**
    - Each "=" symbol removes exactly `beats_per_position` beats from the measure
    - Formula: `measure_beats = time_signature_numerator - (count_of_"=" × beats_per_position)`
    
    **Examples in 4/4 time**:
    
    1. `[["A", ""], "="]` (2 positions)
       - Beats per position: 4 ÷ 2 = 2
       - One "=" removes 2 beats
       - Result: 2 beats in measure ✓
    
    2. `[["A", ""], ["B", ""], "=", "="]` (4 positions)
       - Beats per position: 4 ÷ 4 = 1
       - Two "=" symbols remove 2 beats
       - Result: 2 beats in measure ✓
    
    3. `[["A", ""], "=", "=", "="]` (4 positions)
       - Beats per position: 4 ÷ 4 = 1
       - Three "=" symbols remove 3 beats
       - Result: 1 beat in measure ✓ (valid, no minimum)
    
    4. `[["A", ""], ["B", ""], ["C", ""]]` (3 positions)
       - Beats per position: 4 ÷ 3 = 1.33... ❌ ERROR

---

### cutStart and cutEnd Algorithm

**ANSWERS**:

**cutStart Process** (measure-by-measure from the beginning):
1. Remove `cutStart[0]` complete measures
2. Calculate beats remaining to cut: `beats_to_cut = cutStart[1]`
3. Look at the next measure (first remaining)
4. Calculate measure beats (AFTER "=" processing)
5. If `beats_to_cut >= measure_beats`: remove entire measure
6. Excess beats are "lost" (don't carry to next measure)
7. If `beats_to_cut < measure_beats`: measure stays with reduced beats

**cutEnd Process** (works exactly the same but from the end):
1. Remove `cutEnd[0]` complete measures from the end
2. Calculate beats remaining to cut: `beats_to_cut = cutEnd[1]`
3. Look at the previous measure (last remaining)
4. Calculate measure beats (AFTER "=" processing)
5. If `beats_to_cut >= measure_beats`: remove entire measure
6. Excess beats are "lost" (don't carry to previous measure)
7. If `beats_to_cut < measure_beats`: measure stays with reduced beats

**Example with `_cutEnd [1, 3]`**:
- Pattern: 4 measures (4, 2, 4, 4 beats)
- Remove last measure (Measure 4)
- Cut 3 beats from new last measure (Measure 3 with 4 beats)
- Measure 3 has 1 beat remaining → stays
- Result: 3 measures (4, 2, 1 beats)

---

### Complete Algorithm Summary

**For cutStart/cutEnd calculations**:
1. Always calculate beats AFTER "=" symbols are processed
2. Process measure-by-measure (no beat carry-over)
3. Excess beats are lost at each measure boundary
4. A measure can have as few as 1 beat remaining (no minimum)

**Documentation Updates Needed**:
- [x] Complete algorithm for measure removal with "lost beats" concept
- [x] Beat counting with "=" symbols formula
- [x] Validation rule: integer beats per position (before "=" processing)
- [x] V1 restriction: only time signature denominator "4" allowed
- [x] Step-by-step worked examples for cutStart/cutEnd

---

## ✅ Issue 5: Empty Pattern Handling

**Status**: RESOLVED ✓

**Current Documentation**:
- Parser spec mentions: "Note: a pattern can be empty" (line 238)
- Now fully documented

---

### Complete Specification

**ANSWERS**:

11. **How are empty patterns represented?**
    
    ✅ **ANSWER**: Empty patterns are valid, JSON stays `null`
    
    **In SongCode**:
    ```songcode
    $1
    
    
    Verse
    $1
    ```
    
    **In JSON**:
    ```json
    {
        "sc": "",
        "json": null,
        "measures": 0
    }
    ```
    
    **Use case**: During the writing process, editors can write the song skeleton first and progressively add patterns, lyrics, etc. It's useful to see the song structure early.

12. **How do empty patterns affect measure counting?**
    
    ✅ **ANSWER**: All modifiers are bypassed when pattern is empty
    
    - `measures: 0` (always)
    - `_repeat 3` → bypassed (still 0 measures)
    - `_cutStart` / `_cutEnd` → bypassed (nothing to cut)
    - `_before` / `_after` → bypassed (no main pattern to wrap)
    
    **Key principle**: Empty pattern acts as a placeholder that doesn't affect timing or prompter generation.

13. **Are empty patterns valid, and if so, what's the use case?**
    
    ✅ **ANSWER**: Valid, but should be completed eventually
    
    **Valid use case**: 
    - Writing the song skeleton/structure first
    - Placeholder during composition process
    - Allows progressive development of the song
    
    **NOT for sections with lyrics but no chords**:
    - For lyrics-only sections, use silence symbols: `_` (to track duration)
    - Example: `_; _; _; _` creates 4 measures of silence in 4/4
    - This maintains proper timing and prompter generation
    
    **Example**:
    ```songcode
    Verse (lyrics only, with timing)
    _; _; _; _
    --
    First line _2
    Second line _2
    ```

---

**Documentation Updates Needed**:
- [ ] Add empty pattern handling to Phase 2 transformation
- [ ] Document modifier bypass behavior
- [ ] Add empty pattern examples
- [ ] Clarify difference between empty patterns vs silence patterns
- [ ] Add validation: empty patterns with lyrics require no measure counts

---

## ✅ Issue 6: Whitespace Normalization Algorithm Not Specified

**Status**: RESOLVED ✓

**Location**: Parser spec Phase 1.4, Pattern ID Assignment

**Current Documentation**:
> **Normalization process**: Delete useless whitespaces in each measure (before the first chord, after the last chord, more than 1 space between chords)

**Problem**: Algorithm was too vague - NOW FULLY SPECIFIED

---

### Complete Normalization Algorithm

**ANSWER to Question 14**:

#### A. Whitespace Character Handling

- **Tabs** → Convert to spaces
- **Newlines (`\n`)** → Convert to `;` (new measure separator)
- **Carriage returns (`\r`)** → Convert to `;` (new measure separator)
- All whitespace characters are normalized before pattern comparison

#### B. Normalization Examples

1. **Simple measure**: `"  Am   D  "` → `"Am D"` ✓

2. **Multiple measures**: `"Am D  ;  G   E "` → `"Am D;G E"` ✓

3. **With loops**: `" [  A ; G ] 3  "` → `"[A;G]3"` ✓
   - Remove ALL spaces around special characters

4. **With special symbols**: `"A  %  ;  _   = "` → `"A %;_ ="` ✓

#### C. When Normalization Happens

- **Answer**: Normalized version IS stored in `.sc`
- Normalization happens during Phase 1 pattern parsing
- The stored pattern description in `livenotes.patterns[id].sc` is the normalized version
- Pattern comparison uses these normalized stored values

#### D. Newlines Within Patterns

**Input**:
```
"A D
G E"
```

**Output**: `"A D;G E"`

- **Rule**: Newlines are converted to `;` (measure separator)
- Multi-line pattern descriptions are converted to single-line with semicolons

---

### Step-by-Step Normalization Algorithm

```
function normalizePattern(pattern):
    // Step 1: Character normalization
    pattern = replace_tabs_with_spaces(pattern)
    pattern = replace_newlines_with_semicolons(pattern)  // \n → ;
    pattern = replace_carriage_returns_with_semicolons(pattern)  // \r → ;
    
    // Step 2: Split by measure separator
    measures = split(pattern, ";")
    
    // Step 3: Normalize each measure
    for each measure in measures:
        measure = trim_leading_trailing_spaces(measure)
        measure = collapse_multiple_spaces_to_one(measure)
    
    // Step 4: Rejoin measures
    pattern = join(measures, ";")
    
    // Step 5: Remove spaces around special characters
    pattern = remove_space_after("[")
    pattern = remove_space_before("]")
    pattern = remove_space_between("]" and digit)
    pattern = remove_space_before_and_after(";")
    
    // Step 6: Final trim
    pattern = trim_leading_trailing_spaces(pattern)
    
    return pattern
```

#### Detailed Examples

**Example 1: Multi-line pattern with tabs**
```
Input:  "  A\tD\nG   E  "
Step 1: "  A D\nG   E  "       (tabs → spaces)
Step 1: "  A D;G   E  "        (newlines → ;)
Step 2: ["  A D", "G   E  "]   (split by ;)
Step 3: ["A D", "G E"]          (trim + collapse spaces)
Step 4: "A D;G E"               (rejoin)
Step 5: "A D;G E"               (no special chars to clean)
Step 6: "A D;G E"               (already trimmed)
Output: "A D;G E"
```

**Example 2: Loop with extra spaces**
```
Input:  " [  A ; G ] 3  "
Step 1: " [  A ; G ] 3  "      (no tabs/newlines)
Step 2-4: (no ; at top level, or handle bracket content specially)
Step 5: "[A;G]3"                (remove all spaces around [, ], ;, digit)
Output: "[A;G]3"
```

**Example 3: Complex pattern**
```
Input:  "Am\tD  ;\n  G   E  ;  [ A ; % ] 2  "
Step 1: "Am D  ;  G   E  ;  [ A ; % ] 2  "  (tabs→spaces, newlines→;)
Step 2: ["Am D  ", "  G   E  ", "  [ A ", " % ] 2  "] (split, but issues with ; in brackets)
```

**Note**: The algorithm needs to be aware of bracket context. A more sophisticated approach:

```
function normalizePattern(pattern):
    // Step 1: Character normalization
    pattern = replace_all_tabs_with_space(pattern)
    pattern = replace_all_newlines_with_semicolon(pattern)  // \n → ;
    pattern = replace_all_carriage_returns_with_semicolon(pattern)  // \r → ;
    
    // Step 2: Process character by character, preserving structure
    result = ""
    prev_char = null
    
    for each char in pattern:
        if char is space:
            // Add space only if previous char was not space and not special char
            if prev_char not in [space, "[", "]", ";", null] and next_char not in ["[", "]", ";", "]" followed by digit]:
                result += " "
                prev_char = " "
        else if char in ["[", "]", ";"] or (char is digit after "]"):
            // Special characters: no spaces around them
            if prev_char == space:
                result = result.trim_end()  // Remove trailing space
            result += char
            prev_char = char
        else:
            // Regular character (chord, %, _, =)
            result += char
            prev_char = char
    
    return result.trim()
```

**Simplified Rule**: After character conversion, remove ALL spaces immediately before/after: `[`, `]`, `;`, and between `]` and a digit.

---

**Documentation Updates Needed**:
- [x] Add complete normalization algorithm to Phase 1.4
- [x] Specify tab/newline handling
- [x] Add before/after examples
- [x] Clarify that normalized version is stored
- [ ] Add normalization algorithm to Algorithm Details section

---

## ✅ Issue 7: Prompter Generation Algorithm Missing

**Status**: RESOLVED ✓

**Location**: Parser spec Phase 4, JSON Structure spec Prompter section

---

### Complete Section-to-Prompter Flow

**ANSWERS**:

15. **How does prompter generation work?**

    ✅ **Complete algorithm**:
    
    **Step 1: Check for tempo changes**
    - If section has `pattern.bpm` or `pattern.time` override
    - Add tempo item to prompter
    
    **Step 2: Expand section pattern into measure stack**
    - Add `_before` measures (if present)
    - Add main pattern repeated N times (`_repeat`)
    - Apply `_cutStart` to main pattern (remove measures + beats from beginning)
    - Apply `_cutEnd` to main pattern (remove measures + beats from end)
    - Add `_after` measures (if present)
    - **Result**: Ordered array of measures `[M1, M2, M3, ...]`
    
    **Step 3: Process lyrics with measure stack**
    - For each lyric line:
      - Take N measures from the beginning of the stack (where N = lyric's measure count)
      - Remove those measures from the stack
      - Create prompter content item with lyric + measures
      - Set `repeats: 1` initially
      - Apply pattern optimization (see Q16)
    
    **Key concepts**:
    - **Measure stack**: Ordered array of measures consumed sequentially
    - **Beat removal with cutStart/cutEnd**: Same algorithm as Step 3 validation (beat loss concept)
    - **Lyric measure counts are optional**: If not specified, no correlation between measures and lyrics
    - **Sections can have no lyrics**: Pattern-only sections are valid (measures not consumed)

16. **Pattern optimization algorithm**
    
    ✅ **Iterative division algorithm**:
    
    ```
    Start with: repeats=1, pattern=[full measure array]
    
    While pattern can be divided in half:
        1. Divide pattern array in half
        2. Compare first half == second half
        3. If equal:
           - Delete second half
           - Multiply repeats by 2
        4. If not equal:
           - Stop optimization
    ```
    
    **Example**:
    ```
    Initial: [A, B, C, D, A, B, C, D] (8 measures)
    Iteration 1: [A,B,C,D] == [A,B,C,D] ✓
      → repeats=2, pattern=[A,B,C,D]
    
    Iteration 2: [A,B] != [C,D] ✗
      → Stop
    
    Final: repeats=2, pattern=[A,B,C,D]
    ```

17. **Loop expansion in prompter**
    
    ✅ **ANSWER**: Remove loop markers and repeat content
    
    - Repeat content between `loopStart` and `loopEnd:N` markers N times
    - Remove the markers themselves
    - Result: Flattened measure array
    
    **Example**:
    ```json
    Input: ["loopStart", [["A",""]], [["D",""]], "loopEnd:3"]
    Output: [["A",""], ["D",""], ["A",""], ["D",""], ["A",""], ["D",""]]
    ```

18. **cutStart/cutEnd beat removal in prompter**
    
    ✅ **ANSWER**: Same algorithm as Step 3 validation
    
    - `[measures, beats]` notation
    - Remove `measures` complete measures first
    - Remove `beats` from the next measure (beginning for cutStart, end for cutEnd)
    - If beats exceed measure beats → remove entire measure (beat loss)
    - Process measure-by-measure (no beat carry-over)
    
    **Example with cutStart [1, 2]**:
    ```
    Pattern: [A(4 beats), B(2 beats), C(4 beats), D(4 beats)]
    Step 1: Remove 1 measure → [B, C, D]
    Step 2: Remove 2 beats from B (beginning) → B has 0 beats left
    Step 3: Remove B entirely
    Result: [C, D]
    ```

---

### Special Markers and Styling

**ANSWERS**:

19. **How do special markers affect styling?**
    
    ✅ **Pattern matching rules**:
    
    - If lyric starts with `***` AND ends with `***` → `"style": "info"`
    - If lyric starts with `:::` AND ends with `:::` → `"style": "musicianInfo"`
    - Otherwise → `"style": "default"`
    
    **Examples**:
    ```
    "***Guitar Solo***"     → style: "info"
    ":::Watch drummer:::"   → style: "musicianInfo"
    "Living easy"           → style: "default"
    "***Incomplete"         → style: "default" (no ending marker)
    ```

20. **When are tempo changes inserted?**
    
    ✅ **ANSWER**:
    
    - Always add initial tempo item at prompter start (from global metadata)
    - Add tempo item when section overrides `@bpm` or `@time`
    
    **Structure**:
    ```json
    {
        "type": "tempo",
        "bpm": 120,
        "time": "4/4"
    }
    ```

21. **How are section names displayed?**
    
    ✅ **ANSWER**: Section names do NOT automatically appear in prompter
    
    - Only lyric text appears in prompter content items
    - If you want section name visible, add it as a lyric line
    - Example: `***Intro***` becomes `lyrics: "Intro"` with `style: "info"`
    - The section's `name` property is stored in `sections` array only

---

**Documentation Updates Needed**:
- [ ] Expand Phase 4 algorithm with complete step-by-step process
- [ ] Add loop expansion algorithm
- [ ] Document measure stack consumption process
- [ ] Add pattern optimization algorithm with examples
- [ ] Clarify cutStart/cutEnd applies only to main pattern in prompter context
- [ ] Add complete worked example showing all steps

---

## ✅ Issue 8: Error Message Templates Not Standardized

**Status**: RESOLVED ✓

**Current Documentation**:
- Error messages scattered throughout docs
- No consistent format
- Now FULLY STANDARDIZED with comprehensive catalog

---

### Standardized Error Format

**ANSWER to Questions 19 & 20**:

#### Question 19: Standard Error Message Format

**Format (Option 3 - With location and suggestion)**:

```
[ERROR TYPE]: [Error description]
Line [N]: [Specific context]
Expected: [What should have been]
Fix: [Suggestion for correction]
```

**Components**:
- **Error Type**: `SYNTAX ERROR`, `VALIDATION ERROR`, or `REFERENCE ERROR`
- **Line Number**: YES - Line number in SongCode file
- **Column Number**: NO - Not included (overkill)
- **Expected**: What the parser expected to find
- **Fix**: Actionable suggestion for resolving the error
- **Categories**: YES - Error type prefix included

**Example**:
```
SYNTAX ERROR: Non-consecutive pattern definitions
Line 15: Found pattern definition $3 after section began
Expected: All pattern definitions before first section
Fix: Move pattern $3 to the pattern definitions block at the beginning
```

#### Question 20: Comprehensive Error Catalog

**✅ CREATED**

A complete error catalog has been added to the parser specification with:

- **40+ error messages** covering all phases
- **Organized by phase and category**:
  - Phase 1: First Pass Parsing (Metadata, Patterns, Sections)
  - Phase 2: Pattern Transformation
  - Phase 3: Validation
  - Additional edge cases
- **Error codes** for each (E1.1.1, E2.1.3, etc.)
- **Standardized format** for all errors
- **Implementation guidelines** for developers
- **Placeholder substitution** rules

**Benefits for development process**:
1. ✅ **Complete reference** for parser implementation
2. ✅ **Systematic test coverage** - know what to test
3. ✅ **Consistency** - all similar errors use similar messages
4. ✅ **User experience** - clear, actionable error messages
5. ✅ **Maintenance** - easy to add new errors following same pattern

**Coverage**:
- All syntax errors (malformed input)
- All validation errors (invalid semantics)
- All reference errors (undefined/circular)
- Empty/edge cases
- Phase-specific errors

---

**Documentation Updates Needed**:
- [x] Create standardized error message format
- [x] Create comprehensive error catalog (40+ errors)
- [x] Specify error codes for each
- [x] Add context information requirements
- [x] Add implementation guidelines
- [x] Organize by phase and category

---

## ✅ Issue 9: Missing Specification Details

**Status**: RESOLVED ✓

All specification details have been documented.

---

### 9.1 Tokenization (Phase 0) ✅ RESOLVED

**Character Encoding**:
- ✅ **UTF-8** encoding required
- ✅ **Strict validation**: Reject invalid UTF-8 sequences
- Invalid UTF-8 includes: incomplete multibyte sequences, invalid byte patterns, null bytes
- Returns **E0.2** error on encoding issues

**Line Ending Handling**:
- ✅ **Normalize** all line endings to LF (`\n`)
- ✅ Accept both CRLF (`\r\n`) and LF (`\n`)
- ✅ Process during initial file read (before Phase 1)
- Mixed line endings in same file are accepted and normalized

**Escaped Characters**:
- ✅ **No escape sequences** in SongCode
- All characters treated literally
- `\n` in file → literal backslash + 'n' (not newline)
- Special markers (`***`, `:::`) don't need escaping

---

### 9.2 Maximum Limits ✅ RESOLVED

**A. Loop Depth**:
- ✅ Nested loops: **NOT supported** (returns **E2.1.3** error)
- ✅ Loop repeat count: **No maximum**
- `[A;G]2` ✓ minimum
- `[A;G]100` ✓ allowed
- `[A;G]10000` ✓ allowed (no limit)

**B. Pattern Count**:
- ✅ Maximum: **26 patterns** (A-Z)
- Pattern IDs assigned alphabetically
- 27th unique pattern → ERROR (exceeds limit)

**C. Section Count**:
- ✅ **No limit** on number of sections

**D. Measure Count**:
- ✅ **No limit** on measures per pattern
- ✅ **No limit** on total measures in song

**E. String Lengths**:
- ✅ Metadata `@name`: 200 characters
- ✅ Metadata `@original`, `@end`, `@warning`: 50 characters
- ✅ Section name: **50 characters**
- ✅ Lyric line: **No limit**
- ✅ Pattern description: **No limit**
- ✅ Section comment: **No limit**

**F. Pattern Reference Depth**:
- ✅ Maximum: **1 level** deep
- `$2` can contain `$1` ✓ (depth 1)
- `$3` containing `$2` containing `$1` ✗ (depth 2 - not allowed)

---

### 9.3 Circular Reference Detection ✅ RESOLVED

**Algorithm documented**: Stack-based tracking

**Implementation**:
```
resolution_stack = []

function resolvePatternVariable(pattern_id):
    if pattern_id in resolution_stack:
        throw CircularReferenceError(resolution_stack + [pattern_id])
    
    resolution_stack.push(pattern_id)
    resolve pattern content
    resolution_stack.pop()
```

**Error message format**:
```
REFERENCE ERROR: Circular reference detected
Line [N]: Pattern references form a cycle: $1 → $2 → $1
Expected: Pattern references must not be circular
Fix: Remove circular dependency in pattern definitions
```

**Benefits**:
- Clear, simple algorithm
- Easy to implement
- Provides exact cycle path for debugging
- Consistent with error catalog format

---

### 9.4 Pattern Variable Resolution Order ✅ RESOLVED

**Rule**: Patterns must be defined before use

**Forward references**: ✗ **NOT allowed**

**Resolution order**: In-order (patterns resolved as encountered)

**Valid**:
```songcode
$1
A;D

$2
$1;G    ✓ $1 defined before use
```

**Invalid**:
```songcode
$2
$1;G    ✗ ERROR: $1 not defined yet

$1
A;D
```

**Depth limit**: Maximum 1 level
- Direct substitution only
- Cannot reference pattern that references another pattern

---

### 9.5 Section-Level Metadata Validation ✅ RESOLVED

**A. Section @bpm**:
- ✅ **Same validation as global** (integer 0-400)

**B. Section @time**:
- ✅ **Same validation as global** (denominator must be 4)

**C. Allowed metadata keys at section level**:
- ✅ **Only** `@bpm` and `@time`
- ✗ **NOT allowed**: `@name`, `@original`, `@end`, `@warning` (song-level only)
- Using non-allowed keys → **E1.3.6** error

**Example**:
```songcode
@name My Song        ← Global: Valid
@bpm 120             ← Global: Valid

Verse
@bpm 140             ← Section: Valid (override)
@time 3/4            ← Section: Valid (override)
@name Something      ← Section: ERROR (not allowed)
```

---

**Documentation Updates Completed**:
- [x] Add File Format Specifications section
- [x] Document character encoding (UTF-8, strict)
- [x] Document line ending normalization
- [x] Clarify no escape sequences
- [x] Document all maximum limits
- [x] Add circular reference detection algorithm
- [x] Document pattern variable resolution rules
- [x] Specify section-level metadata validation

---

## 📋 Priority Ranking

### Critical (Blocks Implementation)
1. ~~**Issue 3.3** - Order of operations for `_before`/`_after` with `_cutStart`/`_cutEnd`~~ ✅ RESOLVED
2. ~~**Issue 4** - Pattern measures count algorithm (cutStart/cutEnd logic)~~ ✅ RESOLVED
3. ~~**Issue 7** - Prompter generation algorithm~~ ✅ RESOLVED
4. ~~**Issue 3.2** - Parsing algorithm for `_before`/`_after`~~ ✅ RESOLVED

### High (Major Ambiguity)
5. ~~**Issue 3.1** - Full syntax support in `_before`/`_after`~~ ✅ RESOLVED
6. ~~**Issue 3.4** - Time signature validation for modifiers~~ ✅ RESOLVED
7. ~~**Issue 5** - Empty pattern handling~~ ✅ RESOLVED
8. ~~**Issue 6** - Whitespace normalization algorithm~~ ✅ RESOLVED

### Medium (Nice to Have)
9. ~~**Issue 8** - Error message standardization~~ ✅ RESOLVED
10. ~~**Issue 9.1** - Tokenization details~~ ✅ RESOLVED
11. ~~**Issue 9.2** - Maximum limits~~ ✅ RESOLVED
12. ~~**Issue 9.3-9.5** - Other specification details~~ ✅ RESOLVED

---

## 📝 Notes

- This document should be updated as issues are resolved
- Mark resolved issues with ✅ and move to "Fixed Issues" section
- Add implementation decisions and rationale
- Link to relevant commits or documentation updates

---

## Next Steps

1. Review each issue in priority order
2. Answer questions with clear, unambiguous specifications
3. Update relevant documentation files
4. Create test cases for each resolved issue
5. Mark issues as resolved in this document
