# Metadata

## Keys and values

### @name

- Valid values : string without line breaks with a max length of 100 characters
- Default value (if not specified) : null

```songcode
@name Blitzkrieg bop
```

### @artist

- Valid values : string without line breaks with a max length of 100 characters
- Default value (if not specified) : null

```songcode
@artist The Ramones
```

### @original

- Valid values : valid values of Base Chord (see [./chords.md])
- Default value (if not specified) : null

```songcode
@original Dm
```

### @capo

- Valid values : number between 1 and 20
- Default value (if not specified) : null

```songcode
@capo 3
```

### @bpm

- Valid values : number between 0 and 400
- Default value (if not specified) : null

```songcode
@bpm 120
```

### @time

- Valid values : valid values of Time Signature (see [./tempo.md])
- Default value (if not specified) : 4/4

```songcode
@time 3/4
```

### @warning

- Valid values : string without line breaks with a max length of 100 characters
- Default value (if not specified) : null

```songcode
@warning Tricky break before solo
```

### @end

- Valid values : string without line breaks with a max length of 100 characters
- Default value (if not specified) : null

```songcode
@end On 1 after last measure
```

## Computed values

### pitch

- Valid values : multiples of 0,5 between -10 and 10
- Comparison between the metadata's "original" and the first chord root of the song written in the file
- If "original" is not specified in the metadata, no pitch calculation

## Data structure

```json
{
    "meta": {
        "name": "Blitzkrieg bop",
        "artist": "The Ramones",
        "original": "Dm",
        "capo": 3,
        "pitch": -1.5,
        "bpm": 120,
        "time": {
            "numerator": 4,
            "denominator": 4
        },
        "warning": "Tricky break before solo",
        "end": "On 1 after last measure",
    }
}
```