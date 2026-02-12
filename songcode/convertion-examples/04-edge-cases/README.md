# 04 - Edge Cases

This folder contains examples that test edge cases, unusual patterns, and extreme scenarios.

## What You'll Learn

- How to handle empty patterns
- Silent measures and beats
- Remover symbol `=`
- Multiple chords per measure
- Extreme modifiers
- Cut modifiers (`_cutStart`, `_cutEnd`)
- Complex timing scenarios

## Examples

### `empty-measures.sc`
Demonstrates silence and empty space:
- Silent measures with `_`
- Empty patterns
- Combination of chords and silence

**Demonstrates**:
- `_` as silent measure
- `_` as silent beat
- How silence appears in JSON

### `removers-demo.sc`
Using the `=` remover symbol:
- Removing beats from measure ends
- Combining removers with normal chords
- How removers affect measure counts

**Demonstrates**:
- `=` removes beats from end of measure
- Beat counting with removers
- Time signature compliance with removers

### `multi-chord-measures.sc`
Multiple chords within single measures:
- Space-separated chords
- Beat division with multiple chords
- Complex progressions

**Demonstrates**:
- `A D` = two chords in one measure
- How beats divide among chords
- JSON representation of multi-chord measures

### `cut-modifiers.sc`
Using `_cutStart` and `_cutEnd`:
- Removing measures from pattern start
- Removing measures from pattern end
- Removing specific beats

**Demonstrates**:
- `_cutStart 2` removes 2 measures
- `_cutEnd 1-2` removes 1 measure + 2 beats
- Precise pattern trimming

### `extreme-modifiers.sc`
Combining multiple modifiers:
- `_repeat` with `_cutStart` and `_cutEnd`
- `_before` and `_after` together
- Complex modifier chains

**Demonstrates**:
- Modifier application order
- Complex transformations
- Real-world advanced usage

## Tips for Edge Cases

1. **Test thoroughly**: Edge cases often reveal parser bugs
2. **Understand timing**: Beat math is critical with removers
3. **Check JSON output**: Verify transformations are correct
4. **Use sparingly**: These are advanced features for special situations

## When to Use Edge Cases

- **Silence**: Instrumental breaks, pauses
- **Removers**: Odd time signatures, pickup measures
- **Multi-chord**: Fast chord changes, jazz progressions
- **Cut modifiers**: Variations on patterns, partial repeats
- **Extreme modifiers**: Complex arrangements, avoiding duplication

## Not Recommended

These examples show what's *possible*, not necessarily what's *advisable*:
- Overusing cut modifiers can make songs hard to read
- Too many removers suggests wrong time signature
- Extreme modifier chains are hard to debug

**Use patterns and simple modifiers first**. Reach for edge cases only when needed.
