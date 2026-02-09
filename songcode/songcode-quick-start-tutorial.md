# SongCode Quick Start Tutorial

**Learn to write your first song in 10 minutes**

## Welcome!

This tutorial will teach you how to write songs using SongCode, a simple text-based notation for chord charts with lyrics. By the end, you'll be able to create complete, professional song charts.

---

## What You'll Learn

1. Basic file structure
2. Writing simple chord progressions
3. Adding lyrics with timing
4. Using pattern definitions to avoid repetition
5. Creating complete songs

---

## Lesson 1: Your First Song

Let's start with the simplest possible song: a one-chord verse.

### Step 1: Create a file

Create a new file called `my-first-song.sc`

### Step 2: Write a section

```songcode
Verse
G;%;%;%
--
This is my first lyric line _4
```

**What does this mean?**
- `Verse` - Section name
- `G` - One measure of G major chord
- `--` - Separator between chords and lyrics
- `This is my first lyric line _4` - Lyric that lasts 4 measures

### Understanding the `_4`

The `_4` means this lyric line lasts for 4 measures. But wait—we only wrote one chord (`G`)!

**The rule**: If you only write one chord in a section, and the lyrics say they need 4 measures, that one chord gets repeated for all 4 measures.

### Try it yourself

1. Change the chord to `C`
2. Change `_4` to `_2`
3. Save and observe how the timing changes

---

## Lesson 2: Multiple Measures

Let's write a more interesting progression.

```songcode
Verse
G;C;D;G
--
First line of the verse _2
Second line of the verse _2
```

**New syntax**: `;` (semicolon)
- Separates measures
- `G;C;D;G` = 4 different measures

**Lyric timing**:
- Total: 4 measures
- First line: 2 measures
- Second line: 2 measures
- Total: 2 + 2 = 4 ✓

---

## Lesson 3: Multiple Chords Per Measure

What if you need two chords in one measure?

```songcode
Verse
G C;D Em;G
--
Quick chord changes _3
```

**New syntax**: Space within a measure
- `G C` = Two chords in one measure (2 beats each in 4/4 time)
- Beats are always divided equally

**In 4/4 time**:
- 1 chord = 4 beats
- 2 chords = 2 beats each
- 4 chords = 1 beat each

**Example with 4 chords**:
```songcode
G C D Em
```
Each chord gets 1 beat in 4/4 time.

---

## Lesson 4: Adding Metadata

Let's add song information at the top.

```songcode
@name My First Song
@artist Your Name
@bpm 120
@time 4/4

Verse
G;C;D;G
--
First line of the verse _2
Second line of the verse _2
```

**Metadata always goes at the top**:
- `@name` - Song title
- `@artist` - Artist name
- `@bpm` - Tempo (beats per minute)
- `@time` - Time signature (default is 4/4)

---

## Lesson 5: Multiple Sections

Most songs have verses and choruses. Let's add both.

```songcode
@name My Song
@bpm 120

Verse
G;C;D;G
--
This is the verse _2
Second line verse _2

Chorus
Em;C;G;D
--
This is the chorus _2
Sing it loud _2
```

**Important**: Separate sections with an **empty line**.

---

## Lesson 6: Repeating Measures

Use `%` to repeat the previous measure.

```songcode
Verse
G;%;C;D
--
G plays for two measures _4
```

**What this means**:
- Measure 1: G
- Measure 2: G (repeated with `%`)
- Measure 3: C
- Measure 4: D

**You can also use `%` within a measure**:
```songcode
G % C D
```
This means: G, G, C, D (each for 1 beat in 4/4)

---

## Lesson 7: Pattern Definitions

If you use the same progression multiple times, define it once!

```songcode
@name Pattern Example
@bpm 120

$1
G;C;D;G

Verse 1
$1
--
First verse lyrics _2
More verse lyrics _2

Verse 2
$1
--
Second verse lyrics _2
Different words here _2
```

**Pattern definitions**:
- Must come **before sections**
- Start with `$` and a number
- Can be reused in any section

**Benefits**:
- Write once, use many times
- Easy to update (change $1, affects all sections using it)

---

## Lesson 8: Pattern Modifiers

### Repeating a Pattern

```songcode
$1
G;C;D;G

Intro
$1
_repeat 2
--
***Intro*** _8
```

`_repeat 2` plays the pattern twice (8 measures total).

### Cutting the End

```songcode
Verse
$1
_cutEnd 1
--
Shorter verse _3
```

`_cutEnd 1` removes the last 1 measure (now only 3 measures instead of 4).

### Adding Before and After

```songcode
Verse
$1
_before Am;Am
_after D;D
--
Extended verse _8
```

- `_before Am;Am` adds 2 measures before the pattern
- `_after D;D` adds 2 measures after the pattern

---

## Lesson 9: Special Markers

### Instrumental Sections

Use `***text***` for instrumental sections visible to everyone:

```songcode
Intro
G;C;D;G
--
***Guitar Intro*** _4
```

### Musician-Only Notes

Use `:::text:::` for notes only musicians should see:

```songcode
Break
G
--
:::Watch the drummer::: _4
```

---

## Lesson 10: Complete Song Example

Let's put it all together!

```songcode
@name Campfire Song
@artist You
@bpm 100
@time 4/4

$1
G;C;D;G

$2
Em;C;G;D

Intro
$1
_repeat 2
--
***Acoustic Intro*** _8

Verse 1
$1
--
Sitting by the fire tonight _2
Stars are shining bright _2

Chorus
$2
--
Sing along with me _2
Under the willow tree _2

Verse 2
$1
--
Morning comes but we'll remain _2
Dancing in the summer rain _2

Chorus
$2
_repeat 2
--
Sing along with me _2
Under the willow tree _2
Sing along with me _2
Under the willow tree _2

Outro
$1
_cutEnd 2
--
***Fade out*** _2
```

---

## Common Patterns & Tips

### 1. Classic Progressions

**I-IV-V-I (in G)**:
```songcode
$1
G;C;D;G
```

**I-V-vi-IV (in C)**:
```songcode
$1
C;G;Am;F
```

**12-Bar Blues (in A)**:
```songcode
$1
A;%;%;%;D;%;A;%;E;D;A;E
```

### 2. Chord Extensions

Add 7ths, sus chords, etc.:
```songcode
G;Cadd9;Dsus4;Em7
```

### 3. Complex Rhythms

Quarter note rhythm:
```songcode
G G G G
```
Each G is 1 beat in 4/4.

### 4. Empty Measures

Use `_` for silent beats:
```songcode
G _ _ _
```
G on beat 1, silence on beats 2, 3, 4.

### 5. Shortened Measures

Use `=` to remove beats from the end:
```songcode
G C;D =
```
- Measure 1: G and C (2 beats each)
- Measure 2: D for 2 beats (one `=` removes 2 beats)

---

## Tips for Success

### 1. Start Simple
Begin with one section, add complexity gradually.

### 2. Test As You Go
After writing each section, check that:
- Lyric measure counts add up to section length
- Chords fit the time signature

### 3. Use Pattern Definitions
If you write the same progression twice, make it a pattern.

### 4. Add Comments
Use `SectionName!Comment` for notes:
```songcode
Bridge!Slow down here
```

### 5. All or Nothing Timing
Either **all** lyrics have `_n` measure counts, or **none** do.

---

## Common Mistakes to Avoid

### ❌ Forgetting the `--` separator
```songcode
Verse
G;C;D
First lyric    ← ERROR: missing --
```

### ✓ Correct:
```songcode
Verse
G;C;D
--
First lyric _3
```

### ❌ Measure count mismatch
```songcode
Verse
G;C;D;Em    ← 4 measures
--
First line _2
Second line _1    ← Only 3 measures total: ERROR!
```

### ✓ Correct:
```songcode
Verse
G;C;D;Em    ← 4 measures
--
First line _2
Second line _2    ← Total: 4 measures ✓
```

### ❌ Space in chord
```songcode
Am 7    ← ERROR: space means two chords
```

### ✓ Correct:
```songcode
Am7    ← No space
```

### ❌ Pattern after sections
```songcode
Verse
G;C

$1    ← ERROR: pattern must come before sections
D;E
```

### ✓ Correct:
```songcode
$1
D;E

Verse
G;C
```

---

## Next Steps

### Explore More Features

1. **Different time signatures**: Try `@time 3/4` for waltz time
2. **Tempo changes**: Use section-level `@bpm` to speed up or slow down
3. **Complex loops**: Use `[pattern]n` for repeated sections
4. **Guitar capo**: Add `@capo 3` for capo position

### Study Examples

Look at the included example files:
- `highway-to-hell.sc` - Complex song with loops and modifiers
- Other examples in the documentation

### Read the Full Reference

For complete syntax details, see:
- **SongCode Language Reference** - Complete syntax guide
- **Parser/Generator Specification** - How SongCode becomes JSON

---

## Practice Exercise

Try writing this song on your own:

**"Simple Song"**
- Tempo: 110 BPM
- Time signature: 4/4
- Verse: C, Am, F, G (each for one measure)
- Chorus: F, C, G, Am (each for one measure)
- Verse plays once (4 lyric lines, 1 measure each)
- Chorus plays twice (4 lyric lines, 1 measure each, repeated)

<details>
<summary>Click to see solution</summary>

```songcode
@name Simple Song
@artist Me
@bpm 110
@time 4/4

$1
C;Am;F;G

$2
F;C;G;Am

Verse
$1
--
First line of verse _1
Second line of verse _1
Third line of verse _1
Fourth line of verse _1

Chorus
$2
_repeat 2
--
First line of chorus _1
Second line of chorus _1
Third line of chorus _1
Fourth line of chorus _1
First line of chorus _1
Second line of chorus _1
Third line of chorus _1
Fourth line of chorus _1
```

</details>

---

## Congratulations! 🎉

You now know how to write songs in SongCode! Start writing your own chord charts and share them with your band.

Happy songwriting! 🎸🎵
