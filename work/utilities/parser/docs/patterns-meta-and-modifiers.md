## Patterns Meta and Modifiers

### Pattern meta

#### @bpm

- Same as in the metadata section
- Default value (if not specified) : null

#### @time

- Same as in the metadata section
- Default value (if not specified) : null

### Pattern modifiers

#### _repeat

- valid values : positive integer higher or equal to 2
- signification : value 1 means pattern is played 1 time, value 2 for 2 times, etc
- Default value (if not specified) : 1

#### _cutStart

- Valid values : a valid value of the Measure And Beats notation (see time.md)
- Default value (if not specified) : null

```songcode
_cutStart 2
```

#### _cutEnd

- Valid values : a valid value of the Measure And Beats notation (see time.md)
- Default value (if not specified) : null

```songcode
_cutEnd -2
```

#### _before

- Valid values : a valid value of Pattern Description

```songcode
_before Am D;E
```

#### _after

- Valid values : a valid value of Pattern Description

```songcode
_after D =
```