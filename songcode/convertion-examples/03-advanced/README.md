# 03 - Advanced Examples

This folder contains real-world, complex songs that demonstrate SongCode in production use.

## What You'll Learn

- Complete song structure
- Multiple pattern definitions working together
- Complex modifier usage
- Real-world timing and measure counting
- How professional songs translate to SongCode

## Examples

### `highway-to-hell` (AC/DC)
A complete rock song featuring:
- 4 distinct pattern definitions
- Multiple section types (Intro, Verse, Chorus, Solo, Outro)
- Pattern modifiers (`_repeat 2`)
- Musician-specific markers (`:::...:::`)
- Info markers for band coordination (`***Solo***`)
- Complex lyric timing across varied section structures
- BPM changes and original key specification

**Demonstrates**:
- Real-world song complexity
- How patterns simplify repetitive structures
- Professional use of all SongCode features
- Validated and production-ready example

**Key Patterns**:
- `$1`: Simple 4-measure intro riff
- `$2`: Extended verse pattern with loop and line break
- `$3`: Chorus with repeated measures
- `$4`: Bridge pattern

**Sections**:
1. Intro (2x repeat)
2. Verse
3. Chorus
4. Verse
5. Chorus
6. Solo Break
7. Chorus (2x repeat)
8. Outro

**Stats**:
- Total patterns: 4
- Total sections: 8
- Total measures: ~140
- Lyrics: 30+ lines

## Tips for Advanced Users

1. **Study the patterns**: See how `$1-$4` are reused across sections
2. **Follow the structure**: Notice how verse-chorus-verse follows classic rock format
3. **Check the modifiers**: `_repeat 2` is used strategically for emphasis
4. **Timing precision**: Every lyric is precisely timed to measures
5. **Markers matter**: `***Solo***` and `:::Watch tempo:::` show coordination

## How This Song Was Created

Highway to Hell demonstrates:
- **Pattern extraction**: Repetitive progressions become patterns
- **Strategic reuse**: Same pattern for both verses saves duplication
- **Clear structure**: Easy to navigate despite complexity
- **Production ready**: This is how SongCode is meant to be used

## Learning Path

1. **Read the .sc file**: See the source SongCode
2. **Compare to .json**: Understand how it parses
3. **Trace a section**: Follow "Verse" from pattern to prompter
4. **Modify it**: Try changing BPM, adding a section, or tweaking lyrics
5. **Use as template**: Copy patterns for your own rock songs

## Moving to Your Own Songs

After studying Highway to Hell:
- Use it as a reference for your own complex arrangements
- Copy pattern structures for similar song types
- Adapt section organization to your needs
- Don't be intimidated by complexity—build up gradually

This is the goal: complete, correct, production-ready SongCode for real music.
