/**
 * Error Handling Example
 * 
 * Demonstrates proper error handling patterns with the SongCode converter.
 */

const { SongCodeConverter, SongCodeError } = require('@livenotes/songcode-converter');

const converter = new SongCodeConverter();

// Example 1: Invalid BPM
console.log('Example 1: Invalid BPM\n');
try {
  const invalidBpm = '@bpm 999\nVerse\nC;G;Am;F';
  converter.convert(invalidBpm);
} catch (error) {
  if (error instanceof SongCodeError) {
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Line: ${error.line || 'N/A'}\n`);
  }
}

// Example 2: Invalid chord notation
console.log('Example 2: Invalid Chord\n');
try {
  const invalidChord = 'Verse\nH;G;Am;F'; // H is not a valid chord
  converter.convert(invalidChord);
} catch (error) {
  if (error instanceof SongCodeError) {
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Line: ${error.line || 'N/A'}\n`);
  }
}

// Example 3: Mismatched lyric timing
console.log('Example 3: Mismatched Lyric Timing\n');
try {
  const mismatchedLyrics = `Verse
C;G;Am;F
C;G;Am;F
--
First line _2
Second line _3
`; // 2 + 3 = 5, but pattern has 2 measures
  converter.convert(mismatchedLyrics);
} catch (error) {
  if (error instanceof SongCodeError) {
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Line: ${error.line || 'N/A'}\n`);
  }
}

// Example 4: Successful conversion with validation
console.log('Example 4: Successful Conversion\n');
try {
  const validSong = `@bpm 120

Verse
C;G;Am;F
C;G;Am;F
--
Walking down the street _2
Singing to the beat _2
`;
  
  const result = converter.convert(validSong);
  console.log('✅ Conversion successful!');
  console.log(`Sections: ${result.sections.length}`);
  console.log(`Prompter items: ${result.prompter.length}\n`);
  
} catch (error) {
  console.error('Unexpected error:', error);
}

// Example 5: Validation helper function
function validateAndConvert(songCode) {
  try {
    const result = converter.convert(songCode);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    if (error instanceof SongCodeError) {
      return {
        success: false,
        data: null,
        error: {
          code: error.code,
          message: error.message,
          line: error.line
        }
      };
    }
    // Re-throw unexpected errors
    throw error;
  }
}

console.log('Example 5: Validation Helper\n');
const result1 = validateAndConvert('@bpm 120\nVerse\nC;G;Am;F');
console.log('Valid song result:', result1.success);

const result2 = validateAndConvert('@bpm 999\nVerse\nC;G;Am;F');
console.log('Invalid song result:', result2.success);
if (!result2.success) {
  console.log('Error:', result2.error.message);
}
