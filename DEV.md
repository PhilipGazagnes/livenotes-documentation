# SongCode Converter - Development Plan

**Project**: SongCode to Livenotes JSON Converter  
**Approach**: Test-Driven Development (TDD)  
**Implementation**: Node.js/TypeScript npm package  
**Created**: February 13, 2026

---

## 🎯 Project Overview

### Architecture: Hybrid Approach

#### Documentation Repository (livenotes-documentation)
- ✅ High-level specifications (parser-generator-specification.md)
- ✅ Language reference (songcode-language-reference.md)
- ✅ JSON structure (livenotes-json-structure-reference.md)
- ✅ Conversion examples (11 validated .sc/.json pairs)
- 🔲 **NEW**: Test suite specification (to create)

#### Converter Repository (livenotes-sc-converter)
- 🔲 Implementation code (TypeScript)
- 🔲 Unit tests (Jest)
- 🔲 Integration tests
- 🔲 Test fixtures (linked from documentation)
- 🔲 Package configuration
- 🔲 CI/CD pipeline

---

## 🧱 Converter Architecture: Breaking Into Bricks

The parser specification already defines the perfect modular breakdown into **4 phases** with **14 core bricks**:

### **Phase 1: First Pass Parsing**
1. **FileReader** - UTF-8 validation, line ending normalization
2. **MetadataParser** - Parse `@key value` lines
3. **PatternParser** - Parse `$n` pattern definitions
4. **SectionParser** - Parse sections with modifiers and lyrics

### **Phase 2: Pattern Transformation**
5. **ChordParser** - Parse chords into `[base, extension]`
6. **PatternTransformer** - Convert SongCode patterns to JSON arrays
7. **MeasureCounter** - Calculate measures with loops

### **Phase 3: Validation**
8. **TimeSignatureValidator** - Validate chords fit time signature
9. **MeasureValidator** - Validate section measure counts
10. **LyricTimingValidator** - Validate lyrics match measure counts

### **Phase 4: Prompter Generation**
11. **PatternExpander** - Expand loops and resolve references
12. **MeasureStacker** - Build measure stacks with modifiers
13. **LyricPairer** - Pair lyrics with measures
14. **PromptItemBuilder** - Create prompter items

### **Supporting Components**
- **ErrorHandler** - SongCode error formatting and reporting
- **TypeDefinitions** - TypeScript types for JSON structure
- **Converter** - Main orchestrator tying all phases together

---

## 📋 Development Phases

### **Phase A: Prepare Documentation** (1-2 days) ✅ COMPLETE

#### ✅ Already Complete
- [x] Parser specification with algorithms
- [x] Language reference with all features
- [x] JSON structure specification
- [x] 11 validated conversion examples (basic → edge cases)
- [x] Highway to Hell as real-world reference

#### ✅ Created
- [x] **test-suite-specification.md** - Comprehensive test cases
  - Extract test cases from parser spec
  - Organize by brick/component
  - Define input/output/error for each test
  - Reference conversion examples as integration tests
  - Framework-agnostic specifications

#### 🔲 To Update
- [ ] **README.md** - Add link to converter repo
- [ ] **INDEX.md** - Add developer/implementation section

---

### **Phase B: Setup Converter Repository** (1 day) ✅ COMPLETE

#### Project Initialization
- [x] Create git repository
- [x] Initialize npm package (`npm init`)
- [x] Setup TypeScript (`tsconfig.json`)
- [x] Configure Jest for testing
- [x] Setup ESLint and Prettier
- [x] Create `.gitignore`
- [x] Create initial README.md

#### Directory Structure
```
livenotes-sc-converter/
├── src/
│   ├── phase1/
│   │   ├── FileReader.ts
│   │   ├── MetadataParser.ts
│   │   ├── PatternParser.ts
│   │   └── SectionParser.ts
│   ├── phase2/
│   │   ├── ChordParser.ts
│   │   ├── PatternTransformer.ts
│   │   └── MeasureCounter.ts
│   ├── phase3/
│   │   ├── TimeSignatureValidator.ts
│   │   ├── MeasureValidator.ts
│   │   └── LyricTimingValidator.ts
│   ├── phase4/
│   │   ├── PatternExpander.ts
│   │   ├── MeasureStacker.ts
│   │   ├── LyricPairer.ts
│   │   └── PromptItemBuilder.ts
│   ├── types/
│   │   └── index.ts
│   ├── errors/
│   │   └── SongCodeError.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── phase1/
│   │   ├── phase2/
│   │   ├── phase3/
│   │   └── phase4/
│   └── integration/
│       └── fixtures/ (symlink to documentation examples)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

#### Configuration Files

**package.json**:
```json
{
  "name": "@livenotes/songcode-converter",
  "version": "0.1.0",
  "description": "Convert SongCode files to Livenotes JSON format",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "build": "tsc",
    "lint": "eslint src tests",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "keywords": ["songcode", "music", "chord", "parser", "converter"],
  "repository": {
    "type": "git",
    "url": "https://github.com/PhilipGazagnes/livenotes-sc-converter"
  }
}
```

#### Setup Tasks
- [x] Create all directories
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create jest.config.js
- [x] Create initial type definitions
- [ ] Setup CI/CD (GitHub Actions) - Optional for now
- [x] Link/copy test fixtures from documentation

---

### **Phase C: TDD Implementation** (2-4 weeks)

This is where the actual coding happens, following strict TDD principles.

#### TDD Workflow (repeat for each brick)

1. **Red Phase** - Write failing test
   ```typescript
   test('ChordParser: Parse simple major chord', () => {
     const parser = new ChordParser();
     expect(parser.parse('A')).toEqual(['A', '']);
   });
   // ❌ Test fails - not implemented
   ```

2. **Green Phase** - Write minimal code to pass
   ```typescript
   class ChordParser {
     parse(chord: string): [string, string] {
       // Minimal implementation
     }
   }
   // ✅ Test passes
   ```

3. **Refactor Phase** - Improve code quality
   - Clean up implementation
   - Remove duplication
   - Improve readability
   - Tests still pass ✅

#### Implementation Order

**Sprint 1: Phase 1 - First Pass Parsing** (Week 1)
- [ ] Brick 1: FileReader
  - [ ] Write tests for UTF-8 validation
  - [ ] Write tests for line ending normalization
  - [ ] Implement FileReader
  - [ ] Validate against test spec
- [ ] Brick 2: MetadataParser
  - [ ] Write tests for all metadata keys
  - [ ] Write tests for validation (ranges, formats)
  - [ ] Implement MetadataParser
  - [ ] Validate against test spec
- [ ] Brick 3: PatternParser
  - [ ] Write tests for pattern definitions
  - [ ] Write tests for pattern validation
  - [ ] Implement PatternParser
  - [ ] Validate against test spec
- [ ] Brick 4: SectionParser
  - [ ] Write tests for section parsing
  - [ ] Write tests for modifier parsing
  - [ ] Implement SectionParser
  - [ ] Validate against test spec
- [ ] Integration test: Parse minimal-song.sc (Phase 1 only)

**Sprint 2: Phase 2 - Pattern Transformation** (Week 2)
- [ ] Brick 5: ChordParser
  - [ ] Write tests for all chord types
  - [ ] Write tests for base/extension splitting
  - [ ] Implement ChordParser
  - [ ] Validate against test spec
- [ ] Brick 6: PatternTransformer
  - [ ] Write tests for pattern → JSON conversion
  - [ ] Write tests for loops, line breaks, special symbols
  - [ ] Implement PatternTransformer
  - [ ] Validate against test spec
- [ ] Brick 7: MeasureCounter
  - [ ] Write tests for measure counting
  - [ ] Write tests for loop expansion
  - [ ] Implement MeasureCounter
  - [ ] Validate against test spec
- [ ] Integration test: Transform patterns in simple-verse-chorus.sc

**Sprint 3: Phase 3 - Validation** (Week 3)
- [ ] Brick 8: TimeSignatureValidator
  - [ ] Write tests for time signature validation
  - [ ] Write tests for chord/beat validation
  - [ ] Implement TimeSignatureValidator
  - [ ] Validate against test spec
- [ ] Brick 9: MeasureValidator
  - [ ] Write tests for section measure counting
  - [ ] Write tests for modifier application
  - [ ] Implement MeasureValidator
  - [ ] Validate against test spec
- [ ] Brick 10: LyricTimingValidator
  - [ ] Write tests for lyric timing validation
  - [ ] Write tests for measure count matching
  - [ ] Implement LyricTimingValidator
  - [ ] Validate against test spec
- [ ] Integration test: Validate modifiers-demo.sc

**Sprint 4: Phase 4 - Prompter Generation** (Week 4)
- [ ] Brick 11: PatternExpander
  - [ ] Write tests for loop expansion
  - [ ] Write tests for pattern resolution
  - [ ] Implement PatternExpander
  - [ ] Validate against test spec
- [ ] Brick 12: MeasureStacker
  - [ ] Write tests for measure stacking
  - [ ] Write tests for modifier application
  - [ ] Implement MeasureStacker
  - [ ] Validate against test spec
- [ ] Brick 13: LyricPairer
  - [ ] Write tests for lyric/measure pairing
  - [ ] Implement LyricPairer
  - [ ] Validate against test spec
- [ ] Brick 14: PromptItemBuilder
  - [ ] Write tests for prompter item creation
  - [ ] Implement PromptItemBuilder
  - [ ] Validate against test spec
- [ ] Integration test: Complete conversion of highway-to-hell.sc

**Sprint 5: Integration & Polish** (Week 5)
- [ ] Main Converter orchestrator
- [ ] Error handling and reporting
- [ ] Run full integration test suite
  - [ ] 01-basic/minimal-song.sc
  - [ ] 01-basic/simple-verse-chorus.sc
  - [ ] 02-intermediate/pattern-reuse.sc
  - [ ] 02-intermediate/modifiers-demo.sc
  - [ ] 02-intermediate/loops-demo.sc
  - [ ] 02-intermediate/repeat-symbol.sc
  - [ ] 03-advanced/highway-to-hell.sc
  - [ ] 04-edge-cases/empty-measures.sc
  - [ ] 04-edge-cases/removers-demo.sc
  - [ ] 04-edge-cases/multi-chord-measures.sc
  - [ ] 04-edge-cases/cut-modifiers.sc
  - [ ] 04-edge-cases/extreme-modifiers.sc
- [ ] Performance optimization
- [ ] Documentation (JSDoc comments)
- [ ] README with usage examples

---

### **Phase D: Testing & Validation** (3-5 days)

#### Test Coverage Goals
- [ ] Unit test coverage: >90%
- [ ] Integration test coverage: 100% of examples
- [ ] Edge case coverage: All edge cases documented

#### Validation Checklist
- [ ] All 11 conversion examples produce correct output
- [ ] Highway to Hell matches exactly
- [ ] All error codes from spec are implemented
- [ ] Error messages are helpful and actionable
- [ ] Performance is acceptable (<100ms for typical songs)

#### Quality Gates
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] ESLint passing
- [ ] Code coverage >90%
- [ ] Integration tests passing

---

### **Phase E: Publishing & Documentation** (1-2 days)

#### NPM Publishing
- [ ] Verify package.json metadata
- [ ] Build production bundle
- [ ] Test installation from tarball
- [ ] Publish to npm (or private registry)
- [ ] Verify published package works

#### Documentation
- [ ] Update converter README with:
  - [ ] Installation instructions
  - [ ] Basic usage examples
  - [ ] API documentation
  - [ ] Link to specification docs
  - [ ] Contribution guidelines
- [ ] Update documentation repo with:
  - [ ] Link to converter package
  - [ ] Installation instructions
  - [ ] Integration examples

#### GitHub
- [ ] Setup repository
- [ ] Configure branch protection
- [ ] Setup GitHub Actions for CI
- [ ] Add badges (build status, coverage, npm version)
- [ ] Create releases/tags

---

## 🎓 TDD Best Practices

### Red-Green-Refactor Cycle
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### Test Principles
- **One assertion per test** (when possible)
- **Test behavior, not implementation**
- **Use descriptive test names** (reference test spec numbers)
- **Arrange-Act-Assert pattern**
- **Test edge cases and error conditions**

### Example Test Structure
```typescript
describe('ChordParser', () => {
  describe('parse()', () => {
    describe('simple chords', () => {
      test('2.1.1: parses simple major chord', () => {
        // Arrange
        const parser = new ChordParser();
        
        // Act
        const result = parser.parse('A');
        
        // Assert
        expect(result).toEqual(['A', '']);
      });
    });
    
    describe('error handling', () => {
      test('2.1.4: throws error for invalid chord', () => {
        const parser = new ChordParser();
        expect(() => parser.parse('X')).toThrow();
      });
    });
  });
});
```

---

## 📊 Progress Tracking

### Current Status: Ready for Sprint 1 🚀

- [x] **Phase A**: Prepare Documentation ✅
- [x] **Phase B**: Setup Converter Repository ✅
- [ ] **Phase C**: TDD Implementation ← **YOU ARE HERE**
  - [ ] Sprint 1: Phase 1 (Week 1)
  - [ ] Sprint 2: Phase 2 (Week 2)
  - [ ] Sprint 3: Phase 3 (Week 3)
  - [ ] Sprint 4: Phase 4 (Week 4)
  - [ ] Sprint 5: Integration (Week 5)
- [ ] **Phase D**: Testing & Validation
- [ ] **Phase E**: Publishing & Documentation

### Time Estimate: 5-6 weeks total

---

## 🔗 Cross-Repository Structure

### Documentation Repo (livenotes-documentation)
**Purpose**: Specifications and reference
- Language specification
- Parser algorithm specification
- Test suite specification
- Conversion examples
- JSON structure reference

### Converter Repo (livenotes-sc-converter)
**Purpose**: Implementation and tests
- TypeScript implementation
- Unit and integration tests
- NPM package configuration
- CI/CD pipeline
- Implementation-specific docs

### Links Between Repos
- Converter README links to documentation for specs
- Documentation README links to converter for implementation
- Test fixtures: symlink or copy from documentation examples
- Both repos reference each other in package.json and documentation

---

## 💡 Key Decisions

### Why TypeScript?
- ✅ Type safety matches JSON schema
- ✅ Excellent IDE support
- ✅ Easy to publish as npm package
- ✅ Good error messages during development
- ✅ Can generate type definitions for consumers

### Why Jest?
- ✅ Popular, well-documented
- ✅ Built-in coverage reporting
- ✅ Good TypeScript support
- ✅ Watch mode for TDD
- ✅ Snapshot testing capability

### Why Separate Repos?
- ✅ Specification is language-agnostic
- ✅ Implementation can evolve independently
- ✅ Could have multiple implementations (Python, Go, etc.)
- ✅ Clear separation of concerns
- ✅ Independent versioning

---

## 📚 Reference Documents

### In This Repo (livenotes-documentation)
- [Parser Specification](songcode/parser-generator-specification.md)
- [Language Reference](songcode/songcode-language-reference.md)
- [JSON Structure](songcode/livenotes-json-structure-reference.md)
- [Quick Start Tutorial](songcode/songcode-quick-start-tutorial.md)
- [Conversion Examples](songcode/convertion-examples/)
- **Test Suite Specification** (to be created)

### To Be Created (livenotes-sc-converter)
- README.md with usage examples
- API documentation
- Contributing guidelines
- Changelog

---

## ✅ Next Steps

1. **Immediate**: Create test-suite-specification.md in documentation repo
2. **Today**: Initialize converter repository structure
3. **This week**: Begin Phase 1 implementation (FileReader, MetadataParser)
4. **Next week**: Continue with Pattern transformation
5. **Week 3-4**: Validation and Prompter generation
6. **Week 5**: Integration testing and polish
7. **Week 6**: Publishing and documentation

---

**Last Updated**: February 13, 2026  
**Status**: Planning Phase - Ready to Begin Implementation
