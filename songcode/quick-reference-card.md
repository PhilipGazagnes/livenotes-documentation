# SongCode Quick Reference Card

**Version 1.0** | Fast lookup for syntax, symbols, and common patterns

---

## 📐 File Structure

```
[Metadata]           ← Optional, starts with @
[Pattern Definitions] ← Optional, starts with $
[Sections]           ← Required, separated by empty lines
```

---

## 🔤 Symbols Reference

| Symbol | Name | Usage | Example |
|--------|------|-------|---------|
| `;` | Measure separator | Separates measures | `A;G;D;G` = 4 measures |
| `%` | Repeat previous | Repeats last chord/measure | `A;%;%;%` = A four times |
| `_` | Silence | Empty beat or measure | `A _;G _` = A, silence, G, silence |
| `=` | Remover | Removes beats from end | `A G D =` = 2 beats removed |
| `:` | Line break | Visual line break in pattern | `A;G:D;E` = two lines |
| `[...]n` | Loop | Repeats content n times | `[A;G]3` = A;G;A;G;A;G |
| `$n` | Pattern ref | References pattern definition | `$1` = use pattern 1 |
| `--` | Lyric separator | Starts lyrics section | After chords, before lyrics |
| `***...***` | Info marker | Info visible to all | `***Solo***` |
| `:::...:::` | Musician marker | Info for musicians only | `:::Watch drummer:::` |
| `!` | Comment | Section comment | `Bridge!Slow down` |
| `_n` | Measure count | Lyric duration in measures | `First line _2` = 2 measures |

---

## 📝 Metadata Keys

| Key | Type | Range/Format | Example |
|-----|------|--------------|---------|
| `@name` | string | max 100 chars | `@name Highway to Hell` |
| `@artist` | string | max 100 chars | `@artist AC/DC` |
| `@bpm` | integer | 0-400 | `@bpm 120` |
| `@time` | time sig | `n/4` (V1: denom=4) | `@time 3/4` |
| `@original` | chord | base chord | `@original A` |
| `@capo` | integer | 1-20 | `@capo 3` |
| `@warning` | string | max 100 chars | `@warning Tricky break` |
| `@end` | string | max 100 chars | `@end Fade out` |

**Note**: All metadata is optional. Must be consecutive at file start.

---

## 🎼 Chord Notation

| Format | Example | Meaning |
|--------|---------|---------|
| `Base` | `A`, `G`, `C` | Major chord |
| `Base` | `Am`, `Dm`, `Gm` | Minor chord (m is part of base) |
| `Base[ext]` | `Am7`, `Dsus4`, `G7` | Chord with extension |
| `Base` | `C#`, `F#`, `Bb`, `Eb` | Sharp (#) or flat (b) part of base |
| `Base Base` | `G C`, `A D` | Multiple chords per measure (space-separated) |

**Valid base chords**: A, A#, Ab, Am, A#m, Abm, B, Bb, Bm, Bbm, C, C#, Cm, C#m, D, Db, D#, Dm, Dbm, D#m, E, Eb, Em, Ebm, F, F#, Fm, F#m, G, Gb, G#, Gm, Gbm, G#m  
**Extensions**: Any text after base (7, sus4, add9, maj7, 7b5, etc.)  
**No spaces**: Between base and extension (`Am7` ✓, `Am 7` ✗)  
**Spaces**: Within a measure = multiple chords; Between measures = use `;`

---

## 🔄 Pattern Definitions

```songcode
$n
pattern description

$1
A;G;D;G

$2
[A;G]4:D;E
```

**Rules**:
- Must come before sections
- Can reference other patterns: `$2` can contain `$1`
- Numbers can be any value (1, 2, 10, 100)
- Parser assigns alphabetic IDs (A, B, C...) in JSON output

---

## 🎯 Pattern Modifiers

| Modifier | Format | Example | Effect |
|----------|--------|---------|--------|
| `_repeat` | `_repeat n` | `_repeat 2` | Play pattern n times |
| `_cutStart` | `_cutStart [m[-b]]` | `_cutStart 2` | Remove m measures, b beats from start |
| `_cutEnd` | `_cutEnd [m[-b]]` | `_cutEnd 1-2` | Remove m measures, b beats from end |
| `_before` | `_before pattern` | `_before Am;D` | Add measures before pattern |
| `_after` | `_after pattern` | `_after G;G` | Add measures after pattern |
| `@bpm` | `@bpm n` | `@bpm 140` | Override tempo for section |
| `@time` | `@time n/4` | `@time 3/4` | Override time signature |

**Cut format examples**:
- `2` → [2, 0] = 2 full measures
- `1-3` → [1, 3] = 1 measure + 3 beats
- `-2` → [0, 2] = 2 beats only

---

## 📊 Section Structure

```songcode
SectionName[!Comment]
[Section metadata]
[Pattern reference or inline pattern]
[Modifiers]
--
Lyric line 1 [_n]
Lyric line 2 [_n]
```

**Example**:
```songcode
Verse!Watch timing
$1
_repeat 2
--
First line _2
Second line _2
```

---

## 🎵 Common Chord Progressions

### I-IV-V-I in Various Keys

```songcode
# Key of G
$1
G;C;D;G

# Key of C
$1
C;F;G;C

# Key of D
$1
D;G;A;D

# Key of A
$1
A;D;E;A
```

### I-V-vi-IV (Pop progression)

```songcode
# Key of C
$1
C;G;Am;F

# Key of G
$1
G;D;Em;C
```

### 12-Bar Blues

```songcode
# Key of A
$1
A;%;%;%;D;%;A;%;E;D;A;E

# Key of E
$1
E;%;%;%;A;%;E;%;B;A;E;B
```

### ii-V-I (Jazz)

```songcode
# Key of C
$1
Dm7;G7;Cmaj7
```

---

## ⏱️ Timing & Measure Counts

### All-or-Nothing Rule
- Either ALL lyrics have `_n` counts, or NONE do
- Mixed timing = ERROR

### Calculation
```songcode
Verse
A;G;D;G        ← 4 measures
--
Line 1 _2      ← 2 measures
Line 2 _2      ← 2 measures
Total: 2+2=4 ✓
```

### Multiple Chords Per Measure
In 4/4 time:
- `A` = 4 beats
- `A D` = 2 beats each
- `A D G E` = 1 beat each

---

## ⚠️ Error Code Index

| Code | Type | Issue |
|------|------|-------|
| E0.1 | SYNTAX | General file format error |
| E0.2 | SYNTAX | Invalid UTF-8 encoding |
| E1.1.x | SYNTAX | Metadata errors |
| E1.2.x | SYNTAX/REF | Pattern definition errors |
| E1.3.x | SYNTAX | Section parsing errors |
| E2.x.x | SYNTAX | Pattern transformation errors |
| E3.1.x | VALIDATION | Time signature validation |
| E3.2.x | VALIDATION | Measure count errors |
| E3.3.x | VALIDATION | Lyric timing errors |

**See**: [Parser Spec - Error Catalog](parser-generator-specification.md#comprehensive-error-catalog) for complete list.

---

## 📚 Common Patterns

### Empty Measure
```songcode
_;_;_;_        # 4 measures of silence
```

### Shortened Measure
```songcode
A G D =        # 1 beat removed (3 beats total in 4/4)
```

### Loops with Line Break
```songcode
[A;G;D]2       # Single line: A;G;D;A;G;D
:
E;F;G          # New line visually
```

### Pattern Reuse
```songcode
$1
A;G;D

$2
$1;E;F         # Expands to: A;G;D;E;F
```

---

## 🔍 Quick Examples

### Minimal Song
```songcode
@name My Song
@bpm 100

Verse
G;C;D;G
--
First line _2
Second line _2
```

### With Patterns
```songcode
@name Song
@bpm 120

$1
G;C;D;G

Verse
$1
--
Verse lyrics _4

Chorus
$1
_repeat 2
--
Chorus lyrics _8
```

### With Modifiers
```songcode
Bridge
$1
_cutEnd 2
_after Am;Am
--
Bridge lyrics _4
```

### Complex Pattern
```songcode
$1
[A;G;D]3
:
E;F;G
```
Produces: A;G;D;A;G;D;A;G;D (new line) E;F;G = 12 measures

---

## 💡 Quick Tips

1. **Empty lines separate blocks** (metadata → patterns → sections)
2. **Pattern variables** must be defined before use
3. **Measure counts** must sum to section length
4. **Beats must divide evenly** into time signature
5. **Maximum 26 unique patterns** in a song
6. **`%` repeats** the previous chord/measure
7. **`_before`/`_after`** cannot use pattern variables or line breaks
8. **Chord spaces** mean multiple chords in one measure

---

## 🎓 Learning Path

1. **Start here**: [Quick Start Tutorial](songcode-quick-start-tutorial.md)
2. **Reference**: [Language Reference](songcode-language-reference.md)
3. **Implementation**: [Parser Specification](parser-generator-specification.md)
4. **Output format**: [JSON Structure Reference](livenotes-json-structure-reference.md)

---

## 📖 More Help

- **Complete syntax**: See [Language Reference](songcode-language-reference.md)
- **Parser algorithms**: See [Parser Specification](parser-generator-specification.md)
- **Examples**: See [convertion-examples/](convertion-examples/)
- **Full index**: See [INDEX.md](INDEX.md)

---

**Last Updated**: February 11, 2026  
**For**: SongCode v1.0
