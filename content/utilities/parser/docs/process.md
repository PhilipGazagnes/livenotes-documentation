# Parser process

Given a songcode file, we describe here how to parse it and generate the Livenotes JSON from it.

## Init the Livenotes JSON

```json
{
    "meta": {},
    "patterns": {},
    "sections":[],
    "prompter": []
}
```

I call this object `livenotes` in the rest of the process

## Part 1 : First run

Split the file in 3 sections :

- Metadata
- Patterns
- Sections

### Metadata

- Is optional
- Must be written at the beginning of the file
- All metadata lines must be consecutive
- There can be empty lines between metadata lines
- Metadate lines start with a valid `@` key, and depending on the key, contains a valid value (see [./metadata.md])
- If there are non-consecutive metaData lines throughout the file, the file isn't valid, the whole process stops (with clear feedback about the problem)
- If the keys or / and values aren't valid, the file isn't valid, the whole process stops (with clear feedback about the problem)
- Metadata is straightforward and can be stored in `livenotes.meta`

### Patterns

- Are optional
- Are blocks of lines without line breaks
- Come immediately after the metadata
- First line of a block starts with a `$`
- First line is pattern identifier : `$` + number (like `$1`)
- Following lines before empty line contain pattern description
- All pattern blocks must be consecutive
- If there are non consecutive pattern blocks throughout the file, the file isn't valid, the whole process stops (with clear feedback about the problem)
- There can be empty lines between pattern blocks
- All pattern descriptions can be stored in temporary constants named by their identifier (`$1`, ...)

### Sections

- After optional metadate and patterns, we have the sections in the songCode file
- a section is a group of lines without empty spaces
- an empty space (or multiple empty spaces) means section change
- Each section adds a section object in output.sections
- Section object :

```json
{
    "name": null,
    "comment": null,
    "pattern": {
        "id": null,
        "bpm": null,
        "timeSignature": null,
        "repeat": null,
        "cutStart": null,
        "cutEnd": null,
        "before": null,
        "after": null,
        "measures": null,
    },
    "lyrics": []
}
```

#### Name and comment

- First line of a section block contains the name of the section and a comment
- The `!` sign marks the separation between the name and the comment
- Like this : Section name!Comment
- The `!` sign is a code separator and is not part of the name or the comment
- name and comment go in `livenotes.name` and `livenotes.comment`

#### Pattern

- We can eventually have metadata scoped to the section here (see [./patterns-meta-and-modifiers.md])
- All lines after eventual metadata, and before either a pattern modifier line (start with `_`), a line containing `--` or the section end, is the pattern desciption
- The pattern description can contain a pattern identifier (`$1`, ...)
- Pattern identifiers need to be replaced with the associated pattern description (stored previousely)
- The `livenotes.patterns` will contain keys "A", "B", "C", and so on
- The pattern description of the first section of the song is stored in `livenotes.patterns.A.sc` as a string ("A" becomes the id of the pattern)
- The section object > "pattern" object is completed starting by reporting the id of the pattern (first section will be "A")
- If there are pattern modifiers, they are parsed and the rest of the pattern object of the section object is filled (with the metadata also)
- If "before" and "after" modifiers are set, `pattern.before` and `pattern.after` become objects
- The associated pattern descriptions go in `pattern.before.sc` and `pattern.after.sc`
- When analysing the next sections, the pattern description needs to be compared with pattern descriptions in `livenotes.patterns`
- If the pattern description matches one associated to a pattern id, then the sections gets this pattern id
- Or else, a new id is created in `livenotes.patterns` and gets the pattern description of the section
- and so on for all the sections
- the `pattern.measures` key stays of each section object is blank for the moment

#### Lyrics

- Lyrics come under a line containing only and exactly `--`
- Lyrics stop at the section end
- Lyrics optionally have a measure count at the end of the line (see [./lyrics.md])
- For each lyric line, the section object > "lyrics" array receives an item that is an array
- The first item of this array is the lyric string, the second is the number of measures it lasts for (or null of not specified)

## Part 2 : transformations

At this point, we got all the info from the songCode file into the `livenotes` object. Songcode file can now be left aside.

Parse the pattern descriptions :

- in `livenotes.patterns`, for each key, parse the pattern description in "sc" and store the result in "json"
- the parsing specifications are in `[./patterns-description.md]
- we then have for each key :
```
{
    sc: "...",
    json: "...",
    "measures": null
}
```
- the `measure` key stays blank for the moment
- the parser might encounter problems if the pattern description has errors, in this case the whole process stops (with clear feedback about the problem)
- there might be pattern descriptions in the section objects, in `pattern.before` and / or `pattern.after` : same treatment for those


## Part 3 : Make global verification

At this point, we got all the pattern descriptions traslated to JSON, with measure count.

- For each section pattern, the content of each measure must fit well with the time signature (check especially necessary when multiple chords in a measure). If not, the whole process stops with a comprehensive error
- Calculate the `measure` key of the `livenotes.patterns` items, by counting the measures + considering the loops
- Calculate the `measure` key of the patterns in `livenotes.sections`, taking as a starting point the measure count of the associated pattern id (calculated in the previous point), and applying the effect of the modifiers

- If at least one lyric line has a measure count, all lyric lines of the song must have a measure count
- Within a section, the addition of all measure count in the lyrics must be equal to the number of measures of the section pattern (calculated previousely)
- If verifications dont pass, the whole process stops (with clear feedback about the problem)

## Build prompter data

- the data goes in the `livenotes.prompter` array
- Start by adding a tempo item with bpm and time signature from the metadata
- parse the `livenotes.sections`
- if bpm or time signature change for the section, add a tempo item
- build a json with all the measures of the section, considering the repeats inside the pattern and the modificators
- We now have on one hand the lyric lines with their measure duration, and on the other hand the whole measure stack
- For each lyric line, we add a content item, and we cut/paste the measures from the measure stack into the item
- for each new items we start with "repeats" set to 1, and if, by dividing in half, we find that 2 subpatterns are equal, we delete the last subpattern and multiply by 2 the repeat value
- previous point is repeated as long as possible
