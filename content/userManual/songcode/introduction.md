# SongCode Introduction

**SongCode** is a lightweight, human-readable notation language designed for musicians to quickly write down song information. It's optimized for speed and ease of use, making it perfect for capturing ideas during rehearsals or performances.

## Philosophy

SongCode is built on these core principles:

1. **Speed** - Write songs as fast as you can think them
2. **Readability** - Easy to read in plain text
3. **Flexibility** - Adapt to different musical styles and needs
4. **Simplicity** - Minimal syntax to learn

## Basic Structure

A SongCode document consists of:

- **Metadata** - Song information like key, relative key (for guitarists usig a capo), tempo
- **Patterns** - Chord progressions that are repeated in the song. Write them once here and use them in the song. 
- **Sections** - Structural parts like verses, choruses, bridges. Sections contain Section name, chords (or patterns), lyrics, info
- **Comments** - These will not be interpreted. They work like in JS/TS.


## Quick Example

```songcode
@key: F#m
@bpm: 90
@signature: 4/4

$1
F#m A;E B7

$2
[F#m A;E B7]3
:
D E;B

Theme
$1
--
***Intro***

Couplet
$2
--
Today is gonna be the day
That they're gonna throw it back to you
By now you should've somehow
Realized what you gotta do
I don't believe that anybody
Feels the way I do, about you now
```

## Why SongCode?

Traditional music notation is too complex for quick capture. Text files are too unstructured. SongCode strikes the perfect balance:

- ✅ Faster than notation software
- ✅ More structured than plain text
- ✅ Works on any device
- ✅ Version control friendly
- ✅ Easy to share and collaborate

## Next Steps

- Learn the [complete syntax reference](/#songcode/syntax)
- Explore [real-world examples](/#songcode/examples)
- Understand the [JSON output format](/#api/json-format)
