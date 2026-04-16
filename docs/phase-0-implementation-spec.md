# Room Instrument Implementation Spec

Date: 2026-04-07
Status: Historical implementation baseline
Depends on: [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)

This document remains valuable as the proof-of-spine / room-instrument baseline, but it is no longer the active program brief. For the active roadmap, use [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md).

This document supersedes the original proof-of-spine framing. The project is now a room-first listening instrument built on the same repo and flagship scene.

## Intent

The product is no longer just proving that the mic layer works. It now proves a stronger claim:

- low room music can wake the piece without destroying silence stability
- the listening layer interprets room sound semantically, not as raw reactive energy
- the scene has internal behavior states and occasional earned moments
- the visible controls are curated and user-facing
- diagnostics tell the truth about signal, rendering, and guardrails

## Locked Product Posture

- one flagship scene only
- room microphone is still the only shipped source
- architecture is ready for `system-audio` and `hybrid`, but those are deferred
- fullscreen remains the intended experience
- windowed mode must still feel composed
- visible controls stay curated and compact
- diagnostics remain hidden behind `Shift + D`

## Shared Contract

The renderer and scene consume only `ListeningFrame`.

```ts
type ListeningMode = 'room-mic';

type ListeningState =
  | 'dormant'
  | 'aware'
  | 'entrained'
  | 'blooming'
  | 'settling';

type MomentKind = 'none' | 'lift' | 'strike' | 'release';

type ListeningFrame = {
  timestampMs: number;
  mode: ListeningMode;
  calibrated: boolean;
  confidence: number;
  clipped: boolean;
  presence: number;
  body: number;
  air: number;
  accent: number;
  brightness: number;
  resonance: number;
  speech: number;
  roomness: number;
  musicConfidence: number;
  momentum: number;
  state: ListeningState;
  momentKind: MomentKind;
  momentAmount: number;
};
```

Low-level worklet values remain diagnostics-only inside `AnalysisFrame`.

## Listening Model

The shipped listening stack now has two layers:

1. `AnalysisFrame`
   Raw-ish worklet packet with:
   - RMS / peak
   - fast / slow envelopes
   - transient
   - low / mid / high energy
   - brightness
   - low / mid / high flux
   - crest factor
   - low-band stability
   - modulation

2. `ListeningInterpreter`
   Stateful semantic layer that derives:
   - `presence`
   - `body`
   - `air`
   - `accent`
   - `brightness`
   - `resonance`
   - `speech`
   - `roomness`
   - `musicConfidence`
   - `momentum`
   - `state`
   - `momentKind`

## Detection Policy

- silence should decay to an alive idle state
- steady hum contributes a little to `roomness`, almost nothing to `accent`
- speech contributes to `speech` and moderate `presence`, not large `body`
- low ambient music should slowly build `body`, `resonance`, `momentum`, and `musicConfidence`
- sharp taps, clinks, and percussion should hit `accent` immediately
- bloom and special moments must be earned by confidence + momentum + history

## Internal Scene Behavior

`Obsidian Bloom` remains the only scene, but it now carries hidden moods:

- `dormant`
- `aware`
- `entrained`
- `blooming`
- `settling`

It also reacts to occasional moment types:

- `lift`
- `strike`
- `release`

These are not exposed as public modes.

## Scene Mapping

- `presence`: wake state and general permission for motion
- `body`: form mass, glow density, internal pressure
- `air`: veil shimmer, edge articulation, particulate life
- `accent`: rhythmic punctuation and ring events
- `brightness`: cool/warm balance and internal glass clarity
- `resonance`: afterglow, pressure shell, lingering atmosphere
- `speech`: controlled mid-band shaping
- `roomness`: subtle non-dead field life
- `musicConfidence`: unlocks deeper organization and state transitions
- `momentKind` / `momentAmount`: gates rare reveal behaviors

## Curated Controls

Visible user controls are now:

- `Preset`
  - `Still`
  - `Room`
  - `Lift`
  - `Pulse`
- `Sensitivity`
- `Accent Bias`
  - `Balanced`
  - `Sharper Rhythm`
- `Atmosphere`
- `Recalibrate`
- `Fullscreen`

Low-level DSP controls remain internal and diagnostics-only.

## Runtime Truth Surface

The hidden diagnostics panel must answer these questions:

- what renderer backend is active
- what quality tier and DPR cap are active
- what mic constraints were requested, supported, and actually applied
- whether the path is raw or compromised
- what the current `ListeningFrame` values are
- what the current `AnalysisFrame` values are
- which state and moment are active
- why that state or moment was entered
- whether hum rejection, silence gating, or music trend guardrails are engaged

## Architecture Notes

- React remains shell only
- renderer remains imperative and isolated
- audio remains isolated and typed
- `AudioWorklet` remains the real listening engine
- `AnalyserNode` remains debug-only
- source interfaces are now structured so `system-audio` and `hybrid` can be added later without reworking the renderer contract

## Review Gate

Continue only if:

- silence is stable and beautiful
- HVAC does not create constant motion
- speech is distinct from impacts
- low room music visibly deepens the scene within a few seconds
- medium room music increases body and occasional moments without chaos
- diagnostics clearly explain the runtime
- the baseline laptop holds composure under the quality governor

Fail immediately if:

- silence twitches
- hum drives fake excitement
- feature values drift without meaning
- taps and speech collapse into the same behavior
- nearby music saturates everything
- diagnostics cannot explain the system
- frame pacing is not acceptable on the baseline machine
