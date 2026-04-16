# VisuLive Operator Test Guide

Date: 2026-04-08  
Status: Active operator guide

This is the practical guide for the first serious test pass.

Use it when you want to run the app, steer it intentionally, and judge whether the current build is actually on track.

## Who This Is For

Use this guide if you are:
- testing the current build on the target machine
- trying to understand what the controls really do
- trying to decide whether the piece is behaving like the product we intended

## Before You Start

Use:
- Windows laptop or desktop
- latest stable Chrome
- local `localhost` run
- the input path you actually plan to use first

Recommended first evaluation order:
- `Music On This PC` first if the music source is this computer
- built-in laptop mic first if you are specifically validating room listening

Why:
- direct PC audio is the cleanest way to judge musical responsiveness and visual spend
- the built-in mic is still the harshest honest room-input case

Recommended first source order:
1. `Music On This PC`
2. `Music In The Room`
3. `Big Show Hybrid`

Why:
- `Music On This PC` is now the cleanest way to judge musical responsiveness when the music source is this computer
- `Music In The Room` tells you whether the room interpretation is dignified when speakers are in the space
- `Big Show Hybrid` tells you whether direct music and room life can coexist well

## Quick Review Path

If you just want the cleanest first serious pass, do this:

1. Run `npm run dev`.
2. Open Chrome.
3. Click `Music On This PC` if this computer is playing the music.
4. Click the start button that matches the chosen path.
5. In the Chrome share picker, choose the music source and make sure audio sharing is enabled.
6. Let calibration finish with playback still quiet or paused.
7. Start the music.
8. Press `F` for fullscreen.
9. If needed, press `M` and adjust only:
   - `Wake`
   - `Intensity`
   - `Show Scale`
   - `World Activity`
10. Press `Shift + D` if something feels wrong and you need the truth panel.

If you are running a serious review pass instead of a casual look:

- turn on `Auto Capture`
- turn on `Auto Save To Folder`
- optionally turn on `Proof Stills`
- keep the pass clean instead of adjusting controls continuously
- finish by reviewing the analyzer report and writing a short review note

If you are testing speakers in the room instead of music on this computer, use `Music In The Room` instead of `Music On This PC`.

## Launch Sequence

1. Run:
   - `npm install`
   - `npm run dev`
2. Open the local URL in Chrome.
3. Choose how you want to start:
   - `Music On This PC`
   - `Music In The Room`
   - `Big Show Hybrid`
   - only use `Manual Input Setup` if you specifically want to override the source path by hand
4. Put the room into its normal baseline state.
   HVAC is fine if it is normally on.
   Music should be off for calibration when the microphone is part of the source.
5. Click the start button that matches the chosen path.
6. Grant the requested browser permissions.
7. If you chose `Use PC Audio` or `Use Both`, Chrome will open a share picker.
   Choose a tab, window, or screen source and make sure audio sharing is enabled.
8. Stay relatively quiet for calibration if the microphone is part of the source.
9. After calibration finishes, bring the music in if the test depends on room playback.

Do not calibrate with music already playing unless you are intentionally testing that case.

## Serious Review Standard

A serious pass is no longer just "did it feel better."

The current review cadence is:

1. one `Music On This PC` or AFQR-style primary benchmark batch
2. one `Music In The Room` quiet room-floor batch
3. one broader show-coverage batch

Each serious pass should end with:

- `npm run benchmark:validate`
- analyzer report review
- optional proof-still review
- one short review note
- a verdict against `truth`, `governance`, `coverage`, and `taste`

Keep fullscreen room-read on the target machine in scope for every major visual judgment.

## Choose The Right Input Mode

If you just want the simplest choice:
- `Music On This PC` = `Use PC Audio` + `Surge`
- `Music In The Room` = `Use Microphone` + `Music`
- `Big Show Hybrid` = `Use Both` + `Surge`

These quick starts are now the best operator-facing first buttons for music use.

### `Use Microphone`

Use it when:
- the point is the room itself
- music is playing from speakers in the space
- speech and room transients should matter

### `Use PC Audio`

Use it when:
- the music source is this computer
- you want stronger, cleaner musical response

This is now the simplest path when you mostly care about how good the show feels with music playing on the same PC.

### `Use Both`

Use it when:
- you want the direct musical body from the computer
- but you still want room life and local transients to matter

## First-Pass Setup

If you want a strong first impression for music, start here:

- Quick start: `Music On This PC` if the computer is the music source
- Quick start: `Music In The Room` if speakers are in the space
- Quick start: `Big Show Hybrid` if you want the biggest direct-audio-plus-room reaction

- Preset: leave the quick start as-is first
- Wake: `75-85`
- Intensity: `75-92`
- Show Scale: `68-88`
- World Activity: `62-84`
- Accent Bias: `Sharper Rhythm`

If you want the loudest color/trippy first impression:
- Quick start: `Big Show Hybrid`
- Preset: `Surge`
- Radiance: `75-95`
- Temperature: `55-75`
- Show Scale: `70-90`
- World Activity: `65-85`

Important:
- `Temperature` now sets the palette tendency, not a fixed palette lock
- the internal show-director can still push neon drift, laser color mutation, and event-driven palette changes over time

If you want a calmer, more restrained first read:

- Preset: `Room`
- Wake: `65-75`
- Intensity: `55-70`
- Show Scale: `45-60`
- World Activity: `45-60`

## What The Main Controls Actually Mean

These are the controls that matter most on a first pass.

## What The Presets Mean Now

Presets are now meant to be trustworthy starting points, not just cosmetic labels.

### `Hush`

Use it when:
- the goal is silence beauty
- you want the piece held back and gallery-like

### `Room`

Use it when:
- you want a balanced ambient chamber read
- speech and room life matter as much as music

### `Music`

Use it when:
- you want the best all-around music preset
- you want the piece to wake clearly and carry musical energy

This should be the default preset for most music testing.

### `Surge`

Use it when:
- you want the bigger, more dangerous show version
- you want harder rhythmic consequence and more spent moments

This is stronger than `Music`, not smarter than `Music`.

If you get lost in a custom mix:
- use `Restore Recommended` in the full menu
- or use the same button in the quick dock when it appears
- that now returns the active source path to its strongest current quick-start stance

### Wake

What it does:
- changes how easily the system decides the room is worth responding to

Turn it up when:
- low room music is not waking the piece enough
- the room is quieter than expected

Turn it down when:
- HVAC or low-level junk is making the piece too eager

### Intensity

What it does:
- changes how strongly the system commits once it is awake
- affects physical force more than simple brightness

Turn it up when:
- the piece is technically reacting but feels too polite

Turn it down when:
- active sections feel too inflated or busy

### Composition

What it does:
- shifts the framing between tighter hero emphasis and a wider chamber composition

Turn it up when:
- the hero feels too large
- the scene feels too center-locked

Turn it down when:
- the hero feels too distant or under-defined

### Show Scale

What it does:
- controls how much the entire screen behaves like a performance space instead of a study

Turn it up when:
- the scene still feels too much like one object in the middle

Turn it down when:
- the whole screen is too active too often

### World Activity

What it does:
- changes how much the chamber, field, and environment participate versus the hero

Turn it up when:
- you want the room itself to feel alive
- the world needs to matter more

Turn it down when:
- the hero is getting visually lost

### Architecture

What it does:
- pushes the scene toward stronger chamber architecture and geometry

Lower:
- softer, more organic, more membrane-like

Higher:
- more architectural, more chamber-led, more ritual/stage-like

### Radiance

What it does:
- shifts from withheld darkness to a more luminous reveal

Turn it up when:
- the piece feels too buried

Turn it down when:
- it loses mystery or the blacks stop feeling valuable

### Rhythm Lock

What it does:
- pushes the system toward sharper rhythmic choreography and punctuation

Turn it up when:
- percussion and musical articulation are not landing hard enough

Turn it down when:
- you want more drift and atmosphere

### Macro Spend

What it does:
- changes how willing the system is to spend its larger moments

Turn it up when:
- the show feels too shy

Turn it down when:
- big moments stop feeling special

### Atmosphere

What it does:
- changes how much haze, field, and chamber air participate

Turn it up when:
- the piece feels too dry or empty around the hero

Turn it down when:
- the field feels too foggy or too constantly alive

### Temperature

What it does:
- steers the world cooler or warmer

Lower:
- cooler teal / graphite / spectral

Higher:
- warmer amber / gold / violet stain

## Input Repair

These are repair controls. Do not start here unless the input path is clearly the issue or the menu recommends opening Input Repair.

### Input Trim

What it does:
- raises or lowers the mic signal before interpretation

Use it when:
- the mic path is simply too quiet or too hot overall

Do not use it as a substitute for `Wake` unless the input itself is genuinely mis-scaled.

### Low / Mid / High Bias

What they do:
- tilt the interpreter toward bass, mids, or highs

Use them when:
- the microphone or room is skewed
- you want more bass body
- speech is too dominant
- impacts need more edge

These are best used gently.

## Recommended Experiment Order

Use this order so you do not confuse yourself.

1. Choose the preset.
2. Adjust `Wake`.
3. Adjust `Intensity`.
4. Adjust `World Activity`.
5. Adjust `Show Scale`.
6. Only then open the full menu for `Composition`.
7. Only then touch `Rhythm`, `Glow`, `Atmosphere`, or EQ.

If you start by moving everything, you will not know what actually helped.

## What A Good Test Should Feel Like

### Silence
- suspended
- expensive
- not dead
- not twitching

### Quiet room tone
- slightly more present
- a little more field activity
- not fake excitement

### Speech
- articulate
- controlled
- not mistaken for music

### Taps and clinks
- crisp punctuation
- quick consequence
- no chaos

### Low room music
- visible deepening within a few seconds
- more organization, not just more light

### Medium room music
- stronger body
- stronger chamber/world consequence
- occasional earned moments

## What To Watch In Diagnostics

Use `Shift + D` in dev mode.

The most useful values on a first pass are:
- backend
- quality tier
- raw-path status
- show state
- moment
- music confidence
- body
- resonance
- speech
- accent

If you want to help the next retuning pass directly:
- enable `Auto Capture`
- choose [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as the capture folder once
- turn on `Auto Save To Folder`
- let the app catch a few drops or section changes
- fresh auto captures should now save with real wall-clock names; if you still see `1969-12-31...`, refresh the app first
- optionally run `npm run watch:captures` in another terminal, or use `npm run dev:live-loop` on Windows
- run `npm run analyze:captures` if you want a fresh standalone report
- bring back both the captures and the generated report

If something looks wrong, diagnostics should help explain why.

## If It Still Feels Wrong

Use these corrections first.

If it is too sleepy:
- raise `Wake`
- raise `Intensity`
- try `Music`

If it is too center-locked:
- raise `Composition`
- raise `World Activity`
- raise `Show Scale`

If it is too busy:
- lower `Macro Spend`
- lower `World Activity`
- lower `Rhythm Lock`

If it looks brighter but not deeper:
- lower `Radiance`
- raise `World Activity`
- raise `Architecture` a little

If speech and taps feel too similar:
- lower `Wake` slightly
- lower `Mid Bias`
- raise `High Bias` only a little

## Minimum Feedback To Bring Back

After your first real pass, the most useful report is:
- which preset felt closest
- which controls made the biggest difference
- whether low room music woke the system clearly
- whether the world/chamber felt involved enough
- whether hush and aftermath felt real
- what still looked fake, flat, too polite, or too busy
- whether similar drops felt consistently good or still too hit-or-miss

That is enough to make the next pass precise instead of generic.
