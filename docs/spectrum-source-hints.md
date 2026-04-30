# Spectrum Source Hints

Date: 2026-04-30
Status: Implementation reference plus runtime addendum. Source implementation now exists.
Owner lane: Audio Conductor / Phrase Intelligence
Consumer lanes: Show Direction / Acts / Palette / Cue Logic, Evidence / Capture / Analyzer, Operator UX / Diagnostics

## Purpose

This document turns the "frequency spectrum to instrument/source trigger" idea into a VisuLive-ready implementation plan.

The short version:

- VisuLive already reads broad audio energy and FFT diagnostics.
- It does not yet expose a true spectrum-derived source-hint layer.
- The best next version is not a public spectrum controller and not a heavy ML stem separator.
- The best next version is a private, confidence-gated `SourceHintFrame` that interprets spectrum regions as musical evidence, then lets the existing conductor decide what the show is allowed to do.

This is deliberately a hint layer, not a magic instrument detector. A frequency spectrum can show energy in ranges where kick, bass, snare, hats, voice, pads, and noise often live, but mixed music overlaps heavily. The value comes from combining bands, flux, onset shape, sustain, source mode, confidence, and existing phrase state.

## Current System Truth

Current files that already own this path:

- `src/audio/AudioEngine.ts`
- `src/audio/audio-feature-processor.js`
- `src/audio/listeningInterpreter.ts`
- `src/audio/stageAudioFeatures.ts`
- `src/types/audio.ts`
- `docs/audio-feature-contract.md`
- `src/scene/direction/showDirection.ts`

Current code already has:

- An `AnalyserNode` with `fftSize = 2048`.
- `getFloatFrequencyData()` used for debug spectrum sampling.
- Debug spectrum collapsed to `spectrumLow`, `spectrumMid`, and `spectrumHigh`.
- A worklet that computes `lowEnergy`, `midEnergy`, `highEnergy`, `brightness`, `lowFlux`, `midFlux`, `highFlux`, `transient`, `crestFactor`, `lowStability`, and `modulation`.
- `ListeningInterpreter` converting those broad signals into `ListeningFrame` fields such as `subPressure`, `bassBody`, `presence`, `air`, `shimmer`, `accent`, `beatConfidence`, `dropImpact`, `sectionChange`, `releaseTail`, `momentKind`, and `performanceIntent`.
- `stageAudioFeatures.ts` grouping conductor output into tempo, impact, presence, texture, memory, and stability.

What is missing:

- A reusable log-band spectrum frame.
- A private contract for source-like hints such as kick pulse, snare snap, hat shimmer, vocal presence, bass sustain, noise sweep, and sub drop.
- Capture evidence that proves those hints improve cue correctness without increasing visual churn.
- Analyzer reports that can say "missed kick-like onset", "false snare-like snap", "hat shimmer overdriving rupture", or "vocal/speech confusion".

## Research Read

Primary references point to the same conclusion.

- Web Audio `AnalyserNode.getFloatFrequencyData()` returns dB values per frequency bin, distributed from 0 Hz to half of sample rate. This is enough for real-time browser spectrum evidence.
- The Web Audio specification defines `fftSize` as a power of two from 32 to 32768, with `frequencyBinCount` equal to half the FFT size. Larger FFT sizes cost more and add time spread.
- Professional visual tools such as Resolume Wire, Notch, and TouchDesigner use FFT ranges to drive audio-reactive visuals. They prove the interaction model, but they mostly expose region triggers. VisuLive should keep that power private and conductor-gated.
- Meyda and librosa show the useful MIR vocabulary: spectral centroid, rolloff, flatness, MFCC, chroma, RMS, zero crossing rate, tempo, onset envelope, and deltas. Those are good feature names, but only some belong in real-time browser code now.
- Essentia models, YAMNet, Basic Pitch, Spleeter, and Demucs show future options for classification, pitch, or stem separation. They are not the first live path because they add payload, latency, licensing, model confidence problems, or non-browser operational complexity.

Reference detail is in `docs/spectrum-source-hints-references.md`.

## Decision

Build this, when implementation begins:

```ts
Audio input
  -> current AudioWorklet + current AnalyserNode
  -> SpectrumFrame
  -> SourceHintInterpreter
  -> ListeningInterpreter confidence arbitration
  -> StageAudioFeatures
  -> showDirection cue arbitration
  -> visual systems
```

Do not build this:

```ts
Raw FFT bins -> scene systems
Raw FFT bins -> public sliders
ML stem separator -> first live runtime path
"instrument detector" claims -> visual authority
```

The conductor stays the only owner of audio-side truth. Visual systems should never subscribe to raw FFT or raw source hints directly.

## Terms

`SpectrumFrame`
: A compact frame of frequency-region measurements derived from one audio source at one moment.

`SpectrumBand`
: A named, normalized region such as `sub`, `kick`, `punch`, `presence`, `snap`, or `air`.

`SourceHintFrame`
: A conductor-owned interpretation of spectrum evidence. It says "this frame resembles kick pulse" or "this window resembles noise sweep" with confidence and reasons.

`Source hint`
: A source-like behavior, not an asserted instrument identity.

`Routeable cue`
: A hint that survived conductor confidence checks and can influence existing `ListeningFrame` or `StageAudioFeatures` fields.

## Proposed Private Contract

This is a planning shape, not implemented code.

```ts
type SpectrumBandId =
  | 'sub'
  | 'kick'
  | 'punch'
  | 'bass'
  | 'lowMid'
  | 'body'
  | 'presence'
  | 'snap'
  | 'crack'
  | 'sheen'
  | 'air'
  | 'fizz';

type SpectrumBand = {
  id: SpectrumBandId;
  hzLow: number;
  hzHigh: number;
  energy: number;
  flux: number;
  onset: number;
  sustain: number;
  noise: number;
  tonal: number;
  confidence: number;
};

type SourceHintFrame = {
  timestampMs: number;
  sourceMode: ListeningMode;
  confidence: number;
  kickPulse: number;
  subDrop: number;
  bassSustain: number;
  snareSnap: number;
  hatShimmer: number;
  vocalPresence: number;
  noiseSweep: number;
  tonalLift: number;
  silenceAir: number;
  broadbandHit: number;
  reasons: string[];
};
```

The initial frame should be internal diagnostics and capture metadata only. It should not change show behavior until it proves itself.

## Starting Bands

These ranges are starting hypotheses. They should be proof-tuned, not treated as permanent doctrine.

| Band | Hz | Why it exists |
| --- | ---: | --- |
| `sub` | 20-45 | Sub floor, deep drops, room/hum risk |
| `kick` | 45-90 | Kick fundamental, 808 attack support |
| `punch` | 90-150 | Kick body, low drum impact |
| `bass` | 150-250 | Bass body and low sustain |
| `lowMid` | 250-500 | Mud, drum body, voice/body confusion |
| `body` | 500-900 | Instrument body, vocal lower presence |
| `presence` | 900-1800 | Vocal/synth/guitar presence, articulation base |
| `snap` | 1800-3200 | Snare/clap snap, consonants, attack |
| `crack` | 3200-5500 | Snare crack, guitar edge, bright transient |
| `sheen` | 5500-8500 | Hats, noise, sparkle |
| `air` | 8500-12000 | Air, open top, shimmer |
| `fizz` | 12000-18000 | Hiss, cymbal extension, less reliable on many speakers |

For `fftSize = 2048` and a 48000 Hz sample rate, `frequencyBinCount = 1024` and bin width is about 23.4 Hz. That is enough for these bands, but low-band resolution remains coarse. If a future pass needs cleaner low-end timing, consider `fftSize = 4096` only behind measurement and performance gates.

## Hint Recipes

These are the first source-like cues worth testing.

### `kickPulse`

Expected evidence:

- Fast onset in `kick` or `punch`.
- Supporting movement in `sub` or `bass`.
- Transient confidence or crest factor is elevated.
- Beat phase or recent beat interval is plausible.
- Not a long stable hum.

Initial visual use after proof:

- Strengthen existing impact hit evidence.
- Add local pulse certainty to stage/chamber accents.
- Never force a signature moment by itself.

### `subDrop`

Expected evidence:

- `sub` and `kick` rise or sustain after a build/release boundary.
- `preDropTension` or `sectionChange` already exists.
- Low-band energy is not a stable room hum.
- System audio mode earns more trust than room mic mode.

Initial visual use after proof:

- Strengthen `dropImpact` and world/chamber pressure.
- Extend aftermath memory only when release evidence follows.

### `bassSustain`

Expected evidence:

- `bass` stays elevated with low flux.
- `musicConfidence` is above floor.
- High/mid speech patterns are not dominant.
- Hum rejection is low enough.

Initial visual use after proof:

- Support body, chamber compression, and low-frequency physicality.
- Avoid triggering strikes.

### `snareSnap`

Expected evidence:

- Coordinated onset in `lowMid` or `body` plus `snap` or `crack`.
- Short decay and high flux.
- Not speech-heavy consonant movement.
- Not a clipped full-band event unless broadband hit also qualifies.

Initial visual use after proof:

- Small frame cuts, shard accents, scene-surface percussion.
- It should not be allowed to detonate the show alone.

### `hatShimmer`

Expected evidence:

- Repeated small flux in `sheen`, `air`, or `fizz`.
- Low-band impact is absent or low.
- Short decay and rhythmic density.
- Not static hiss.

Initial visual use after proof:

- Texture shimmer, edge sparkle, small particle activity.
- It must not escalate act state by itself.

### `vocalPresence`

Expected evidence:

- Sustained, modulated presence in `body`, `presence`, and `snap`.
- Speech confidence is considered but not blindly trusted.
- System audio earns more trust; room mic speech near the operator suppresses the hint.
- Avoid claiming "vocal" as truth; this is presence-plus-articulation evidence.

Initial visual use after proof:

- Help avoid mistaking voice/speech for drums.
- Support restrained, human-presence styling if show direction has a matching act.

### `noiseSweep`

Expected evidence:

- Rising broadband high-frequency energy over 400 ms to 2500 ms.
- `sheen`, `air`, and `fizz` grow while low impact is delayed.
- Phrase tension or pre-drop tension is already rising.

Initial visual use after proof:

- Strengthen builds, aperture opening, pre-drop chamber pressure.
- Suppress fake drops when the sweep releases without a real hit.

### `tonalLift`

Expected evidence:

- Harmonic color and brightness increase without broadband noise dominance.
- Sustained mid/high energy with lower roughness.
- Existing phrase direction supports lift.

Initial visual use after proof:

- Palette hold confidence, hero/chamber lift restraint, less random hue churn.

### `silenceAir`

Expected evidence:

- Broad energy falls but air/resonance remains.
- Release tail is present.
- Low-end hum and mic noise are suppressed.

Initial visual use after proof:

- Improve aftermath and quiet-state readability.
- Protect low-energy colorful states from being mistaken for nothing.

## Integration Rules

1. Audio conductor owns confidence.
2. `SourceHintFrame` starts as telemetry only.
3. Hints may strengthen existing `ListeningFrame` semantics only after proof.
4. Hints may help `StageAudioFeatures` choose between already-plausible cue routes.
5. Hints must not create new public controls.
6. Hints must not bypass `showDirection.ts`.
7. Hints must not let a single band trigger a major visual event.
8. Hints must carry reason strings so captures can explain why a cue happened.
9. Room mic mode must be conservative.
10. Hybrid mode must guard against double-counted bass, echo, and nearby speech.

## Implementation Phases

### Phase 0 - Planning and Evidence Contract

This pass.

Deliverables:

- `docs/spectrum-source-hints.md`
- `docs/spectrum-source-hints-scenarios.md`
- `docs/spectrum-source-hints-references.md`

No runtime changes.

### Phase 1 - Spectrum Diagnostics Only

Goal:

- Extract named log bands from the existing `AnalyserNode`.
- Store compact band values in diagnostics/capture metadata.
- Do not affect show behavior.

Expected files:

- `src/types/audio.ts`
- `src/audio/AudioEngine.ts`
- potentially `src/audio/spectrumBands.ts`
- capture analyzer scripts only for reporting

Acceptance:

- Existing `npm run check` remains green.
- Diagnostics show named bands.
- Capture report can summarize band peaks and average band confidence.
- No visual output changes.

### Phase 2 - Source Hint Interpreter

Goal:

- Convert `SpectrumFrame` to `SourceHintFrame`.
- Keep hints diagnostic-only.
- Add focused unit tests for false positive cases.

Expected files:

- `src/audio/sourceHintInterpreter.ts`
- `src/audio/sourceHintInterpreter.test.ts`
- `src/types/audio.ts`
- diagnostics/capture types

Acceptance:

- Synthetic cases cover kick, snare, hats, sub sustain, speech, hum, hiss, silence, and clipped broadband hits.
- Diagnostics include top hint and reason.
- No show behavior changes.

### Phase 3 - Conductor Advisory Mode

Goal:

- Let `ListeningInterpreter` consume hints as advisory evidence.
- Strengthen or suppress existing fields, not create a parallel show brain.

Expected fields that may be refined:

- `accent`
- `subPressure`
- `bassBody`
- `air`
- `shimmer`
- `transientConfidence`
- `musicConfidence`
- `peakConfidence`
- `preDropTension`
- `dropImpact`
- `sectionChange`
- `releaseTail`

Acceptance:

- Current broad-band behavior remains stable when hint confidence is low.
- High-confidence hints improve conductor reason strings.
- Room speech and hum cases remain restrained.

### Phase 4 - Stage Feature Routing

Goal:

- Add hint-aware refinements to `deriveStageAudioFeatures()`.
- Route source hints into existing tempo, impact, presence, texture, memory, and stability families.

Suggested additions:

- `impact.percussion`
- `presence.bassSource`
- `texture.airMotion`
- `stability.sourceHintConfidence`

Acceptance:

- `showDirection.ts` still owns act/palette/temporal-window decisions.
- Cue routing changes happen only in close-call situations.
- Analyzer proves no new scene churn, no random palette churn, and no unearned signature moments.

### Phase 5 - Proof and Analyzer Upgrade

Goal:

- Teach capture analysis to evaluate hint usefulness.

New report questions:

- Did a major visual hit have source-hint support?
- Did a major source-like event fail to produce any visual consequence?
- Were hints stable in low-energy states?
- Did speech/hum/hiss produce false percussion?
- Did hint confidence correlate with improved scene/motif coherence?

Acceptance:

- A no-touch `Primary benchmark` canary shows cue clarity improvement without coherence regression.
- Reports include missed-opportunity and false-positive examples.

### Phase 6 - Optional Advanced MIR or ML

Only consider after native hints prove a specific ceiling.

Possible future lanes:

- Meyda-style spectral features if native bands need spectral centroid, rolloff, flatness, zcr, or MFCC.
- Essentia.js or similar if higher-level music descriptors are needed and licensing/payload fit.
- YAMNet-like sound classification only for diagnostic labeling, not show control.
- Basic Pitch-like pitch extraction only for offline/lab melody or tonal proof, not primary live runtime.
- Stem separation such as Spleeter/Demucs only offline or in a local optional lab, not first live browser path.

## Visual Consequence Policy

The source-hint layer should improve specificity, not make the show twitchier.

Allowed after proof:

- Kick-like pulses can sharpen already-authorized impact.
- Snare-like snaps can create bounded cuts, shards, or surface responses.
- Hat-like shimmer can drive texture, edge, and particle density.
- Bass sustain can deepen body and chamber pressure.
- Noise sweeps can clarify pre-drop build behavior.
- Silence/air can improve aftermath and quiet premium states.

Not allowed:

- A single hint directly triggers a signature moment.
- A single band changes act.
- Hat shimmer drives huge geometry.
- Snare snap forces scene changes.
- Vocal presence claims instrument identity.
- Public controls expose "kick slider", "snare slider", or raw FFT regions.

## Evidence Gates

Implementation should not graduate by looking impressive once.

Minimum proof gates:

- Unit tests for source hint recipes and false positives.
- Diagnostic-only canary before any visual behavior changes.
- Capture reports include hint summaries and reason strings.
- `Music On This PC` proof before `Music In The Room` tuning.
- Room mic proof for speech, hum, hiss, and quiet states.
- Hybrid proof for echo and double bass.
- No regression in legacy public surface audit.
- No increase in unearned hero-form switches, scene churn, palette churn, or signature overfire.

Suggested numeric gates for first behavioral use:

- Source hint extraction average main-thread cost stays under the measured budget established by Phase 1.
- Major visual impact events in proof runs usually have either conductor event evidence or high-confidence source-hint support.
- False kick/hit hints from silence, hum, or speech stay rare enough that no major show spend is caused by them in proof runs.
- Low-energy passages remain visually alive when `silenceAir`, `tonalLift`, or `bassSustain` is present.

The exact thresholds should be set from real capture runs, not invented before instrumentation exists.

## Risk Register

| Risk | Bad outcome | Mitigation |
| --- | --- | --- |
| Raw FFT over-control | Show becomes twitchy and mechanical | Hints are private and conductor-gated |
| False kick from hum | Room noise creates fake drops | Hum rejection plus low-flux/sustain checks |
| False snare from speech | Operator speech causes cuts | Speech confidence suppresses snap routing in room/hybrid |
| Hat shimmer over-authority | High fizz drives major motion | Hat hint can only route texture |
| Genre overfit | Works only for electronic benchmark tracks | 42-scenario proof matrix includes acoustic, rock, jazz, ambient, metal, pop |
| ML payload bloat | Slow startup and fragile deployment | Native Web Audio first |
| Stem-separation temptation | Latency and operational complexity | Offline/lab only until proof demands it |
| Duplicate ownership | Scene systems subscribe directly to FFT | Handoff contract forbids raw visual consumers |
| Evidence blind spot | Better-looking demo hides regressions | Analyzer must report hints, misses, false positives, churn |
| Public complexity | User sees knobs instead of Start Show | Diagnostics remain Advanced/internal |

## Implementation Ownership

Primary owner:

- Audio Conductor / Phrase Intelligence

Supporting owner:

- Evidence / Capture / Analyzer

Consumers:

- Show Direction / Acts / Palette / Cue Logic
- Operator UX / Controls / Diagnostics

Forbidden ownership drift:

- Visual systems should not own source-hint truth.
- Show direction should not compute source hints.
- Diagnostics should not become public controls.
- Analyzer should judge evidence, not change runtime semantics.

## Prediction

The likely outcome if implemented this way:

- Better hit/read specificity without returning to random slider-driven visuals.
- Stronger distinction between kick, snare-like transient, hat/air texture, bass/body, sweep/build, and aftermath.
- Fewer missed drops when the broad low/mid/high features are too blunt.
- Better low-energy proof because the system can read quiet air/resonance instead of only loudness.
- Better analyzer language because reports can name why the conductor believed a moment.

The likely outcome if implemented as raw spectrum routing:

- Initial demo feels responsive.
- Long runs become twitchy, noisy, and hard to tune.
- Scene/palette churn increases.
- Proof becomes harder because every visual system starts listening to its own private audio truth.

The likely outcome if implemented as ML/stem-first:

- More exciting vocabulary on paper.
- Slower and more fragile browser runtime.
- Harder release story.
- More model-confidence ambiguity.
- Less immediate value than native spectrum hints because current blockers are cue coherence and proof, not lack of labels.

## First Implementation Brief For The Future Agent

Do this first when implementation is authorized:

1. Add `SpectrumBand` and `SourceHintFrame` types behind diagnostics.
2. Derive 12 named log bands from the existing analyser data in `AudioEngine.ts`.
3. Add capture metadata for band peaks and means.
4. Do not change visual behavior.
5. Add analyzer output that proves whether the bands are stable and useful.
6. Run a no-touch `Primary benchmark` canary.
7. Only then add `sourceHintInterpreter.ts`.

Do not start by adding dependencies.
Do not start by changing `showDirection.ts`.
Do not start by making visuals react to new hints.

## Implementation Addendum

Implemented runtime files:

- `src/audio/spectrumBands.ts`
- `src/audio/sourceHintInterpreter.ts`
- `src/audio/AudioEngine.ts`
- `src/audio/listeningInterpreter.ts`
- `src/audio/stageAudioFeatures.ts`
- `src/replay/session.ts`
- `scripts/capture-analysis-core.mjs`
- `scripts/source-hint-lab.mjs`

Current behavior:

- Production runtime remains native Web Audio.
- `AnalysisFrame` stays worklet-owned and broad.
- `SpectrumFrame` and `SourceHintFrame` are optional diagnostics.
- Old captures remain valid when hint diagnostics are absent.
- Public UI remains unchanged.
- Advanced Diagnostics shows compact bands and top source hints.
- Analyzer reports now include per-capture `Spectrum source hints` and aggregate `Source-hint evidence`.

Current runtime mode:

- `AudioEngine` computes source hints in active mode.
- `ListeningInterpreter` only applies bounded conductor-owned refinements in active mode.
- Shadow mode leaves `ListeningFrame` source-hint fields at zero.

Boundary guard:

- `src/scene/sourceHintGuard.test.ts` protects visual systems from importing raw spectrum or source-hint contracts.

Lab path:

- `npm run source-hint:lab -- <capture-or-folder>` summarizes recorded hint diagnostics without adding production dependencies.

Proof status:

- Unit, replay, analyzer, guard, build, proof audit, legacy audit, and anthology validation passed in implementation.
- A real no-touch proof run is still required before graduating active behavior as release-ready.
