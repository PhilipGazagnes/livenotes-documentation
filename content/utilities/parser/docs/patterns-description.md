# Pattern description parser

- has measures, repeaters, loopers, line breaks
- measures contain chords, repeaters, beat removers
- take the whole pattern description string and make line breaks after :
    - `;` (and delete this character)
    - `[`
    - `]x` (where x is a number)
- replace 
    - `[` with `"loopStart"`
    - `]x` with `"loopEnd:x"` (x is the number)
    - `:` with `"newline"`
- for the other lines (the measures), write them as a json array, for example : `Am % F =` becomes `["Am", "%", "F", "="]`
- for each chord, (anything except the `%` repeat sign, the `_` silence sign or the `=` remover sign), split it :
    - `[baseChord, extension]`
    - see [./chords.md] to know how to recognize the base chord
    - example : `Am7sus4` becomes `["Am", "7sus4"]`
    - if there are chords that dont match the proper chord notation, the whole process stops with a comprehensive error
