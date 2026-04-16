# VisuLive — Lead Agent Brief for the Next Push

Date: 2026-04-08
Audience: fresh manager / lead Codex agent plus specialist subagents

## Why this brief exists

Codex is proving useful as an implementation engine, but it is underperforming when left to invent the artistic and systems-level path on its own.

For VisuLive, that means the manager agent must not behave like a generic coding assistant.
It must behave like a creative technical director and systems integrator.

The repo already has meaningful infrastructure.
The problem is no longer basic capability.
The problem is that the current visual result still feels like a promising reactive artifact instead of a room-commanding show system.

## Non-negotiable target

We are not making a tasteful orb visualizer.

We are making a big-screen performance machine that can:
- brood in silence
- gather pressure before impact
- spend hard on drops and section turns
- leave residue after major moments
- feel authored across bars, phrases, and sections
- look impressive from across a room on a TV or large display
- prove that AI co-creation can produce something genuinely show-worthy

The target is closer to:
- concert/festival visual authority
- laser-show consequence
- boss-fight staging
- VJ dramaturgy
- game-VFX readability

The target is not:
- incremental prettification of a center object
- more sliders
- more random effects
- more local tweaks without a frame-level plan

## Current diagnosis

### 1. The whole frame is still under-authored
The project has visual ingredients, but they are not yet composing into a truly staged image.
The center hero is still carrying too much of the burden.
The chamber, world, event layers, and screen-space spend do not yet feel authoritative enough.

### 2. The hero is still too dominant as image grammar
The hero is not the problem by itself.
The problem is that it still behaves like the dominant answer.
That traps the system in “interesting centerpiece with support layers” instead of “whole-screen event architecture.”

### 3. The project likely needs a more explicit hybrid 2D/3D compositing mindset
The current output is still too dependent on a physically staged 3D object read.
It needs stronger screen-space logic:
- stains
- slashes
- wipes
- afterimages
- event ghosts
- ring burns
- silhouette emphasis
- cue-shaped flare logic

### 4. Reactivity is ahead of choreography
There is a conductor and internal direction, but the show still too often reacts instead of performs.
We need stronger authored before/after states around:
- pre-drop gather
- section cutover
- impact
- release
- aftermath

### 5. The scene monolith is actively limiting intelligent iteration
`ObsidianBloomScene.ts` is too large and too semantically overloaded.
Do not pretend this is a minor cleanup item.
It is one of the reasons the project keeps improving in one axis while regressing in another.

### 6. Safe-tier is not a temporary inconvenience; it is the real design target
Stop thinking of `safe` as a lesser version of the show.
Treat it as the machine that must still look authored and premium.
If a visual idea only works above safe-tier budget, it is not yet production truth.

## What to preserve

Keep these principles and systems:
- evidence-first tuning loop
- conductor / show-director separation
- hidden acts instead of mode soup
- dark-value discipline
- emissive-first direction
- wireframe / seam / rim / structural glow direction
- quick-start-first operator posture
- specialist-agent operating model

## What to stop doing

Stop:
- chasing local beauty over frame authority
- solving every problem inside the hero
- adding new controls before the show language is stronger
- treating every music event as brightness modulation
- doing broad scene churn without evidence and acceptance tests
- letting multiple agents edit the same visual file without hard ownership

## The real next-stage architecture

The visual system should evolve toward four coordinated layers:

### Layer A — Cue / dramaturgy layer
Responsible for:
- what kind of event is happening
- how important it is
- what visual class it deserves
- how long pre- and post-states should live

This sits above raw detection.
This is not just “dropImpact > threshold.”
This is “this is a rupture,” “this is a gather,” “this is a burn-off,” “this is an afterimage phase.”

### Layer B — Spatial stage layer
Responsible for:
- chamber scale
- orbital authority
- portal / ring behavior
- volumetric implication
- widen / tighten / collapse / aperture changes

This is what makes the frame feel like a place instead of a backdrop.

### Layer C — Hero / emblem layer
Responsible for:
- iconic central form
- seam / rim / lattice / core / membrane behavior
- identity continuity across acts

Important:
The hero should become one actor in the show, not the entire show.

### Layer D — Screen-space event layer
Responsible for:
- afterimage
- burn-in
- slash planes
- impact ghosts
- lensing / chromatic separation
- cue-shaped composite events

This is likely where a lot of the missing “festival/show” authority will come from.

## The actual next implementation order

### Phase 1 — Structural split before more major art churn
Do first.

Split `ObsidianBloomScene.ts` into at least:
- `HeroSystem`
- `ChamberSystem`
- `MotionEventSystem`
- optional shared `ShowSceneState` / `VisualCueState`

Keep behavior equivalent at first where possible.
This is not a redesign pass yet.
This is making the next redesign sane.

### Phase 2 — Build a true cue taxonomy above detection
Define a small explicit cue vocabulary.
Not dozens.
A few powerful classes.

Suggested initial cue classes:
- `gather`
- `ignite`
- `rupture`
- `surge`
- `aftermath`
- `haunt`

Each cue should specify:
- pre-roll behavior
- impact behavior
- post-roll behavior
- spend budget
- chamber participation
- screen-space participation
- hero participation
- preferred act / palette tendencies

### Phase 3 — Add screen-space event grammar
This is likely the biggest creative unlock.

Add or prototype:
- afterimage trails
- additive impact ghosts
- horizontal or radial rupture planes
- stain flashes that decay instead of just pop
- limited chromatic split on impact windows
- event-specific masked glow passes
- silhouette-preserving flash logic

### Phase 4 — Rebalance frame authority
Make the whole frame matter more.

Targets:
- chamber carries more of the picture
- the hero spends less continuous area and more decisive structure
- major events alter composition, not just brightness
- quiet states still feel alive and intentional

### Phase 5 — Strengthen phrase-scale motion authorship
Go after:
- tension accumulation
- section-turn consequence
- widen/tighten contrast
- decay behavior that leaves memory
- different event families for different musical signatures

### Phase 6 — Tune safe-tier as a first-class aesthetic target
Audit the new show specifically in `webgpu / safe`.
Not as a check-box.
As a real visual target.

## Specialist agent map

### Lead integrator
Owns:
- system coherence
- acceptance criteria
- merge order
- canon docs
- final creative direction

### Subagent 1 — Structure / scene split
Owns:
- extraction of hero/chamber/motion systems
- interface contracts
- zero-regression split pass

### Subagent 2 — Cue engine / dramaturgy
Owns:
- cue taxonomy
- event classes
- cue timing windows
- bridge from conductor truth into visual-cue truth

### Subagent 3 — Screen-space event compositor
Owns:
- afterimage / ghost / flash / stain / slit / flare experiments
- post-pass event prototypes
- masked event spend

### Subagent 4 — Chamber / stage authority
Owns:
- rings
- orbitals
- portal logic
- whole-frame consequence
- large-display composition

### Subagent 5 — Hero identity grammar
Owns:
- dark mass vs emitted structure
- seam / lattice / membrane / core clarity
- silhouette strength
- less blob, more emblematic entity

### Subagent 6 — Evidence / benchmark loop
Owns:
- capture discipline
- canonical scenarios
- comparable before/after reports
- tagged review captures for each pass

### Subagent 7 — Safe-tier performance
Owns:
- performance profiling
- budget policy
- graceful degradation rules
- preservation of visual intent under safe-tier limits

## How the lead agent should brief specialists

Every brief must include:
- exact mission
- owned files only
- forbidden files
- evidence to use
- what success looks like in screenshots or captures
- what must not regress

No brief should say:
- “improve the scene however you want”
- “touch whatever is needed”
- “make it more cinematic” without examples or tests

## The reference map we should actively mine

### Synesthesia
Mine for:
- shader-scene packaging
- audio-uniform thinking
- rapid scene prototyping mindset
- Shadertoy / ISF adjacency

### Notch
Mine for:
- audio-reactive workflow posture
- live-show discipline
- separation between audio ingestion and live playback responsibility

### Resolume Wire
Mine for:
- modular FFT use
- composable event logic
- lightweight patch-style experimentation

### TouchDesigner
Mine for:
- CHOP/TOP separation mentality
- control-data versus image-data discipline
- fast prototyping of cue transforms

### Unreal Niagara
Mine for:
- system/emitter/module thinking
- explicit execution groups
- data channels mindset
- effect taxonomy and modularity

### vvvv gamma / VL.Stride
Mine for:
- patchable composition thinking
- render/debug workflow
- profiling posture
- graphics system inspection culture

### grandMA / show-control logic
Mine for:
- cue / sequence / timing concepts
- event importance hierarchy
- transition authorship
- executor mentality

### Games to study conceptually
Study for principles, not copying:
- Rez Infinite
- Tetris Effect
- Thumper
- Control
- Returnal

Look for:
- silhouette discipline
- impact language
- phase transitions
- residue after major events
- readable spectacle without noise soup

## Asset and source-material plan

We need better source material for Codex and subagents.
Do not rely only on prose.
Build a working board with:

### 1. Internal evidence set
- canonical VisuLive captures
- best historical screenshots
- weak screenshots that show failure modes
- labeled examples of “too blob,” “good chamber,” “good aftermath,” “weak drop,” etc.

### 2. Reference still board
Curate references by category:
- chamber scale
- laser architecture
- impact frames
- aftermath frames
- quiet-but-alive frames
- silhouette / emblem references
- color authority references

### 3. Motion board
Short clips or GIFs labeled by motion principle:
- gather
- rupture
- dissolve
- widen
- constrict
- residue
- drift
- counter-motion

### 4. Visual grammar board
Collect examples of:
- emitted wireframe
- dark mass with electric edge
- screen-space cuts and burns
- ghosted afterimages
- volumetric implied depth

## Concrete asks for the next manager agent

1. Read the repo canon first.
2. Confirm current architecture and hotspot map.
3. Do not start with broad visual tweaking.
4. Produce a short execution plan for the next 3 passes.
5. Spawn specialists only with hard file ownership.
6. Make the first major code pass the structural scene split.
7. Make the second major pass the cue taxonomy layer.
8. Make the third major pass the screen-space event grammar pass.
9. Require evidence screenshots and capture comparisons for every specialist pass.
10. Keep the target fixed: whole-frame show authority, not center-object polish.

## Acceptance criteria for the next meaningful milestone

We should call the next milestone successful only if the show demonstrates all of this:
- quiet state looks intentional, dark, and alive
- pre-drop visibly gathers pressure
- drops alter the whole frame, not just the hero brightness
- aftermath leaves residue and memory
- the center form reads as an emblematic entity, not a glowing blob
- safe-tier still looks premium
- similar musical events create similar classes of consequence
- screenshots from across multiple songs finally feel like one authored system

## Final reminder to the lead agent

You are not here to merely code faster.
You are here to impose stronger authorship, structure, and visual consequence on a system that already has enough raw capability.

Do not ask how to make the orb better.
Ask how to make the room believe.
