/**
 * TypeScript Example
 * 
 * Type-safe usage of the SongCode converter with TypeScript.
 */

import { SongCodeConverter, SongCodeError } from '@livenotes/songcode-converter';
import type { LivenotesJSON } from '@livenotes/songcode-converter';

// Create a converter instance
const converter = new SongCodeConverter();

// Example SongCode
const songCode = `@bpm 140
@time 4/4

Intro
A;E;D;A
--

Verse
A;D;E;A
A;D;E;A
--
Rock and roll all night _2
We're gonna party right _2
`;

// Convert with type safety
try {
  const result: LivenotesJSON = converter.convert(songCode);
  
  console.log('✅ Conversion successful!\n');
  
  // Access typed properties
  console.log('Sections:');
  result.sections.forEach((section, index) => {
    console.log(`  ${index + 1}. ${section.name} (${section.measures.length} measures)`);
  });
  
  console.log('\nPrompter items:');
  result.prompter.forEach((item, index) => {
    if (item.type === 'tempo') {
      console.log(`  ${index + 1}. Tempo change to ${item.bpm} BPM`);
    } else if (item.type === 'content') {
      console.log(`  ${index + 1}. ${item.name}: ${item.chords.length} measures`);
    }
  });
  
} catch (error) {
  // Type-safe error handling
  if (error instanceof SongCodeError) {
    console.error('❌ SongCode Error:');
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    if (error.line !== undefined) {
      console.error(`Line: ${error.line}`);
    }
  } else {
    console.error('❌ Unexpected error:', error);
  }
}
