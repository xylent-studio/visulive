# Audio Routing Matrix

Date: 2026-04-08
Status: Active contract

This doc maps audio feature families to the rigs that should subscribe to them.
It is the routing layer between audio interpretation and stage behavior.

The goal is to avoid one universal FFT soup.
Each rig should listen to the signals that make it materially better at its job.

## Current Code Grounding

The current interpreter already emits:
- `beatConfidence`, `beatPhase`, `barPhase`, `phrasePhase`
- `musicConfidence`, `peakConfidence`, `momentum`
- `subPressure`, `bassBody`, `lowMidBody`, `presence`, `body`
- `air`, `shimmer`, `accent`, `brightness`, `roughness`
- `tonalStability`, `harmonicColor`, `phraseTension`, `resonance`
- `speech`, `roomness`, `ambienceConfidence`, `speechConfidence`
- `preDropTension`, `dropImpact`, `sectionChange`, `releaseTail`
- `showState`, `momentKind`, `momentAmount`, `performanceIntent`

The matrix below groups those fields into routing families.

## Routing Matrix

Legend:
- `P` = primary subscription
- `S` = secondary subscription
- `-` = ignore unless a special cue says otherwise

| Rig | Tempo | Impact | Presence | Texture | Memory | Stability |
| --- | --- | --- | --- | --- | --- | --- |
| HeroRig | S | P | S | S | - | S |
| ChamberRig | S | S | P | S | P | P |
| EventRig | P | P | - | - | S | P |
| CompositorRig / Renderer Policy | S | P | S | S | P | P |
| Framing / Stage Authority | P | P | S | - | S | P |
| Audio Conductor | P | P | P | P | P | P |

## Rig Notes

### HeroRig

HeroRig should read the music as shape and timing, not as raw noise.

Primary concerns:
- `peakConfidence`
- `dropImpact`
- `momentKind`
- `performanceIntent`

Secondary concerns:
- `beatConfidence`
- `beatPhase`
- `phrasePhase`
- `presence`
- `shimmer`

Ignore unless a cue forces it:
- `roomness`
- `ambienceConfidence`
- `speech` alone

### ChamberRig

ChamberRig should turn body, memory, and stability into space.

Primary concerns:
- `subPressure`
- `bassBody`
- `lowMidBody`
- `roomness`
- `resonance`
- `releaseTail`
- `tonalStability`

Secondary concerns:
- `beatPhase`
- `barPhase`
- `presence`
- `brightness`
- `roughness`

The chamber should trust slow signals more than spikes.

### EventRig

EventRig should decide when an event exists, when it escalates, and when it exits.

Primary concerns:
- `musicConfidence`
- `beatConfidence`
- `peakConfidence`
- `preDropTension`
- `dropImpact`
- `sectionChange`

Secondary concerns:
- `momentKind`
- `momentAmount`
- `releaseTail`

EventRig should not try to own the chamber or the hero.
It should own the timing of change.

### CompositorRig / Renderer Policy

The compositor should convert audio meaning into screen-space consequence.

Primary concerns:
- `dropImpact`
- `sectionChange`
- `releaseTail`
- `resonance`
- `peakConfidence`

Secondary concerns:
- `brightness`
- `roughness`
- `shimmer`
- `presence`
- `musicConfidence`

The compositor should use memory and impact more than beat phase.

### Framing / Stage Authority

Framing is the contract for whole-frame authority.

Primary concerns:
- `showState`
- `performanceIntent`
- `musicConfidence`
- `peakConfidence`
- `preDropTension`
- `dropImpact`

Secondary concerns:
- `presence`
- `resonance`
- `releaseTail`

Framing should answer:
- should the hero be centered or displaced
- should the chamber dominate
- should the frame open, compress, rupture, or haunt

## Starting Routing Assumptions

These are contract assumptions, not final code doctrine.

### Tempo family

Route from:
- `beatConfidence`
- `beatPhase`
- `barPhase`
- `phrasePhase`
- `momentum`
- `musicConfidence`

Best used by:
- HeroRig
- EventRig
- Framing / Stage Authority

### Impact family

Route from:
- `transientConfidence`
- `peakConfidence`
- `accent`
- `dropImpact`
- `sectionChange`
- `momentKind`
- `momentAmount`

Best used by:
- HeroRig
- EventRig
- CompositorRig
- Framing / Stage Authority

### Presence family

Route from:
- `subPressure`
- `bassBody`
- `lowMidBody`
- `presence`
- `body`
- `roomness`

Best used by:
- ChamberRig
- CompositorRig
- Framing / Stage Authority

### Texture family

Route from:
- `air`
- `shimmer`
- `brightness`
- `roughness`
- `harmonicColor`

Best used by:
- HeroRig
- ChamberRig
- CompositorRig

### Memory family

Route from:
- `resonance`
- `releaseTail`
- `preDropTension`
- `sectionChange`
- `roomness`
- `ambienceConfidence`

Best used by:
- ChamberRig
- CompositorRig
- Framing / Stage Authority
- EventRig

### Stability family

Route from:
- `tonalStability`
- `musicConfidence`
- `peakConfidence`
- `speechConfidence`
- `ambienceConfidence`
- `confidence`

Best used by:
- ChamberRig
- EventRig
- CompositorRig
- Framing / Stage Authority

## Confidence Gating by Rig

The same signal should not mean the same thing everywhere.

### HeroRig

- require `musicConfidence` or `peakConfidence` to exceed the show threshold before making major scale or morphology changes
- if confidence is low, keep motion expressive but reduce size and spend

### ChamberRig

- trust `presence`, `memory`, and `stability` more than `peakConfidence`
- a low-confidence frame can still produce strong chamber behavior if body and resonance are stable

### EventRig

- demand a confidence floor before authorizing major event transitions
- if confidence is low, convert to soft gathering or hold behavior instead of rupture

### CompositorRig / Renderer Policy

- use confidence to decide whether to spend, suppress, or remember
- when confidence is low, prefer residue and subtraction over additive wash

### Framing / Stage Authority

- if confidence is low but memory is high, keep the frame legible and restrained
- if confidence is high and impact is high, the frame may move toward peak authority

## Do Not Route These Ways

- do not let every rig listen to the same generic loudness bucket
- do not let `beatConfidence` drive the whole show by itself
- do not let the hero consume chamber signals as if they were hero-only signals
- do not let the chamber chase every transient
- do not let the compositor ignore memory
- do not let framing be decided by brightness alone

## Practical Use

When adding a new audio feature or tuning a family, ask:

1. Which family does it belong to?
2. Which rig should care first?
3. What should the rig do when confidence is low?
4. What should the rig do when confidence is high?
5. Is this signal shaping motion, impact, memory, or frame authority?

If the answer is "all of them," the signal is too broad and needs routing discipline.

## Starting Assumptions vs Current Code Truth

Current code truth:
- the interpreter already emits enough features to support this routing matrix
- the show-state and performance-intent derivation already exists
- source mode already influences how aggressively the interpreter commits

Starting assumptions in this doc:
- the six control families from `audio-feature-contract.md` are the stable routing vocabulary
- the matrix above is the first pass and should be refined after proof packs
- future explicit fields may be added to code, but the routing intent can be used now

## Success Criteria

- each rig has a reason to exist in the routing layer
- no rig becomes a generic "listen to everything" bucket
- low-confidence audio does not cause overcommit
- high-confidence impact can still create decisive stage behavior
- chamber, hero, compositor, and framing can diverge without conflicting
