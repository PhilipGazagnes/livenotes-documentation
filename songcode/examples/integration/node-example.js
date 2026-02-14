/**
 * Simple Node.js Example
 * 
 * Basic usage of the SongCode converter in a Node.js application.
 */

const { SongCodeConverter } = require('@livenotes/songcode-converter');

// Create a converter instance
const converter = new SongCodeConverter();

// Example SongCode
const songCode = `@bpm 120
@original G

Verse
G;C;D;G
G;C;D;G
--
Walking down the road today _2
Sunshine lights my way _2
Feeling good and free _2
It's where I want to be _2

Chorus
C;G;D;G
C;G;D;G
--
This is my song _2
Singing all day long _2
Won't you sing along _2
Join me in this song _2
`;

// Convert SongCode to Livenotes JSON
try {
  const result = converter.convert(songCode);
  
  console.log('✅ Conversion successful!\n');
  console.log('Sections:', result.sections.length);
  console.log('Prompter items:', result.prompter.length);
  console.log('\nFull JSON:');
  console.log(JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Conversion failed:');
  console.error(error.message);
  if (error.line) {
    console.error(`Line ${error.line}: ${error.code}`);
  }
}
