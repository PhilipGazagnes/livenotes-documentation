# Integration Examples

These examples demonstrate how to use the `@livenotes/songcode-converter` package in your applications.

## Setup

First, install the package:

```bash
npm install @livenotes/songcode-converter
```

## Examples

### 1. `node-example.js` - Basic Node.js Usage

A simple example showing how to convert SongCode to JSON in a Node.js application.

**Run it:**
```bash
node node-example.js
```

**What it demonstrates:**
- Creating a converter instance
- Converting a complete song with lyrics
- Accessing the result sections and prompter
- Basic error handling

---

### 2. `typescript-example.ts` - TypeScript Usage

Shows type-safe usage with TypeScript's type system and proper error handling.

**Run it:**
```bash
npx ts-node typescript-example.ts
# or compile and run:
npx tsc typescript-example.ts && node typescript-example.js
```

**What it demonstrates:**
- Type imports (`LivenotesJSON`, `SongCodeError`)
- Type-safe property access
- TypeScript error narrowing with `instanceof`
- Accessing typed properties

---

### 3. `error-handling.js` - Error Handling Patterns

Comprehensive example of error handling strategies.

**Run it:**
```bash
node error-handling.js
```

**What it demonstrates:**
- Catching and handling `SongCodeError` instances
- Different types of validation errors
- Error code and line number access
- Building a validation helper function
- Graceful error recovery

---

## Common Patterns

### Basic Conversion

```javascript
const { SongCodeConverter } = require('@livenotes/songcode-converter');
const converter = new SongCodeConverter();
const result = converter.convert(songCodeString);
```

### Error Handling

```javascript
try {
  const result = converter.convert(songCodeString);
  // Use result
} catch (error) {
  if (error instanceof SongCodeError) {
    console.error(`Error: ${error.message}`);
    console.error(`Line: ${error.line}`);
    console.error(`Code: ${error.code}`);
  }
}
```

### TypeScript

```typescript
import { SongCodeConverter, SongCodeError } from '@livenotes/songcode-converter';
import type { LivenotesJSON } from '@livenotes/songcode-converter';

const converter = new SongCodeConverter();
const result: LivenotesJSON = converter.convert(songCode);
```

## More Information

- **Package Documentation**: [npm package](https://www.npmjs.com/package/@livenotes/songcode-converter)
- **GitHub Repository**: [livenotes-sc-converter](https://github.com/PhilipGazagnes/livenotes-sc-converter)
- **SongCode Language**: [Quick Start Tutorial](../../songcode-quick-start-tutorial.md)
- **JSON Format**: [Livenotes JSON Structure](../../livenotes-json-structure-reference.md)

## Testing Your Code

To test with the provided conversion examples:

```javascript
const fs = require('fs');
const { SongCodeConverter } = require('@livenotes/songcode-converter');

const converter = new SongCodeConverter();

// Load a test file
const songCode = fs.readFileSync('../convertion-examples/01-basic/simple-verse-chorus.sc', 'utf8');
const result = converter.convert(songCode);

console.log('Converted successfully!');
console.log('Sections:', result.sections.length);
```

See the `../convertion-examples/` directory for many more test files with their expected JSON outputs.
