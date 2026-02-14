# SongCode Documentation

**Complete documentation for the SongCode music notation language and Livenotes JSON format**

---

## Overview

**SongCode** is a text-based notation language for writing musical chord charts with lyrics. It's designed to be human-readable, compact, and precise.

**Livenotes JSON** is the structured data format generated from SongCode files, ready for use in music applications.

---

## 🚀 Implementation

A complete **TypeScript/JavaScript converter** is now available:

- **NPM Package**: [@livenotes/songcode-converter](https://www.npmjs.com/package/@livenotes/songcode-converter)
- **GitHub Repository**: [livenotes-sc-converter](https://github.com/PhilipGazagnes/livenotes-sc-converter)
- **Version**: 1.0.0 (Stable)

### Installation

```bash
npm install @livenotes/songcode-converter
```

### Quick Usage

```javascript
import { SongCodeConverter } from '@livenotes/songcode-converter';

const converter = new SongCodeConverter();
const result = converter.convert(songCodeString);
console.log(result); // Livenotes JSON
```

See the [converter README](https://github.com/PhilipGazagnes/livenotes-sc-converter#readme) for complete documentation.

---

## Documentation Files

This directory contains comprehensive documentation generated from your SongCode project specifications:

### 📘 For Users (Songwriters & Musicians)

1. **[SongCode Quick Start Tutorial](./songcode-quick-start-tutorial.md)**
   - Perfect for beginners
   - Step-by-step lessons
   - Learn the basics in 10 minutes
   - Practice exercises included
   - **Start here if you're new to SongCode!**

2. **[SongCode Language Reference](./songcode-language-reference.md)**
   - Complete syntax guide
   - All features explained in detail
   - Examples for every concept
   - Best practices and common errors
   - **Use this as your go-to reference**

### 🔧 For Developers

3. **[Parser/Generator Specification](./parser-generator-specification.md)**
   - Detailed parsing algorithm
   - Step-by-step transformation process
   - Validation rules
   - Error handling
   - Implementation guidance
   - **Essential for building the parser**

4. **[Livenotes JSON Structure Reference](./livenotes-json-structure-reference.md)**
   - Complete JSON format specification
   - All objects and properties explained
   - Usage notes for application developers
   - Complete examples
   - **Required for consuming the JSON output**

---

## Quick Reference

### File Structure

```
SongCode File (.sc)
├── Metadata (optional)
├── Pattern Definitions (optional)
└── Sections (required)
    ├── Section Name
    ├── Pattern Description
    ├── -- (separator)
    └── Lyrics
```

### Basic Example

```songcode
@name My Song
@artist Me
@bpm 120

$1
G;C;D;G

Verse
$1
--
This is my verse _2
Second line here _2

Chorus
Em;C;G;D
--
This is the chorus _4
```

### Key Concepts

| Concept | Symbol | Example |
|---------|--------|---------|
| Measure separator | `;` | `G;C;D` (3 measures) |
| Multiple chords | space | `G C` (2 chords in 1 measure) |
| Repeat chord | `%` | `G;%` (G repeated) |
| Silence | `_` | `G _ C _` (alternating) |
| Shorten measure | `=` | `G =` (shortened measure) |
| Loop | `[...]n` | `[G;C]3` (repeat 3 times) |
| Line break | `:` | Visual formatting |
| Timing | `_n` | `Lyric _2` (2 measures) |
| Info marker | `***...***` | `***Solo***` |
| Musician note | `:::...:::` | `:::Watch drummer:::` |

---

## Workflow

### For Songwriters

1. **Learn** the basics with the [Quick Start Tutorial](./songcode-quick-start-tutorial.md)
2. **Write** your song in a `.sc` file
3. **Reference** the [Language Reference](./songcode-language-reference.md) as needed
4. **Parse** your file to generate Livenotes JSON
5. **Use** the JSON in the Livenotes app

### For Developers

1. **Understand** the format from the [Language Reference](./songcode-language-reference.md)
2. **Implement** the parser using the [Parser Specification](./parser-generator-specification.md)
3. **Generate** JSON following the [JSON Structure Reference](./livenotes-json-structure-reference.md)
4. **Consume** the JSON in your application

---

## Example Files

Refer to the main project for example files:
- `highway-to-hell.sc` - Complete song example
- `highway-to-hell.json` - Generated JSON output

---

## Key Features

### ✅ Advantages of SongCode

- **Human-readable**: Plain text, easy to read and edit
- **Version control friendly**: Works with Git, diffs are meaningful
- **Pattern reuse**: Define once, use many times
- **Precise timing**: Measure counts for exact playback
- **Flexible**: Loops, modifiers, tempo changes
- **Portable**: Just text files, works everywhere

### 🎯 Use Cases

- Band rehearsals and performances
- Song arrangement and composition
- Music education
- Setlist management
- Teleprompter/scrolling displays
- Music notation for non-standard progressions

---

## Documentation Structure

```
songcode/
├── README.md (this file)
├── songcode-quick-start-tutorial.md
├── songcode-language-reference.md
├── parser-generator-specification.md
└── livenotes-json-structure-reference.md
```

---

## Contributing

This documentation was generated from the original specification documents. If you find errors or have suggestions:

1. Check the source specification files
2. Update the specifications
3. Regenerate documentation as needed

---

## Version

**Documentation Version**: 1.0  
**SongCode Version**: 1.0  
**Livenotes JSON Version**: 1.0

---

## License

[Specify your license here]

---

## Credits

**SongCode Language**: Designed for the Livenotes project  
**Documentation**: Generated from project specifications

---

## Getting Help

### Common Questions

**Q: Where do I start?**  
A: Begin with the [Quick Start Tutorial](./songcode-quick-start-tutorial.md)

**Q: How do I write a specific chord?**  
A: See the "Chord Notation" section in the [Language Reference](./songcode-language-reference.md)

**Q: My file won't parse. What's wrong?**  
A: Check the "Common Errors" section in the [Language Reference](./songcode-language-reference.md)

**Q: How do I implement the parser?**  
A: Follow the [Parser Specification](./parser-generator-specification.md)

**Q: What does this JSON property mean?**  
A: Consult the [JSON Structure Reference](./livenotes-json-structure-reference.md)

---

## Related Projects

- **Livenotes App**: [Link to app repository]
- **SongCode Parser**: [Link to parser implementation]
- **Example Songs**: [Link to song collection]

---

Happy songwriting! 🎵🎸
