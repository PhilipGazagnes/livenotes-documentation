# SongCode Syntax Reference

Complete reference for the SongCode language.

## Metadata

Metadata lines start with `@` and provide information about the song. They are written at the beginning of the file. They are optional.

### Metadata Fields

```songcode
@originalKey D
// The key of the original version (usually the studio version). This
// is useful to communicate with other musicians ("we play 1 tone under
// the original" is generally easier to understand than "we play in C").

@guitarCapo 5
// When this field is written, it is considered that the chords written
// in this file are played on guitar from the capo's position.
// The real chords are then calculated.
// For ex, with capo 5, an Em is a Am in reality. 

@bpm 112
@timeSignature 3/4
// The bpm and time signature can be overriden in the song structure, if there are
// tempo variations. By default, bpm is 120 and timeSignature is 4/4.

@warning Something to be careful about
// Anything you need to remember and might forget. In Livenotes Book, a red block will appear before the first lyrics. In Livenotes Prompter, it will appear at the very beginning of the video, before the beginning of the song.

@end Describe how you end the song
// In Livenotes Book, it will appear after the last section name. In Livenotes Prompter, it will appear as an aside information panel at the end of the song.
```

## Patterns

Patterns start with `$` and come immediately after the metadata. After the `$` comes a number. The combination of the dollar sign and the number form a constant name that can be then be used in the sections.

Under the constant (for example `$1`), comes the pattern description.

### Pattern description

#### Measures

Measures are separated by `;` or line breaks. According to the time signature, the number of chords within a measure translates like this :

- 1 chord : the whole measure is on that chord
- 2 chords : half of the measure is on the first chord, the second half on the second chord
- etc.

##### Attention : Time signatures and measure content

Some time signatures dont divide to some numbers. For example, 3/4 doesn't divide to 2. If your time signature is 3/4 and you have 2 chords in the measure, an error will pop to ask you to fix that. You can either put one chord or 3.

##### Measure shortening

You can shorten a measure, for example if the time signature is 4/4 and you need a 2/4. Instead of writing a chord, write `=`. This means "this part of the measure doesn't exist".

Example (time signature 4/4) :

```songcode
Em G;Em =;G
```

This will translate in :
- measure 1 (4 beats) : 2 beats of Em, 2 beats of G
- measure 2 (2 beats) : 2 beats of Em
- measure 3 (4 beats) : 4 beats of G

Other example (time signature 4/4) :

```songcode
Em;Em G Am =;G
```

This will translate in :
- measure 1 (4 beats) : 4 beats of Em
- measure 2 (3 beats) : 1 beat of Em, 1 beat of G, 1 beat of Am
- measure 3 (4 beats) : 4 beats of G

##### Chord repetition

If the same chord is played over and over, instead of writing it multiple times, you can use the `%` sign. It means "same as the value before". It can be used multiple times in a row, in that case it repeats the value it's originally copying. It works in a measure, but also to copy measures. It also repeats the `=` sign.

Example :

```songcode
Em % % Am
```

Result : Em Em Em Am

Other example :

```songcode
Em;%;%;%;Am;%;Em;%
```

Result : 4 measures of Em, 2 measures of Am, 2 measures of Em

Other example :

```songcode
Em;=;%;%
```

Result : 1 beat of Em

##### Silences

You can use the `_` sign to say "silence".

##### Multiple measures repetitions

You can also repeat measure blocks using the `[` and `]` signs. Before the first measure of the sequence you want to repeat, write `[`, and after the last measure, write `]` and immediately after with no blank space, the number of repetitions you want.

After the `[` sign, you can immediately write the chord sequence, or do a line break and write the chord sequence, depending on what makes more sense to you.

After the number of repetitions, write a `;` or do a line break to write the rest of the pattern

Example :

```songcode
[Em;G;Bm;D]2;[A B]3
Am
```

Result : Em;G;Bm;D;Em;G;Bm;D;A B;A B;A B;Am

```songcode
[Em;G]2

[
Em;G
]2
```

Result : These 2 ways of writing produce identical result : Em;G;Em;G

##### Line breaks in the pattern

You may want to break the pattern into multiple lines, use the `:` sign to make it easier to read or if it makes sense for the music you are describing. You will see the result on the apps you use to visualise your live notes.

You can use the `:` sign must before and after a line break, or between 2 chords.

Example :

```songcode
Em Am;G C:[D]4

Em Am;G C
:
[D]4
```

Result : both ways produce the same result and when visualising your live notes, you will see a first line with Em Am;G C and a second with you 4 measures of D.

#### Chords

##### Chord root part

Chords must be written in the international notation (A,B,C...G). They start with a root note, followed by an optional alterator (# or b). This part will be transposed in the apps if you choose to visualise the chords in a transposed version.

Accepted values :
A, A#, Ab
B, Bb
C, C#
D, Db, D#
E, Eb
F, F#
G, Gb, G#

Livenotes isn't strict on alterations. Ab and G# are the same note, and the music community would prefer Ab, but feel free to use what you are comfortable with.

##### Chord attributes

After the root part of the chord, for example F#, you can add what you want, without blank space. For example : F#m7M. When using the transposer, this part will not be changed.

## Sections

Sections define the structure of your song. You can have as many as you want but keep in mind that in some visualisation mode, too much info can be hard to read.

Sections contain The name of the section, the pattern, the lyrics.

A section block has no blank line. Blank lines means the section is finished.

### Section name

The section block starts with a section name. You can write what ever makes sense for your song, for example "chorus" or "verse", "big beat bridge", "quiet break", ... The name must be written on a single line.

#### Section comments

Afer the section name you can write `!` followed by some text. This will appear as a comment in the visualisers. It must be written on the same line with no line break.

Example

```songcode
Chorus!starts quiet
```

### Section pattern

One line uner the section name, write the chords. You can use the pattern constants you declared at the beginning of the file. You can write chords directly. You can combine both.

Example

```songcode
Intro!build up
$1

Intro!build up
$1
Em;Am
```

#### Pattern exceptional modificators

It sometimes happens that a section has the same pattern than another, but starts or ends different. In a logic of not rewriting things that are similar but not quite, SongCode allows you to indicate that a portion of the pattern is not played at the beginning or at the end, or something is added before or after.

Note: in case of a pattern repetition, the modificators only to the first and last repetitions, the inside patterns remain unchanged.

On Livenotes Book, this will appear as an info in the section names and in the lyrics. On Livenotes Prompter, the chords under the lyrics will adapt accordingly.

In case of frequent or complex modifications, you might prefer writing a new pattern rather than applying unreadable modifications to an existing pattern. Choice is yours.

You write these modificators right under the pattern on a new line.

##### Pattern repetition

You can indicate that the pattern is repeated with the `_repeat` modifier

Example

```songcode
Verse
$1
_repeat 8
```

Result: in the visualiser, it will show that the pattern is played 8 times.

##### cutEnd & cutStart

`_cutStart` and `_cutEnd` allow you to remove a part of the start, and a part of the end. You then write the number of measures or / and beats that you want to remove, by writing the number of measures, then a `-`, then the number of beats. If you just want to remove a couple of beats from a measure, you can start with the `-` and write the beats. Be aware that this will consider the measures of the pattern, with eventual measure shortening. Be also aware that if the number of beats you write is higher than the number of beats of the measure, it will only consider the number of beats of the measure (and not remove beats from the next measures). For example :

_cutStart 1    // pattern starts at the second measure
_cutStart 1-2  // pattern starts at the 3rd beat of the second measure
_cutStart 1-6  // pattern starts at the third measure (1 measure + 4 beats of the second measure, so all of it. The 2 extra beats are "lost")
_cutStart 2    // same result as above, just a cleaner way to write it
_cutEnd -2     // pattern ends 2 beats before the end of the last measure

##### before & after

`_before` and `_after` allow you to write a pattern that should be played before or after the section pattern. Use the same syntax described in the Patterns chapter to write down the chords.

_before A;%;%
_after D C Em G;D

### Lyrics

If the section contains lyrics, skip a line, write `--`, skip a line, and write the lyrics without any blank line. Line breaks are important here, that's the way they will display in the visualisers (1 line - 1 lyric bloc). Especially in prompter mode.

Example

```songcode
Verse
$2
_skipend 1
--
If you want my future, forget my past
If you wanna get with me, better make it fast
Now don't go wasting my precious time
Get your act together we could be just fine
```

#### Information in lyrics

Some sections may not need lyrics but information instead, like "solo" if the section is a guitar solo section. To do this, you can write between three stars : `***Solo***`. This will appear as an information in the visualisers. You can also write `:::Break:::` : this is a "silent" information, that will appear only in visualisations for musicians (if you show lyrics to the audience, it will be hidden).

#### Male / female coloration for duos

You can highlight lyrics in blue or red for male / female (or other duets). To do so, wrap the lyrics you want to highlight between `{m{`...`}}` or `{f{`...`}}` (m for male, f for female).

Example

```songcode
{l{Où t'étais ?}}
{m{Invité par des potes à une te-fê
On s'amusait bien, j'n'ai pas vu l'heure qu'il était}}
{l{Ah ouais ?}}
{m{C'est vrai !}}
{l{j'te connais par cœur
J'aimerais savoir pourquoi tu agis comme un voleur}}
```

#### TODO : +++ (voir si inclus ou si on dégage)

#### Beats count on lyrics

This is only useful for Livenotes Prompter. In order to tell the prompter how many beats each lyric line lasts, and allow it to move on to the next line in perfect sync with the backing track, you can add `_` immediately followed by the number of measures, at the end of each lyric line.

Example :

```songcode
So sally can wait, she knows it's too late _2
As she's walking on by _2
```

Be aware that this considers the remaining measures from the pattern of the section. If ever there is a shortened measure in the pattern, the measure count for a lyric line translates into the number of beats of the remaining measures of the section pattern.

The video generator app needs the pattern measure length and the count of `_x` distributed to be strictly equal.

## Best Practices

1. **Be consistent** - Choose a style and stick with it
2. **Use sections** - Structure makes songs easier to navigate
3. **Add metadata** - Especially key, tempo, and capo
4. **Comment when needed** - Add notes for important performance details
5. **Space for clarity** - Use empty lines to group related content
