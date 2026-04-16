# VisuLive Control System Audit

Date: 2026-04-07
Status: Active control-system reference

This document is the current truth pass on the public controls.

Its job is not to propose endless new sliders.
Its job is to answer:

1. which public controls are actually real
2. what they do in operator language
3. where overlap still exists
4. what the current control philosophy is

## Current Truth

The visible controls are now materially better than they were earlier in the project.

That is because:
- quick starts are now the primary launch path
- presets are now real stance bundles, not cosmetic labels
- the quick dock is intentionally narrow
- the full menu is grouped by operator intent
- the scene now has an internal show-director layer that self-steers over time with the music

That last point matters.

The public controls are no longer the whole story.
They are the operator's steering layer.
The runtime now also has an internal director that modulates:
- energy
- world activity
- spectacle
- glow
- structure
- atmosphere
- framing
- color drift
- laser drive

One important recent fix: the high-end runtime tuning math no longer flattens the strongest settings into the same ceiling.

That means:
- `Music On This PC`
- `Big Show Hybrid`
- and an aggressively shaped `Surge` state

now preserve meaningfully different runtime headroom instead of converging into nearly the same `response` / `motion` values.

So the correct mental model is:

- public controls = the operator's bias and stance
- internal director = the system's self-authored movement over time

This is a good thing.
It means the app can feel more alive without forcing the user to babysit it.

## Public Control Model

Current public labels:
- `Preset`
- `Wake`
- `Intensity`
- `Composition`
- `Show Scale`
- `World Activity`
- `Architecture`
- `Radiance`
- `Rhythm Lock`
- `Macro Spend`
- `Atmosphere`
- `Temperature`
- `Accent Bias`
- `Microphone`
- `Input Trim`
- `Low Bias`
- `Mid Bias`
- `High Bias`

Quick starts above that layer:
- `Music On This PC`
- `Music In The Room`
- `Big Show Hybrid`

## Control Philosophy

The public model should behave like a real show instrument, not a dev rack.

That means:
- quick starts should solve the first decision
- presets should solve the second decision
- the quick dock should only expose first-response controls
- deeper controls should stay in the full menu
- low-level DSP internals should stay hidden unless they are genuinely useful

## Quick Starts

Quick starts are now the most important operator entry point.

### `Music On This PC`

What it does:
- sets source mode to direct PC audio
- uses the `Surge` stance
- launches with the strongest current direct-audio defaults

Use it when:
- the music source is this computer
- you want the cleanest musical input path

### `Music In The Room`

What it does:
- sets source mode to microphone
- uses the `Music` stance
- launches with a hotter wake/input posture for room playback

Use it when:
- speakers are in the space
- you want the mic to hear the room itself

### `Big Show Hybrid`

What it does:
- sets source mode to both
- uses the `Surge` stance
- launches with the biggest overall show posture

Use it when:
- you want direct music plus room life
- you want the biggest first read

Assessment:
- these are good
- they are the right operator abstraction
- they should remain the first buttons people press
- `Music On This PC` and `Big Show Hybrid` are now the best first checks when you want to see whether the system is actually capable of the bigger show read

## Presets

Presets are now trustworthy starting stances.

### `Hush`

Meaning:
- silence-first
- restrained
- gallery-like

### `Room`

Meaning:
- balanced ambient chamber behavior
- room life matters

### `Music`

Meaning:
- best all-around music starting point
- good default for most musical testing

### `Surge`

Meaning:
- bigger
- riskier
- more spent
- more rhythm-forward

Assessment:
- keep all four
- do not add more presets until real operator testing proves a gap

## Quick Dock Controls

These are the first-response controls.

### `Wake`

Internal field:
- `sensitivity`

What it really does:
- changes how easily the system decides the source is worth responding to
- affects wakefulness and interpretation thresholding more than raw signal level

Turn it up when:
- music is not waking the piece clearly enough
- the system feels too withheld

Turn it down when:
- junk input is making the system too eager

Assessment:
- essential
- deserves to stay in the quick dock

### `Intensity`

Internal field:
- `energy`

What it really does:
- changes how physically hard the show commits once it is awake
- affects deformation, force, and consequence more than simple brightness

Turn it up when:
- the show feels too polite

Turn it down when:
- active sections feel inflated instead of powerful

Assessment:
- essential
- distinct enough to keep

### `Show Scale`

Internal field:
- `spectacle`

What it really does:
- changes how much the full frame behaves like a performance space instead of an object study
- affects event spend, world-scale consequence, and macro compositional transformation

Turn it up when:
- the screen still feels too center-locked

Turn it down when:
- the whole frame is overspending too often

Assessment:
- essential
- this is one of the most important showpiece controls

### `World Activity`

Internal field:
- `worldActivity`

What it really does:
- changes how much the chamber, field, background, and architecture participate versus the hero

Turn it up when:
- the world feels passive

Turn it down when:
- the hero is getting lost

Assessment:
- essential
- one of the most valuable additions in the current control model

## Full Menu: Look Shaping

### `Composition`

Internal field:
- `framing`

What it really does:
- changes the framing between a tighter hero read and a wider chamber composition

Higher:
- wider
- more room-scale

Lower:
- tighter
- more hero-led

Assessment:
- very good control
- better public label than `Framing`

### `Architecture`

Internal field:
- `geometry`

What it really does:
- shifts the scene toward architectural, chamber-led behavior versus softer membrane-led behavior

Lower:
- softer
- more organic

Higher:
- more ritual
- more chamber-led
- more geometric

Assessment:
- real
- worth keeping

### `Radiance`

Internal field:
- `radiance`

What it really does:
- shifts the visual from darker withholding to more luminous reveal
- affects apparent brightness, emissive spend, and light/chroma openness

Assessment:
- real
- strong public label

### `Rhythm Lock`

Internal field:
- `beatDrive`

What it really does:
- biases the system toward sharper rhythmic choreography and punctuation

Assessment:
- real
- important
- especially useful for music-first testing

### `Macro Spend`

Internal field:
- `eventfulness`

What it really does:
- changes how often the system is willing to spend larger macro moments

Assessment:
- real
- useful
- should stay out of the quick dock

### `Atmosphere`

Internal field:
- `atmosphere`

What it really does:
- controls how much haze, field, residue, and chamber air participate

Assessment:
- real
- useful
- easy to overuse, so keep it secondary

### `Temperature`

Internal field:
- `colorBias`

What it really does:
- biases the palette cooler or warmer
- does not hard-lock the palette anymore because the show-director can drift color over time

Important:
- this is now a base tendency, not an absolute palette lock

Assessment:
- real
- useful
- stronger now that the scene has more chroma spend and color drift

### `Accent Bias`

What it really does:
- changes whether the system leans toward balanced response or sharper transient and rhythm punctuation

Assessment:
- keep
- simple and understandable

## Full Menu: Input And Detection

### `Microphone`

What it does:
- selects the physical mic device when the source path uses microphone input

Assessment:
- necessary
- keep

## Full Menu: Input Repair

### `Input Trim`

Internal field:
- `inputGain`

What it really does:
- pre-analysis trim on the source before interpretation

Important:
- this is not the same as `Wake`

Difference:
- `Wake` changes interpretation willingness
- `Input Trim` changes the input signal level before interpretation

Assessment:
- real
- useful
- should stay behind an explicit repair path, not the quick dock or the main operator flow

### `Low Bias`, `Mid Bias`, `High Bias`

Internal fields:
- `eqLow`
- `eqMid`
- `eqHigh`

What they really do:
- pre-shape the interpreted signal before semantic analysis

Use them when:
- the source path is clearly skewed
- the room or device needs correction

Do not use them first:
- if the actual issue is wake or event spend

Assessment:
- real
- useful
- secondary controls, exactly where they belong now

## What Still Overlaps

The control model is much better, but there is still real overlap to watch.

### `Intensity` vs `Show Scale`

Current distinction:
- `Intensity` = physical commitment
- `Show Scale` = full-frame consequence

This is real, but still needs continued tuning pressure.

### `Show Scale` vs `World Activity`

Current distinction:
- `Show Scale` = how show-like the whole frame becomes
- `World Activity` = how much of that participation comes from the chamber and world versus the hero

This is the second biggest place to watch for drift.

### `Radiance` vs `Air`

Current distinction:
- `Radiance` = luminous reveal
- `Air` = field and air participation

These are separate enough to keep, but they can still be confused if both are pushed too hard.

## What Was Holding The System Back

Two things were real bottlenecks:

### High-end runtime flattening

Before the latest tuning pass, the strongest combinations of:
- `Wake`
- `Intensity`
- `Show Scale`
- `Rhythm`
- `World Activity`

could collapse into almost the same runtime ceiling.

That made aggressive combinations feel less distinct than they should.

This is now fixed in the runtime tuning layer.

### Weak reset behavior

Before the latest UX/tuning pass, reset returned the controls to a generic authored state instead of the strongest known-good stance for the active source path.

That meant a user could drift into a weak custom mix and not have a clean way back.

This is now fixed.
`Restore Recommended` returns the active source path to its strongest current quick-start stance.

## What Should Not Be Added Right Now

Do not add a large new set of public controls yet.

Not yet:
- LFO depth
- modulation banks
- scene family pickers
- conductor internals
- event-class toggles
- post-stack knobs

Those may become useful later, but right now they would make the system worse to operate.

## Current Recommendation

The current public control system is good enough to stand behind.

The right next move is not more slider growth.
The right next move is:
- validate the current set through real operator use
- keep sharpening the distinction between `Intensity`, `Show Scale`, and `World Activity`
- let the internal show-director carry more of the dynamic variation instead of exposing more internals

## Bottom Line

The control system is now operating at the right level:
- quick starts for the first choice
- presets for the opening stance
- a narrow quick dock for first-response steering
- a fuller menu for deliberate shaping
- an internal director that keeps the show alive over time

That is the correct direction for this project.
