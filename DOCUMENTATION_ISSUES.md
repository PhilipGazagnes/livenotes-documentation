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

## 🟡 Issue 5: Empty Pattern Handling

**Current Documentation**:
- Parser spec mentions: "Note: a pattern can be empty" (line 238)
- No further details provided

**Questions Needing Answers**:

11. **How are empty patterns represented?**
    
    In SongCode:
    ```songcode
    $1
    
    
    Verse
    $1
    ```
    
    In JSON:
    - `"json": []` ?
    - `"json": null` ?
    - Is this even valid?

12. **How do empty patterns affect measure counting?**
    - If `measures: 0`, how does `_repeat 3` work?
    - Can you use `_cutStart` or `_cutEnd` on an empty pattern?
    - What about `_before` or `_after` with an empty main pattern?

13. **Are empty patterns valid, and if so, what's the use case?**
    - Is it for sections with only lyrics and no chords?
    - Or is it an error condition?

**Documentation Gaps**:
- [ ] Define valid empty pattern syntax
- [ ] Document JSON representation
- [ ] Specify measure counting behavior (0 measures?)
- [ ] Add validation rules
- [ ] Provide use case examples or declare as error

---

## 🟠 Issue 6: Whitespace Normalization Algorithm Not Specified

**Location**: Parser spec Phase 1.4, Pattern ID Assignment

**Current Documentation**:
> **Normalization process**: Delete useless whitespaces in each measure (before the first chord, after the last chord, more than 1 space between chords)

**Problem**: Algorithm is too vague

**Questions Needing Answers**:

14. **Exact normalization algorithm?**
    
    Input examples:
    - `"  Am   D  "`
    - `"Am D  ;  G   E "`
    - `" [  A ; G ] 3  "`
    
    Expected outputs:
    - Should tabs be converted to spaces first?
    - Should newlines within patterns be normalized?
    - What about spaces around special characters: `[ A ; G ] 3` vs `[A;G]3`?

**Documentation Gaps**:
- [ ] Provide step-by-step whitespace normalization algorithm
- [ ] Specify handling of tabs, newlines, multiple spaces
- [ ] Add before/after examples
- [ ] Specify when normalization happens (before or after pattern matching?)

---

## 🟠 Issue 7: Prompter Generation Algorithm Missing

**Location**: Parser spec Phase 4, JSON Structure spec Prompter section

**Current Documentation**:
- JSON structure reference shows prompter examples
- Parser spec Phase 4 section exists but is not detailed
- No algorithm provided for prompter generation

**Questions Needing Answers**:

15. **How does prompter generation work?**
    - How do lyrics map to chord measures?
    - How are loops expanded in the prompter?
    - How are `_cutStart` and `_cutEnd` applied in prompter?

16. **How do special markers affect styling?**
    - `***Solo***` → `"style": "info"`
    - `:::Break:::` → `"style": "info"`
    - Regular lyrics → `"style": "default"`
    - What's the exact pattern matching rule?

17. **When are tempo changes inserted?**
    - At the beginning always?
    - When `@bpm` changes between sections?
    - Example structure needed

18. **How are section names displayed?**
    - The highway-to-hell example shows: `"lyrics": "Intro"` for first section
    - But other sections don't show the section name in prompter
    - What's the rule?

**Documentation Gaps**:
- [ ] Write complete Phase 4 algorithm
- [ ] Document lyric-to-chord mapping rules
- [ ] Specify special marker patterns and styling
- [ ] Define tempo change insertion rules
- [ ] Add complete worked example from section to prompter

---

## 🟠 Issue 8: Error Message Templates Not Standardized

**Current Documentation**:
- Error messages scattered throughout docs
- No consistent format
- Some are quoted, some are not

**Examples Found**:
- `"Metadata must be consecutive at the beginning of the file"`
- `"Unknown metadata key: @invalidKey"`
- `Invalid chord: Xm (not a valid base chord)`

**Questions Needing Answers**:

19. **What's the standard error message format?**
    - Should they include line numbers?
    - Should they include column numbers?
    - Should they suggest fixes?

20. **What are ALL the possible error messages?**
    - Need comprehensive list for testing

**Documentation Gaps**:
- [ ] Create standardized error message format
- [ ] Create comprehensive error catalog
- [ ] Specify error codes (optional but helpful)
- [ ] Add context information requirements

---

## 🔵 Issue 9: Missing Specification Details

### 9.1 Tokenization (Phase 0)

**Missing**:
- How to split input into tokens
- Which characters are delimiters
- Line ending handling (CRLF vs LF)
- Character encoding (UTF-8 assumed?)
- Escaped characters (if any)

### 9.2 Maximum Limits

**Missing**:
- Maximum loop depth
- Maximum pattern count
- Maximum section count
- Maximum measure count per pattern
- Maximum string lengths (beyond metadata)
- Maximum nesting level for pattern references

### 9.3 Circular Reference Detection

**Current Documentation**: Error mentioned but algorithm not specified

**Missing**:
- Detection algorithm
- How to report which patterns are involved in the cycle

### 9.4 Pattern Variable Resolution Order

**Missing**:
- If `$2` references `$1`, and `$3` references `$2`
- What's the resolution order?
- Depth-first? Breadth-first?
- Are forward references allowed?

### 9.5 Section-Level Metadata Validation

**Missing**:
- Can section `@bpm` be outside the 0-400 range?
- Can section `@time` use the same validation as global?
- Are there any metadata keys that can't be overridden at section level?

---

## 📋 Priority Ranking

### Critical (Blocks Implementation)
1. ~~**Issue 3.3** - Order of operations for `_before`/`_after` with `_cutStart`/`_cutEnd`~~ ✅ RESOLVED
2. ~~**Issue 4** - Pattern measures count algorithm (cutStart/cutEnd logic)~~ ✅ RESOLVED
3. **Issue 7** - Prompter generation algorithm
4. ~~**Issue 3.2** - Parsing algorithm for `_before`/`_after`~~ ✅ RESOLVED

### High (Major Ambiguity)
5. ~~**Issue 3.1** - Full syntax support in `_before`/`_after`~~ ✅ RESOLVED
6. ~~**Issue 3.4** - Time signature validation for modifiers~~ ✅ RESOLVED
7. **Issue 5** - Empty pattern handling
8. **Issue 6** - Whitespace normalization algorithm

### Medium (Nice to Have)
9. **Issue 8** - Error message standardization
10. **Issue 9.1** - Tokenization details
11. **Issue 9.2** - Maximum limits
12. **Issue 9.3-9.5** - Other specification details

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
