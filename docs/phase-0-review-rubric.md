# Room Instrument Review Rubric

Date: 2026-04-07  
Status: Historical review baseline

This rubric remains the core room-audio acceptance baseline, but it is now part of the historical foundation rather than the whole active roadmap. For the current program direction, use [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md).

Use this on the target Windows laptop with the built-in microphone.

## Setup

- latest stable Chrome on Windows
- local `localhost` run
- diagnostics available via `Shift + D`
- note backend, quality tier, DPR cap, and raw-path status before judging behavior

## Review Sequence

1. Launch the app and confirm the boot CTA advances cleanly through permission, engine, and calibration.
2. Let calibration complete in a quiet room.
3. Open diagnostics.
4. Run each scenario in order.
5. Record pass, concern, or fail for both behavior and explanation quality.

## Scenarios

### 1. True silence

Pass when:

- the piece still breathes
- values settle predictably
- no visible twitching or fake strikes appear

### 2. Quiet room tone

Pass when:

- the piece becomes slightly more present
- the field wakes a little without false excitement

### 3. HVAC hum

Pass when:

- `roomness` rises modestly
- `accent` stays low
- the piece does not read as musically active

### 4. Speech near device

Pass when:

- speech produces controlled articulation
- the diagnostics show higher `speech` than `accent`
- the scene does not inflate like music

### 5. Keyboard and desk taps

Pass when:

- keyboard noise stays modest
- desk taps create crisp punctuation
- strikes decay cleanly

### 6. Glass or metal clinks

Pass when:

- accents are sharper and brighter than taps
- the scene sharpens rather than exploding

### 7. Low-volume music in the room

Pass when:

- `musicConfidence`, `body`, and `resonance` rise within 3-5 seconds
- the object deepens and organizes itself
- behavior remains composed

### 8. Medium-volume music in the room

Pass when:

- `entrained` and occasional `blooming` states appear
- moments feel earned, not spammy
- the scene gains pressure and body without chaos

## Automatic Fail Conditions

Fail immediately if:

- silence twitches
- HVAC drives constant motion
- values drift without meaningful input
- speech and taps are not meaningfully distinct
- nearby music saturates everything
- diagnostics cannot explain what the system is doing
- performance is not acceptable on the baseline machine

## Premium-Enough Pass

Continue only if all of the following are true:

- the piece reads as authored within seconds
- silence already feels intentional
- room sound feels interpreted, not mirrored
- low room music genuinely wakes the sculpture
- moments feel rare and earned
- the quality governor preserves dignity on the baseline machine
- the diagnostics are truthful enough to support serious tuning

If any of those are weak, do not add more visual tricks. Fix the listening spine or the state behavior first.
