# VisuLive Agent Guide

Date: 2026-04-23
Status: Active agent operating guide

This file exists so future specialized agents can work on VisuLive without repeating the same chaos:
- overlapping edits
- slider-driven guesswork
- stale assumptions about source of truth
- visual changes that regress audio/evidence rigor

If this file and the code disagree, the code wins. If this file and the docs disagree, use the docs listed below in the stated order.

## Start Here

Before broad reading, run `.\scripts\rehydrate-agent.ps1`.

If the local helper is unavailable, fall back to `C:\dev\_intel\scripts\Resolve-AgentContext.ps1 -TargetPath C:\dev\GitHub\visulive`.

Before changing code, load only the minimum current spine:

1. [README.md](C:/dev/GitHub/visulive/README.md)
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
4. [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
5. [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
6. [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
7. [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
8. [next-agent-brief.md](C:/dev/GitHub/visulive/docs/next-agent-brief.md) if you need the immediate post-V1 cold-start target

Then load only the task-relevant reference:
- [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md) for golden references, failure patterns, and review cadence
- [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md) for anthology capability, graduation, or future-agent continuation work
- [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md) for visual/art behavior changes
- [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md) for multi-agent lane planning
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md) when writing or updating a specialist brief
- [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md) for capture/replay/benchmark work
- [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md) for hosting, release, domain, or production-repair work
- [documentation-operations.md](C:/dev/GitHub/visulive/docs/documentation-operations.md) only when changing doc structure or canon

## Current Truth

VisuLive is a single public portal with:
- one public `Start Show` path
- one optional `Advanced` layer
- hidden internal acts
- a growing internal anthology engine
- `Music On This PC` as the primary tuning path
- `webgpu / safe` as the real live target tier
- capture/evidence reports as the tuning truth source

Public simplicity is a product rule.
Internal anthology expansion is the ambition rule.

The current blockers are:
- current-proof-valid `Primary benchmark` evidence now exists after the authority/runtime and evidence changes: `run_20260428_192855_gnmlg1` and `run_20260428_194808_ot6j46` are reviewed-candidate proof packages, but no run is current-canonical or release-ready yet
- the Mythic Signature Moment Engine plus Authored Playable Motif System slice is implemented but still coherence-gated; latest valid development baseline `run_20260429_123116_jzqbjo` proves natural signature/playable firing but exposed planned-active hero-form mismatch, scene/motif mismatch, sticky collapse-scar, ring-wallpaper risk, and weak ghost/ambient reach
- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) now explicitly sequences signature moment, world, chamber, hero, authority, stage, post, playable motif, and compositor work, but it is not the final runtime owner until broader compositor/memory extraction reduces the remaining scene compatibility shell
- `src/scene/systems/**` and `src/scene/governors/**` are partly namespace shims over `modules/**` and `rigs/**`
- the anthology families now named in canon are still ahead of the fully extracted runtime
- valid development proof repeats the same actual visual issue: chamber/world authority is strong and hero monopoly is absent, but semantic coherence, ring posture, and signature/playable-scene distinctness are not yet strong enough to start the Hero/World capability wave
- [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts), and [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) now own rare moment eligibility/style routing, first-wave consequence rendering, five authored playable scene postures, and bounded screen-space/post-profile response, but the scenes/moments still need Moment Lab preview and proof-tuning
- color, rings, scenes, and hero shape changes must now be semantically motivated: [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts) derives `VisualMotifSnapshot`, semantic episode, `PaletteFrame`, palette hold reason, and ring posture; [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts) uses semantic form arbitration with longer dwell and pending-form telemetry; analyzer output can flag random-feeling palette churn, unearned hero-form switches, hero/world hue divergence, weak silhouette evidence, scene churn, scene-motif mismatch, scene-intent mismatch, and samey scene silhouettes
- conductor certainty still lags behind the strength of the visual event-spend we want
- low-energy living-music states still need fresh proof that they stay readable, colorful, and stage-active in both `Music On This PC` and `Music In The Room`
- safe-tier quality must stay authored, vivid, and premium

Current hosting truth:
- the live site is `visulive.xylent.studio`
- the preserved legacy target is `visulive-v1.xylent.studio`
- there is no active frontier host today; future staging should only be provisioned once the rewrite is ready for real separate-host testing
- production releases are intentionally manual
- future agents should not treat missing GitHub-triggered auto deploy as a defect unless explicitly asked to change release policy
- future agents should not treat a missing `visulive-frontier.xylent.studio` host as a defect unless the task is explicitly to provision staging
- future agents should not target the legacy host or `release/v1` unless the task is explicitly about preservation or critical legacy repair

One important current clue from live screenshots:
- the wireframe, seam, and rim direction is stronger than the old filled-shell read
- future hero specialists should push emitted structure and dark-body contrast further, not revert to a softly lit blob

## Transitional Honesty Rules

Read these before assuming the rewrite is cleaner than it is:

- a facade is not an owner
- a namespace shim is not an extraction
- a named runtime folder does not mean orchestration moved there
- an unmounted legacy shell file is still transition debt if it remains in the repo

Today that means:

- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) prepares frame context, sequences signature moment resolution, [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts), [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts), [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts), authority resolution, stage work, [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts), and [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts); [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) remains a compatibility assembly shell
- some `systems/**` and `governors/**` files only re-export implementation from `modules/**` or `rigs/**`
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx) and [director.ts](C:/dev/GitHub/visulive/src/types/director.ts) are temporary integration hubs, not the final long-term homes of that responsibility
- [ActivationOverlay.tsx](C:/dev/GitHub/visulive/src/ui/ActivationOverlay.tsx) and [SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx) are legacy shell debt unless a pass explicitly revives them

## Specialist Lanes

These are the intended specialist lanes for future agent work.

### 1. Hero Render / Emissive Materials

Own:
- [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts)

Own specifically:
- hero build/update/quality/telemetry/disposal lifecycle
- hero material stack
- aura, seam, fresnel, rim, edges, core, void, membrane, crown, twins, ghost hero

Do not own:
- global renderer bloom/exposure
- act selection
- conductor thresholds

### 2. Chamber / Environment / Lighting / Atmospherics

Own:
- [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts)
- [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts)
- [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts)
- [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts)
- [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts)
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)

Own specifically:
- chamber/world lifecycle and telemetry
- authority-informed lighting and particles
- chamber rings, portal rings, chroma halos, laser beams, wirefield and ghost lattice
- world sphere, stain/flash planes, fog, and atmospheric presence
- light rig
- post/bloom/exposure interaction

Do not own:
- hero-specific material logic
- conductor semantics

### 3. Show Direction / Acts / Palette / Cue Logic

Own:
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/direction/showDirection.ts)
- [cueGrammar.ts](C:/dev/GitHub/visulive/src/scene/direction/cueGrammar.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- `ShowAct`
- `PaletteState`
- temporal windows
- act hysteresis
- palette holds and transitions
- stable visual-direction contract

This lane should be the only place that decides:
- active act
- palette-state scoring
- temporal window derivation

### 4. Motion / Choreography / Camera / Macro Events

Own:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)
- [MotionSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/MotionSystem.ts)
- [PressureWaveSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/PressureWaveSystem.ts)
- [AccentOrbitSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/AccentOrbitSystem.ts)
- [StageRuntimeRig.ts](C:/dev/GitHub/visulive/src/scene/rigs/StageRuntimeRig.ts)

Own specifically:
- family routing
- macro events
- shell/world drift
- bar/phrase consequence
- camera motion
- satellites, shards, pressure waves

Do not redefine:
- palette policy
- renderer policy
- audio thresholds

### 5. Consequence / Signature Moments / Post

Own:
- [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts)
- [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts)
- [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts)
- [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- rare moment eligibility, cooldowns, phases, seeds, and suppression
- collapse scar, cathedral open, ghost residue, and silence constellation post visuals
- bounded memory traces, aftermath clearance, post telemetry, quality reset, and disposal
- authored playable scene posture, scene dwell, motif/palette match telemetry, and scene silhouette confidence
- bounded signature-moment compositor masks, cuts, bands, edge windows, and post-profile response
- signature moment snapshot contracts consumed by world, chamber, hero, lighting, particles, stage, and motion

Do not own:
- audio-side truth or conductor certainty
- global authority scoring
- unbounded compositor/mixed-media asset systems or long-form memory systems outside the signature-moment slice

### 6. Audio Conductor / Phrase Intelligence

Own:
- [AudioEngine.ts](C:/dev/GitHub/visulive/src/audio/AudioEngine.ts)
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)
- [audio.ts](C:/dev/GitHub/visulive/src/types/audio.ts)

Own specifically:
- source-mode behavior
- beat/drop/section/release detection
- listening and show-state transitions
- performance intent
- audio diagnostics truth

This lane should be the only place that decides:
- conductor certainty
- show-state confidence
- audio-side trigger semantics

### 7. Evidence / Capture / Analyzer

Own:
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts)
- [ReplayController.ts](C:/dev/GitHub/visulive/src/replay/ReplayController.ts)
- [proofMission.ts](C:/dev/GitHub/visulive/src/replay/proofMission.ts)
- [runJournal.ts](C:/dev/GitHub/visulive/src/replay/runJournal.ts)
- [types.ts](C:/dev/GitHub/visulive/src/replay/types.ts)
- [capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs)
- [analyze-captures.mjs](C:/dev/GitHub/visulive/scripts/analyze-captures.mjs)
- [watch-captures.mjs](C:/dev/GitHub/visulive/scripts/watch-captures.mjs)

Own specifically:
- capture windows
- proof missions, mission snapshots, and mission/scenario propagation
- proof run lifecycle, final mission eligibility, suppressed interventions, and artifact integrity
- evidence-quality flags
- report generation
- inbox/canonical/archive handling
- replay metadata fidelity

### 8. Operator UX / Controls / Diagnostics

Own:
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx)
- [ShowLaunchSurface.tsx](C:/dev/GitHub/visulive/src/ui/ShowLaunchSurface.tsx)
- [ShowHud.tsx](C:/dev/GitHub/visulive/src/ui/ShowHud.tsx)
- [BackstagePanel.tsx](C:/dev/GitHub/visulive/src/ui/BackstagePanel.tsx)
- [DiagnosticsOverlay.tsx](C:/dev/GitHub/visulive/src/debug/DiagnosticsOverlay.tsx)
- [index.css](C:/dev/GitHub/visulive/src/styles/index.css)
- [tuning.ts](C:/dev/GitHub/visulive/src/types/tuning.ts)

Own specifically:
- `Start Show` surface
- live HUD
- `Advanced` drawer
- diagnostics presentation
- fullscreen/operator experience

Legacy debt in this lane:
- [ActivationOverlay.tsx](C:/dev/GitHub/visulive/src/ui/ActivationOverlay.tsx)
- [SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx)

### 9. Renderer / Safe-Tier / Quality Policy

Own:
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- quality tiers
- safe-tier authoring
- exposure and bloom policy
- backend-specific degradation
- visual telemetry contract

## Parallel Work Rules

Parallel work is safe now only for these disjoint write scopes:
- audio conductor
- evidence/analyzer
- operator UX
- renderer policy
- show-direction contract
- signature/post consequence, only if write scope is limited to the post lane

Parallel work is not yet safe for multiple visual specialists around the remaining scene compatibility shell unless:
- one agent owns [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts)
- one agent owns [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts), [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts), or authority-fed lighting/particles
- one agent owns [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), and [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts)
- one agent owns remaining motion/camera/event methods still routed through [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) or stage rigs

If that separation is not explicit for a pass, sequence the work instead of parallelizing it.

## Handoff Contracts

These boundaries are non-negotiable:
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/direction/showDirection.ts) decides act, palette, and temporal-window intent
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts) decides renderer-tier, bloom, exposure, and quality policy
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts) decides conductor certainty and audio-side state semantics
- [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts) decides rare moment eligibility, style routing, candidate state, and suppression/conversion
- [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts) renders consequence, aftermath, style postures, and bounded post memory
- [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts) renders authored playable scene posture and reports scene coherence
- [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) renders bounded screen-space signature masks/cuts/bands and feeds renderer post-profile telemetry
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts) and [capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs) decide evidence judgment and report truth

Do not duplicate those decisions inside other lanes.

Do not misread scaffolding as ownership:

- if a file only forwards or re-exports, the owning change still belongs in the real implementation file
- if [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) still sequences the behavior, the scene is still the merge hotspot

## Acceptance Rules

Every specialist pass must answer three things:
- what changed
- what evidence it used
- how to tell if the pass actually worked

Every anthology pass should also name:
- the capability family or bottleneck
- the lane owner
- the runtime ownership status
- the proof target
- the graduation target
- the next dependency
- the failure pattern it is trying to reduce

Every continuation brief should also say:
- what family maturity changed, if any
- what is still blocking it
- what the next agent should do next

After a meaningful pass, write the result with `C:\dev\_intel\scripts\Write-AgentCheckpoint.ps1 -TargetPath C:\dev\GitHub\visulive -Summary "..."` so the next agent inherits the current visual or evidence state without rereading everything.

Brief structure:
- use [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
- update [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md) when maturity, proof status, or next target changes

For visual passes, use:
- valid fresh run packages under [captures/inbox/runs](C:/dev/GitHub/visulive/captures/inbox/runs)
- proof stills from the same run package
- latest analyzer report only when its source date range and build identity match the active branch

For audio/evidence passes, use:
- [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)
- current valid inbox run packages only

## Current Best Next Structural Move

Before heavy parallel visual work, prove the current signature-moment build:

- launch with `npm run dev:proof`
- choose `Backstage -> Capture -> Proof Mission -> Primary benchmark`
- arm `Proof Wave`
- run a 90-120 second no-touch canary on direct PC audio; use `Jon Hopkins - Emerald Rush` for continuity with `run_20260429_123116_jzqbjo`
- end with `Finish Proof Run`; do not rely on closing the tab or stopping audio informally
- review `npm run proof:current`, `npm run evidence:index`, and `npm run run:review -- --run-id <runId>`
- if the canary is valid, run a full no-touch `Primary benchmark` pass before tuning

The primary benchmark proof candidates are valid enough to show the older correction targets: overbright/glow spend, ring persistence, palette churn, unearned hero-form switching, and playable-scene mismatch. The new authored playable motif build must now prove that the five scenes (`neon-cathedral`, `machine-tunnel`, `void-pressure`, `ghost-constellation`, and `collapse-scar`) and the four signature moments are distinct, rare, readable, semantically coherent, and safe across contrast-mythic, maximal-neon, and ambient-premium styles. If proof fails, tune [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts), [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts), [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts), [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts), [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts), [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts), [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts), or stage cue policy without moving ownership back into the scene. If coherence holds, the next feature wave is hero-suppressed/world-as-hero and world mutation verbs through owned systems only.
