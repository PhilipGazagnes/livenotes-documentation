# 02 - Intermediate Examples

This folder contains examples that introduce patterns, modifiers, and reusability.

## What You'll Learn

- Pattern definitions with `$n`
- Pattern reuse across sections
- Repeat modifier `_repeat`
- Before/after modifiers `_before`, `_after`
- The `%` (repeat previous) symbol
- Loops with `[...]n`
- Tempo overrides with `@bpm`

## Examples

### `pattern-reuse.sc`
A song that defines patterns once and reuses them:
- 2 pattern definitions
- Multiple sections using the same patterns
- Shows how to avoid repeating chord progressions

**Demonstrates**:
- Pattern definition syntax
- Pattern references in sections
- DRY principle (Don't Repeat Yourself)

### `modifiers-demo.sc`
Comprehensive modifier showcase:
- `_repeat` to play patterns multiple times
- `_before` to add intro measures
- `_after` to add outro measures
- `@bpm` to change tempo in a section

**Demonstrates**:
- All basic modifiers
- How modifiers change measure counts
- Tempo variations

### `repeat-symbol.sc`
Using the `%` symbol effectively:
- `%` repeats the previous chord
- `%` repeats the previous measure
- Compact notation for repeated elements

**Demonstrates**:
- Two uses of `%`
- When to use `%` vs explicit chords
- Pattern vs inline usage of `%`

### `loops-demo.sc`
Using `[...]n` loop syntax:
- Repeat chord progressions
- Nested pattern references
- Loop expansion in patterns

**Demonstrates**:
- Loop syntax `[A;G]3`
- Visual line breaks with `:`
- How loops expand in JSON

## Tips for Intermediate Users

1. **Define patterns**: If you use a progression 2+ times, make it a pattern
2. **Use modifiers**: They're powerful for variations without rewriting patterns
3. **Understand `%`**: It saves typing but can be confusing at first
4. **Loops**: Great for repetitive progressions, but don't nest too deep

## Progression to Advanced

Once you're comfortable with these concepts:
- Combine multiple modifiers (`_repeat` + `_cutEnd`)
- Use `_cutStart` and `_cutEnd` for precise control
- Check out `03-advanced/` for real-world complex songs
