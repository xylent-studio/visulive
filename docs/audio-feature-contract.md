# Audio Feature Contract

Date: 2026-04-08
Status: Active contract

This document defines the current audio-to-show control contract for VisuLive.
It is the bridge between the current audio interpreter and the stage system.

Use this doc to answer:
- what audio families exist
- how those families should be grouped for show control
- what the starting band ranges and smoothing assumptions are
- what confidence gates are allowed to move the show
- which rig should care about which signal

## Current Code Truth

The current codebase already exposes these audio truths:

- `ListeningMode = 'room-mic' | 'system-audio' | 'hybrid'`
- `ListeningState = 'dormant' | 'aware' | 'entrained' | 'blooming' | 'settling'`
- `ShowState = 'void' | 'atmosphere' | 'cadence' | 'tactile' | 'generative' | 'surge' | 'aftermath'`
- `PerformanceIntent = 'hold' | 'gather' | 'ignite' | 'detonate' | 'haunt'`
- `ListeningFrame` already carries:
  - `subPressure`, `bassBody`, `lowMidBody`, `presence`, `body`
  - `air`, `shimmer`, `accent`, `brightness`, `roughness`
  - `tonalStability`, `harmonicColor`, `phraseTension`, `resonance`
  - `speech`, `roomness`, `ambienceConfidence`, `speechConfidence`
  - `transientConfidence`, `musicConfidence`, `peakConfidence`
  - `momentum`, `beatConfidence`, `beatPhase`, `barPhase`, `phrasePhase`
  - `preDropTension`, `dropImpact`, `sectionChange`, `releaseTail`
  - `state`, `showState`, `momentKind`, `momentAmount`, `performanceIntent`

The interpreter currently derives:
- beat-related confidence from timing stability plus music/body energy
- pre-drop / drop / section / release windows from the above timing and energy fields
- `showState` from moment, confidence, and phrase behavior
- `performanceIntent` from drop, section, tension, beat, and release cues

The audio engine currently uses:
- analyser FFT size of `2048`
- analyser smoothingTimeConstant of `0.68`

## Contract Language

This doc groups the current and future control surface into six families.
Some names below are already present in code.
Others are contract names that describe how we want to route and read the existing signals.

### 1. Tempo

Tempo is the contract for pulse, phrasing, and timing trust.

Primary signals:
- `beatConfidence`
- `beatPhase`
- `barPhase`
- `phrasePhase`
- `momentum`
- `musicConfidence`

What it should answer:
- is the show lockable to pulse
- is the current phrase stable
- is a section transition near
- should motion stay strict or loosen

### 2. Impact

Impact is the contract for spikes, drops, hits, and structural rupture.

Primary signals:
- `transientConfidence`
- `peakConfidence`
- `accent`
- `dropImpact`
- `sectionChange`
- `momentKind`
- `momentAmount`

What it should answer:
- is something landing now
- is the moment a hit, a lift, or a release
- should the frame spend or withhold
- should the show carve space before blooming

### 3. Presence

Presence is the contract for body, weight, and low/mid substance.

Primary signals:
- `subPressure`
- `bassBody`
- `lowMidBody`
- `presence`
- `body`
- `roomness`

What it should answer:
- how much physical weight the mix has
- whether the room feels full or thin
- whether the chamber should hold, compress, or expand

### 4. Texture

Texture is the contract for surface character, air, and grain.

Primary signals:
- `air`
- `shimmer`
- `brightness`
- `roughness`
- `harmonicColor`

What it should answer:
- whether the mix is dark, glossy, noisy, or open
- whether the show should feel smooth, brittle, luminous, or scratchy
- whether the hero/chamber should become more membrane-like or more carved

### 5. Memory

Memory is the contract for afterimage, carryover, and residue.

Primary signals:
- `resonance`
- `releaseTail`
- `preDropTension`
- `sectionChange`
- `roomness`
- `ambienceConfidence`

What it should answer:
- what should still be visible after the hit
- how long the frame should remember the last event
- whether a cue should leave stain, ghost, or trail

### 6. Stability

Stability is the contract for trust, certainty, and interpretive restraint.

Primary signals:
- `tonalStability`
- `musicConfidence`
- `peakConfidence`
- `speechConfidence`
- `ambienceConfidence`
- `confidence`

What it should answer:
- how hard the interpreter should commit
- whether timing should be trusted or softened
- whether the current frame is good enough to authorize strong stage spend

## Starting Band Families and Ranges

These are starting assumptions for how to think about the audio feature bands.
They are not yet hard-coded as the only valid values.

### Low / Sub Bands

- `sub`: `20-60 Hz`
- `kick / thump`: `50-110 Hz`
- `bassBody`: `90-220 Hz`
- `lowMidBody`: `180-500 Hz`

### Mid / Presence Bands

- `presence`: `500-2500 Hz`
- `speech / articulation`: `900-3500 Hz`
- `texture / grit`: `1500-6000 Hz`

### Air / Shine Bands

- `air`: `2500-8000 Hz`
- `shimmer`: `8000-16000 Hz`
- `sparkle / hiss`: `12000-18000 Hz`

### Current Code Grounding

The current analyzer already measures:
- `rms`
- `peak`
- `envelopeFast`
- `envelopeSlow`
- `transient`
- `lowEnergy`
- `midEnergy`
- `highEnergy`
- `brightness`
- `lowFlux`
- `midFlux`
- `highFlux`
- `crestFactor`
- `lowStability`
- `modulation`

This contract groups those existing measurements into the families above.

## Starting Smoothing and Decay Defaults

These are starting assumptions for control shaping, not final doctrine.

### Suggested smoothing windows

- impact spikes: `0-15 ms`
- beat-lock confidence: `40-120 ms`
- bass / presence body: `180-450 ms`
- mid / articulation body: `120-260 ms`
- air / shimmer: `80-180 ms`
- memory / residue: `180-700 ms`
- phrase trust: `1-2 bars`
- section trust: `2-8 bars`

### Suggested decay behavior

- impact should fall fast unless the cue continues to refresh it
- presence should decay slower than impact
- texture should decay in a mid-speed range so the frame does not smear forever
- memory should decay slowest, but not permanently
- stability should move conservatively and should not react to single-frame spikes

### Interpreter-grounded note

The current interpreter already damps many values over time rather than snapping them.
This contract keeps that model and adds explicit control-family expectations on top of it.

## Confidence Gating Rules

The show should not spend the same way on every frame.
Use confidence as a gate, not just a label.

### General rules

- low `musicConfidence` should reduce structural spend
- low `peakConfidence` should suppress major impact routing
- low `beatConfidence` should soften strict timing reads
- low `speechConfidence` should prevent speech-like interpretation from dominating the frame
- low `ambienceConfidence` should prevent background texture from being mistaken for high-certainty structure

### Strong commit rules

- `musicConfidence` and `peakConfidence` together may authorize stronger event spend
- `dropImpact` and `sectionChange` may authorize peak-routing only when the confidence floor is met
- `momentKind = 'strike'` should be allowed to spend harder than `momentKind = 'lift'`
- `showState = 'surge'` should be treated as the highest-risk/highest-authority window

### Source-mode rules

- `room-mic` should be more conservative about hard structural claims
- `system-audio` may be more willing to commit to timing and drop confidence
- `hybrid` should sit between them and inherit the more trustworthy part of either path

## Rig Subscription Rules

This is the current starting contract for who should care about which family.
The list below is intentionally strict so every rig does not listen to everything equally.

### HeroRig

Primary:
- impact
- peak
- tempo
- articulation

Secondary:
- presence
- texture

Should not overreact to:
- roomness alone
- memory alone

### ChamberRig

Primary:
- presence
- memory
- tempo
- stability

Secondary:
- impact
- texture

Should not overreact to:
- hero-local articulation without chamber participation

### EventRig

Primary:
- tempo
- impact
- stability

Secondary:
- memory

Should not overreact to:
- low-level texture drift without a cue boundary

### CompositorRig / Renderer Policy

Primary:
- impact
- memory
- stability

Secondary:
- presence
- texture

Should not overreact to:
- beat phase alone

### Framing / Stage Authority

Primary:
- tempo
- impact
- memory
- stability

Secondary:
- presence

Should not overreact to:
- raw loudness without cue meaning

## Starting Assumptions vs Current Code Truth

Current code truth:
- the interpreter already computes timing, drop, section, and release logic
- `ListeningFrame` already contains the needed primitives
- source mode and confidence already exist

Starting assumptions in this contract:
- the six control families above are the stable vocabulary to use
- the band ranges above are the initial routing guide
- the smoothing and decay windows above are the first tuning baseline
- explicit tempo / impact / presence / texture / memory / stability names may be used in docs and routing before every corresponding field exists as a literal code property

## What Success Looks Like

- the same signal can route differently depending on family and confidence
- strong moments can spend more without flattening everything
- weak moments can stay expressive without pretending to be high-certainty
- the rig that owns the signal can explain why it cared
- the system can be tuned without inventing new sliders every time
