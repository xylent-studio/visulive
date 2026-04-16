# VisuLive Agent Workstreams

Date: 2026-04-15  
Status: Active specialist workstream map

This document defines how to break VisuLive into specialist agent lanes without losing coherence.

It exists because the project has reached the point where:
- taste alone is not enough
- more undifferentiated iteration will create collisions
- the current bottlenecks are different enough that one generic agent loop is no longer the best structure

## Why Specialization Now

Current blockers are specific:
- the hero still needs a stronger electric and emissive identity
- the world, chamber, and lighting stack still need more deliberate scale consequence
- motion and choreography need stronger bar and phrase authorship
- conductor certainty still needs to catch up to the show behavior we want
- the evidence loop must stay trustworthy
- the app's real live target is still `webgpu / safe`
- framing governance must become strong enough to stop bad shots before they dominate the benchmark
- composition telemetry must be able to judge declared-vs-delivered chamber/world authority
- the current AFQR benchmark is aftermath-locked, with haunt/ghost-afterimage monopolizing the run and the hero staying too tiny and too center-bound

That means the best next structure is not "more brainstorming."
It is a specialist operating model with clear ownership, handoffs, and acceptance rules.

## Current Next-Level Wave

The active wave is 6DoF locomotion, act/family palette holds, and screen-space consequence.

It is docs-led and handoff-heavy so the next context reset still knows what the wave was trying to do.

Wave sequence:

1. evidence baseline
2. show direction / color
3. motion / locomotion / camera
4. compositor / safe-tier consequence
5. evidence rerun
6. canon update

## Current Governance Wave

The active wave is governance-first.

That means the highest-priority specialist lanes right now are:

- `Audio Conductor`
- `Show Direction / Benchmark Steward`
- `Framing Governor / Hero Mobility`
- `Telemetry / Analyzer`
- `Chamber / World Authority`
- `Tempo / Cadence / Range Mapping`
- `Repo Steward / Canon / Benchmark`

Frontier visual mutation lanes may research in parallel, but they do not land until the governance benchmark clears.

## The Right Specialist Roster

### 1. Hero Render / Emissive Materials Agent

Mission:
- make the hero read as dark matter wrapped in emitted light
- push seam, rim, fresnel, and core behavior
- stop the hero from collapsing back into a softly lit blob

Primary ownership:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Own specifically:
- `buildHero()`
- `updateHero(...)`
- hero body, core, void, membrane, crown, edges, aura, seam, and fresnel logic

Success looks like:
- quiet frames still read as an entity, not a washed object
- active frames read as electric structure, not just brighter fill
- the hero no longer sits in a single purple or cyan comfort lane for too long

Do not own:
- bloom pipeline
- quality tier policy
- act selection

### 2. Chamber / Environment / Lighting Agent

Mission:
- make the whole frame feel like a world
- keep blacks valuable while still spending scale and color when the music earns it

Primary ownership:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)

Own specifically:
- world sphere
- chamber rings
- portal rings
- chroma halos
- lasers
- fog
- light rig
- stain and flash planes
- event-vs-ambient glow spend outside the hero

Success looks like:
- the screen feels like a chamber, not a backdrop
- the hero no longer has to carry the whole image
- color authority survives `safe` tier

Do not own:
- audio thresholds
- quick starts

### 3. Motion / Choreography / Camera Agent

Mission:
- make the show feel paced, weighted, and authored across beats, bars, and phrases
- resolve motion in full space instead of one-axis wobble

Primary ownership:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Own specifically:
- camera behavior
- shell and world drift
- macro-event choreography
- family routing
- pressure waves
- satellites
- shards
- bar and phrase consequence
- 6DoF locomotion phrasing
- bank, roll, tumble, and precession intent

Success looks like:
- slow ambient passages still move with intention
- slower shell and world behavior between beats
- stronger before and after contrast on structural moments
- less constant deformation
- more meaningful widen, tighten, and release logic
- camera roll appears only when the cue earns it

Do not own:
- palette decisions
- renderer policy

### 4. Show Direction / Act / Palette Agent

Mission:
- keep the system internally directed instead of slider-led
- make similar musical signatures converge on similar visual acts and palette consequences
- own palette-state logic as the canonical color-specialist lane
- make palette holds and handoffs feel authored rather than twitchy

Primary ownership:
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- `ShowAct`
- `PaletteState`
- temporal windows
- act hysteresis
- palette hold and switch logic
- visual telemetry schema

Success looks like:
- acts feel deliberate
- palette changes feel authored rather than twitchy
- the scene can transform without turning random
- similar moments land in similar color families
- slow passages can stay varied without becoming random

Do not own:
- raw beat and drop detection
- bloom and exposure implementation

### 5. Audio Conductor / Phrase Intelligence Agent

Mission:
- make the visual system trust the music more intelligently
- improve drop, section, and release certainty

Primary ownership:
- [AudioEngine.ts](C:/dev/GitHub/visulive/src/audio/AudioEngine.ts)
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)
- [audio.ts](C:/dev/GitHub/visulive/src/types/audio.ts)

Own specifically:
- beat confidence
- drop impact
- section change
- phrase resolve
- performance intent
- show-state semantics

Success looks like:
- fewer undercommitted drops
- fewer false surge states
- stronger section-turn consequence
- more consistent cue timing across similar music

Do not own:
- chamber brightness
- palette routing

### 6. Evidence / Capture / Analyzer Agent

Mission:
- keep the improvement loop honest
- make evidence useful, focused, and comparable

Primary ownership:
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts)
- [ReplayController.ts](C:/dev/GitHub/visulive/src/replay/ReplayController.ts)
- [types.ts](C:/dev/GitHub/visulive/src/replay/types.ts)
- [capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs)
- [analyze-captures.mjs](C:/dev/GitHub/visulive/scripts/analyze-captures.mjs)
- [watch-captures.mjs](C:/dev/GitHub/visulive/scripts/watch-captures.mjs)

Own specifically:
- capture windows
- quality flags
- inbox, canonical, and archive discipline
- report logic
- analyzer summaries

Success looks like:
- each capture represents one meaningful musical idea
- analyzer outputs can actually drive retuning decisions
- stale or corrupt evidence cannot poison the loop

### 7. Operator UX / Controls / Diagnostics Agent

Mission:
- make the system usable as a real instrument
- keep the operator path simple without hiding important truth

Primary ownership:
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx)
- [ActivationOverlay.tsx](C:/dev/GitHub/visulive/src/ui/ActivationOverlay.tsx)
- [SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx)
- [DiagnosticsOverlay.tsx](C:/dev/GitHub/visulive/src/debug/DiagnosticsOverlay.tsx)
- [index.css](C:/dev/GitHub/visulive/src/styles/index.css)
- [tuning.ts](C:/dev/GitHub/visulive/src/types/tuning.ts)

Success looks like:
- quick starts stay obvious
- controls stay meaningful
- diagnostics help instead of confuse
- future specialists can expose or hide truth intentionally

### 8. Renderer / Safe-Tier / Performance Agent

Mission:
- make `safe` look like the intended live show, not the compromised fallback
- make screen-space consequence survive the safe tier

Primary ownership:
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- quality tiers
- DPR policy
- bloom and exposure defaults
- degradation rules
- telemetry for render quality

Success looks like:
- `safe` stays vivid and premium
- degradation cuts density first, not color authority first
- target-machine testing no longer feels like second-class output
- the frame still reads as a stage, not a washed fallback

## Current Bottleneck-To-Agent Map

Use this map when deciding what specialist to run next.

- Hero still too filled, not electric enough:
  - `Hero Render / Emissive Materials`
- Chamber not participating enough or washing the frame:
  - `Chamber / Environment / Lighting`
- Motion feels samey or too literal:
  - `Motion / Choreography / Camera`
- Color feels too samey:
  - `Show Direction / Act / Palette`
- Drops, builds, and releases not landing consistently:
  - `Audio Conductor / Phrase Intelligence`
  - `Show Direction / Act / Palette`
- Reports are noisy or not trustworthy:
  - `Evidence / Capture / Analyzer`
- Quick starts, controls, or test flow are confusing:
  - `Operator UX / Controls / Diagnostics`
- Target machine looks muted or compromised:
  - `Renderer / Safe-Tier / Performance`

## Parallel-Safe Work Right Now

These lanes can work in parallel today with low conflict risk:
- audio conductor
- evidence and analyzer
- operator UX
- renderer and safe-tier
- show-direction contract

These lanes are not truly parallel-safe yet because the code is still too monolithic:
- hero render
- chamber, environment, and lighting
- motion, choreography, and camera

All three still overlap inside [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts).

## What To Split Before Heavy Parallel Visual Work

The best structural extraction is:

1. `hero-system`
   - hero materials
   - core
   - shell
   - crown
   - fresnel, rims, and seams

2. `chamber-system`
   - world
   - rings
   - portal and chroma halos
   - lasers
   - fog
   - light rig

3. `motion-system`
   - camera
   - drift
   - macro events
   - satellites, shards, and pressure waves
   - family spending

4. keep [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts) as the direction contract
5. keep [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts) as the renderer contract

Until that split exists, sequence visual specialists or give them explicit method ownership inside the monolith.

## Agent Handoff Rules

Every specialist brief should contain:
- one mission only
- owned files
- forbidden files
- evidence to use
- acceptance criteria

Use:
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)

Good examples:
- hero render: use live screenshots plus latest inbox report; do not edit audio or renderer policy
- conductor: use inbox captures plus analyzer report; do not tune scene colors to hide weak cues
- renderer: tune `safe` tier from live screenshots; do not redefine palette or act logic

## Recommended Execution Order

For the current wave, the highest-value sequence is:

1. `Evidence / Capture / Analyzer`
2. `Show Direction / Act / Palette`
3. `Motion / Choreography / Camera`
4. `Renderer / Safe-Tier / Performance`
5. `Chamber / Environment / Lighting`
6. `Audio Conductor / Phrase Intelligence`
7. `Hero Render / Emissive Materials`
8. `Operator UX / Controls / Diagnostics`

That order is deliberate for the current wave.
The immediate blocker is no longer "can the system look bigger."
It is "can the system break samey motion, restore image-class diversity, and move the hero more without breaking composition safety."
