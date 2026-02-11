# Documentation Index

A visual guide to navigate the SongCode documentation.

---

## 📚 Documentation Map

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  START HERE: SongCode Quick Start Tutorial         │
│  Perfect for: New users, beginners                 │
│  Time: 10-15 minutes                               │
│  File: songcode-quick-start-tutorial.md            │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  REFERENCE: SongCode Language Reference             │
│  Perfect for: Writing songs, looking up syntax     │
│  Time: Reference as needed                         │
│  File: songcode-language-reference.md              │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │     Parser generates JSON       │
        └─────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌──────────────────────┐      ┌──────────────────────┐
│                      │      │                      │
│  FOR DEVELOPERS:     │      │  JSON REFERENCE:     │
│  Parser Spec         │      │  Livenotes JSON      │
│  Build the parser    │      │  Structure           │
│                      │      │  Use the output      │
│  parser-generator-   │      │  livenotes-json-     │
│  specification.md    │      │  structure-          │
│                      │      │  reference.md        │
└──────────────────────┘      └──────────────────────┘
```

---

## 🎯 Choose Your Path

### Path 1: "I want to write songs"

1. ✅ Start with [Quick Start Tutorial](./songcode-quick-start-tutorial.md)
2. ✅ Practice writing a simple song
3. ✅ Keep [Language Reference](./songcode-language-reference.md) handy
4. ✅ Use [Quick Reference Card](./quick-reference-card.md) for fast syntax lookup
5. ✅ Write more complex songs as you learn

**Estimated time to first song**: 15 minutes

---

### Path 2: "I need to implement the parser"

1. ✅ Skim [Language Reference](./songcode-language-reference.md) to understand SongCode
2. ✅ Study [Parser Specification](./parser-generator-specification.md) in detail
3. ✅ Reference [JSON Structure](./livenotes-json-structure-reference.md) for output format
4. ✅ Implement parser following the 4-phase process
5. ✅ Test with example files

**Estimated time to working parser**: Depends on implementation

---

### Path 3: "I need to consume the JSON"

1. ✅ Read [JSON Structure Reference](./livenotes-json-structure-reference.md)
2. ✅ Understand the four main objects (meta, patterns, sections, prompter)
3. ✅ Decide which parts your app needs
4. ✅ Implement rendering/playback logic

**Estimated time to basic rendering**: Depends on application

---

### Path 4: "I need a quick reference"

Go straight to the relevant section:

**📄 [Quick Reference Card](./quick-reference-card.md)** - All symbols, syntax, and common patterns on one page

| Topic | Document | Section |
|-------|----------|---------|
| All symbols | Quick Reference Card | Symbols Reference |
| Chord notation | Language Reference OR Quick Reference Card | Chord Notation |
| Pattern syntax | Language Reference OR Quick Reference Card | Pattern Syntax |
| Modifiers | Language Reference OR Quick Reference Card | Modifiers |
| Metadata keys | Language Reference OR Quick Reference Card | Metadata |
| Common progressions | Quick Reference Card | Common Chord Progressions |
| Parsing algorithm | Parser Specification | Phase 1-4 |
| JSON format | JSON Structure | All sections |
| Error messages | Language Reference OR Parser Spec | Common Errors / Error Catalog |

---Quick Reference Card
- **Type**: Cheat sheet
- **Audience**: All users
- **Length**: ~300 lines (1-2 pages)
- **Format**: Fast lookup tables and examples
- **Includes**: All symbols, metadata keys, modifiers, common progressions, error codes
- **Best for**: Quick syntax lookup without reading full documentation

### 

## 📖 Document Summaries

### SongCode Quick Start Tutorial
- **Type**: Tutorial
- **Audience**: Beginners
- **Length**: ~3,000 words
- **Format**: Step-by-step lessons
- **Includes**: Examples, exercises, practice songs
- **Best for**: Learning by doing

### SongCode Language Reference
- **Type**: Reference
- **Audience**: All users
- **Length**: ~7,000 words
- **Format**: Comprehensive syntax guide
- **Includes**: All features, examples, best practices, common errors
- **Best for**: Looking up specific syntax or features

### Parser/Generator Specification
- **Type**: Technical specification
- **Audience**: Developers implementing the parser
- **Length**: ~6,000 words
- **Format**: Algorithm descriptions, pseudocode
- **Includes**: 4-phase parsing process, validation rules, error handling
- **Best for**: Building the parser from scratch

### Livenotes JSON Structure Reference
- **Type**: Data format specification
- **Audience**: Developers consuming the JSON
- **Length**: ~5,000 words
- **Format**: Object/property descriptions
- **Includes**: Complete schema, examples, usage notes
- **Best for**: Understanding the output format

---

## 🔍 Quick Lookup Table

### Symbols & Syntax

| What I need | Where to find it |
|-------------|------------------|
| `;` meaning | Language Ref > Pattern Syntax > Measures |
| `%` meaning | Language Ref > Pattern Syntax > Chord or Measure Repeat |
| `_` meaning | Language Ref > Pattern Syntax > Silence |
| `=` meaning | Language Ref > Pattern Syntax > Chord Remover |
| `[...]n` syntax | Language Ref > Pattern Syntax > Loops |
| `:` meaning | Language Ref > Pattern Syntax > Line Breaks |
| `_n` in lyrics | Language Ref > Lyrics > Measure Count |
| `***...***` | Language Ref > Special Markers |
| `:::...:::` | Language Ref > Special Markers |
| `@key` metadata | Language Ref > Metadata |
| `$n` patterns | Language Ref > Pattern Definitions |
| `_repeat` | Language Ref > Modifiers |
| `_cutStart` | Language Ref > Modifiers |
| `_cutEnd` | Language Ref > Modifiers |
| `_before` | Language Ref > Modifiers |
| `_after` | Language Ref > Modifiers |

### Concepts

| What I need | Where to find it |
|-------------|------------------|
| How patterns work | Language Ref > Pattern Definitions |
| How sections work | Language Ref > Sections |
| How timing works | Language Ref > Lyrics > Measure Count |
| How chords are written | Language Ref > Chord Notation |
| How to repeat patterns | Language Ref > Modifiers > _repeat |
| How to shorten sections | Language Ref > Modifiers > _cutEnd and _cutStart |
| Valid metadata keys | Language Ref > Metadata |
| Error messages | Language Ref > Common Errors |

### Implementation

| What I need | Where to find it |
|-------------|------------------|
| Parsing metadata | Parser Spec > Phase 1 > Step 1.2 |
| Parsing patterns | Parser Spec > Phase 1 > Step 1.3 |
| Parsing sections | Parser Spec > Phase 1 > Step 1.4 |
| Pattern transformation | Parser Spec > Phase 2 |
| Validation rules | Parser Spec > Phase 3 |
| Prompter generation | Parser Spec > Phase 4 |
| JSON structure | JSON Structure Ref > All |
| Pattern object | JSON Structure Ref > Patterns Object |
| Section object | JSON Structure Ref > Sections Array |
| Prompter object | JSON Structure Ref > Prompter Array |

---

## 📊 Complexity Levels

### Level 1: Basic Song (Start here!)
- One pattern
- One or two sections
- Simple chord progressions
- Basic timing

**Example**:
```songcode
@name Simple Song
@bpm 100

$1
G;C;D;G

Verse
$1
--
First line _2
Second line _2
```

**Documents**: Quick Start Tutorial (Lessons 1-5)

---

### Level 2: Multi-Section Song
- Multiple patterns
- Verse, chorus, bridge
- Pattern reuse
- Modifiers like `_repeat`

**Example**:
```songcode
@name Full Song
@bpm 120

$1
G;C;D;G

$2
Em;C;G;D

Verse
$1
--
...

Chorus
$2
_repeat 2
--
...
```

**Documents**: Quick Start Tutorial (Lessons 6-8), Language Reference

---

### Level 3: Complex Song
- Loops in patterns
- Advanced modifiers (`_cutEnd`, `_before`, `_after`)
- Tempo changes
- Special markers
- Multiple chords per measure

**Example**:
```songcode
@name Complex Song
@bpm 120

$1
[A;G;D G]3
:
E;[F E F G]

Bridge
@bpm 140
$1
_cutEnd 2
_after G;G
--
...
```

**Documents**: Language Reference (all sections), Parser Specification

---

## 🎓 Learning Progression

```
Beginner          Intermediate        Advanced          Expert
   │                    │                  │               │
   ▼                    ▼                  ▼               ▼
Basic syntax      Pattern reuse      Loops &          Parser
Simple songs      Modifiers          Timing           Implementation
                  Multiple           Optimization     
                  sections
   │                    │                  │               │
   ▼                    ▼                  ▼               ▼
Quick Start       Quick Start        Language Ref     Parser Spec
Lessons 1-5       Lessons 6-10       All sections     + JSON Ref
```

---

## 💡 Tips for Using This Documentation

### For Quick Answers
1. Check this index first
2. Use the lookup tables above
3. Jump directly to the relevant section

### For Learning
1. Follow the Quick Start Tutorial sequentially
2. Try examples as you read
3. Reference the Language Reference when stuck

### For Implementation
1. Read Language Reference to understand the format
2. Study Parser Specification for algorithms
3. Use JSON Structure Reference for output format
4. Refer to Highway to Hell example for real-world case

### For Reference
1. Bookmark the Language Reference
2. Keep the lookup tables handy
3. Search within documents using Ctrl/Cmd+F

---

## 📝 Notes

- All documents are interconnected with cross-references
- Start simple and add complexity gradually
- Examples progress from basic to advanced
- Error messages guide you to solutions

---

## ✨ You're Ready!

Pick your path above and start exploring. The documentation is designed to support you whether you're writing your first song or implementing a complete parser.

**Happy coding and composing! 🎵**
