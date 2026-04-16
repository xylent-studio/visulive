# VisuLive — Research Pack for the Next Push

Date: 2026-04-08
Purpose: practical extraction notes for lead agent and specialists

## What to extract from each reference

### three.js WebGPURenderer / TSL
Extract:
- which post-processing utilities already exist in TSL
- what can be expressed as node-based post instead of custom renderer churn
- where afterimage, anamorphic flare, bloom, chromatic aberration, and compute-friendly workflows can replace ad hoc hacks

Use for:
- screen-space event grammar
- safer post-pass experiments
- future-proof WebGPU-native authoring

### Synesthesia / SSF
Extract:
- minimal scene packaging ideas
- audio-uniform design patterns
- fast scene iteration posture
- how fragment-shader-driven scenes stay expressive without giant app architecture

Use for:
- scene prototyping lane
- alternate grammar experiments
- possible sandbox pipeline outside the flagship repo

### Notch
Extract:
- real show workflow discipline
- live-input versus playback separation
- audio-reactive building blocks
- how professional tools think about audio routing and performance responsibility

Use for:
- conductor posture
- show design discipline
- production mindset

### Resolume Wire
Extract:
- FFT modularity
- patch thinking for event logic
- fast experimentation in cue transforms and mappings

Use for:
- cue prototyping
- lightweight routing experiments

### TouchDesigner
Extract:
- CHOP/TOP separation
- disciplined control-versus-image pipelines
- operator-friendly experimentation patterns

Use for:
- debugging visual transforms
- designing future sandbox tools

### Unreal Niagara
Extract:
- systems / emitters / modules / parameters separation
- execution groups
- data-channel thinking
- lightweight emitters mindset for performance-sensitive work

Use for:
- re-architecting scene layers
- cue/event modularity
- performance-aware effect grouping

### vvvv gamma / VL.Stride / RenderDoc workflow
Extract:
- graphics debugging posture
- profiler discipline
- render inspection mindset
- system-level graphics troubleshooting culture

Use for:
- safe-tier profiling
- bottleneck identification
- GPU-aware debugging behavior

### grandMA cue logic
Extract:
- sequences
- cue timing
- transitions
- playback authority
- event hierarchy

Use for:
- cue-engine design
- phrase-level consequence
- authored transition timing

## Suggested experimentation tracks

### Track A — Pure visual grammar sandbox
Build tiny experiments for:
- afterimage decay
- impact slit / rupture plane
- radial burn halos
- silhouette-preserving flashes
- event ghost duplication

These can live outside the main flagship file first.

### Track B — Cue architecture sandbox
Prototype a small visual-cue state machine with:
- gather
- ignite
- rupture
- aftermath
- haunt

Verify:
- pre and post windows
- spend budgets
- act influence

### Track C — Chamber authority sandbox
Prototype non-hero-led frames:
- chamber-first frames
- ring collapse / aperture changes
- wide cathedral frames
- off-center hero compositions

### Track D — Safe-tier profiling pass
Measure the real cost of:
- particle counts
- bloom spend
- afterimage passes
- compositing nodes
- extra render targets

## Required review assets for every major pass

For each significant pass, produce:
- 3 strong screenshots
- 3 weak screenshots
- 1 short written note on what improved
- 1 short written note on what regressed or remains weak
- a capture tag set that names the cue classes observed

## What not to forget

- The project is already concept-rich. It is not source-material rich enough.
- Codex will code whatever is implied; make the implication sharper.
- Visual ambition must be accompanied by profiling discipline.
- The system needs stronger event classes more than it needs more random effects.
- The whole-frame composition question is now more important than micro-detail polish.
