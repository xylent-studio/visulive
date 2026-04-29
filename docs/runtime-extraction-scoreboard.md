# VisuLive Runtime Extraction Scoreboard

Date: 2026-04-23
Status: Active extraction scoreboard

This document tracks what still blocks safe parallel anthology growth.

Use it when deciding:

- what is still trapped in [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)
- which runtime owner is real
- which extraction must happen before a family can graduate honestly

Pair it with:

- [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md)
- [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)

## Honesty Rule

Use this scoreboard with one strict rule:

- a facade is not an owner
- a namespace shim is not an extraction
- a named system file does not count unless build, update, ownership, and disposal actually moved there

That means:

- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) now assembles frame context, resolves stage composition, explicitly sequences signature-moment resolution, world, chamber, hero, authority, stage, post, playable motif scene, and compositor passes, but it is not the final runtime owner until later memory extraction removes more scene compatibility shell debt
- `src/scene/systems/**` and `src/scene/governors/**` are partly namespace surfaces over `src/scene/modules/**` and `src/scene/rigs/**`
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) is now less dominant than before, but it remains a compatibility shell and merge hotspot until more scene context assembly and later system families move out

## Current Runtime Reality

The current runtime split is improving, but not honest enough to treat as done:

- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) now prepares frame state, resolves stage composition, resolves [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), updates [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts), updates [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts), explicitly sequences the hero pass, resolves frame authority, runs the remaining stage frame, updates [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), updates [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts), and updates [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) instead of forwarding one opaque `update()` call
- [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts) now owns world sphere, stain/flash planes, fog, atmosphere layers, world telemetry, and disposal
- [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts) now owns chamber geometry, chamber motion/update, chamber-local telemetry inputs, quality reset, and disposal
- [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts) now owns lasting hero meshes/materials, build, update/mutation, color and form routing, quality reset, telemetry inputs, pending-form reporting, and disposal
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts) now owns semantic motif, semantic episode, palette-frame, palette hold reason, ring posture, and hero-form intent for major color/ring/hero meaning; [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts) renders that plan with semantic dwell rather than default hash/novelty rotation
- [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) now owns cross-system chamber/world authority judgment, frame hierarchy scoring, composition safety scoring, and post-render overbright refresh
- [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts) now owns rare moment eligibility, music-character style routing, candidate precharge, cooldown/rarity, phase, forced-preview, and suppression/conversion decisions for the first mythic consequence wave
- [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts) now owns the first consequence/aftermath render lifecycle, style-matrix postures, stronger neon-portal moment silhouettes, post telemetry, memory-trace cap, quality reset, and disposal for collapse scar, cathedral open, ghost residue, and silence constellation
- [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts) now owns the first authored playable scene layer: neon cathedral, machine tunnel, void pressure, ghost constellation, and collapse scar scene posture, scene dwell, scene driver/intent match, motif/palette match telemetry, and camera-space scene silhouettes
- [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) now owns the bounded signature-moment compositor slice and consumes playable motif telemetry: screen-space masks, cuts, vignettes, chromatic bands, edge windows, renderer post-profile inputs, and perceptual contrast/colorfulness/washout telemetry tuned to preserve saturation before adding brightness
- [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts) and [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts) now consume a typed authority snapshot instead of scene-local chamber/world heuristics
- [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts), [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts), [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts), [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts), [StageFrameSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/StageFrameSystem.ts), [MotionSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/MotionSystem.ts), and [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts) now consume the signature moment snapshot where the moment needs whole-frame coordination; chamber now treats rings as semantic posture (`cathedral-architecture`, `event-strike`, `residue-trace`, `suppressed`) rather than default wallpaper
- some `systems/**` and `governors/**` files are only re-export shims
- the real code hotspots still live across the scene file, `modules/**`, and `rigs/**`

## Current Biggest Blocking Extraction

The single highest-leverage blocking extraction is now:

- the `PostSystem`, `PlayableMotifSystem`, and bounded `CompositorSystem` vertical slice is now real, so the active blocker is coherence proof: planned-active hero form, scene intent/motif/palette match, ring posture, and distinct signature moment coverage before any additional consequence family, mixed-media asset pack, or memory system is added

Until that happens:

- visual lanes are safer than before, but the compositor owner is only a bounded signature-moment slice and full memory still lacks an honest runtime home
- chamber/world authority needs fresh live proof before it is trusted as stable rather than newly extracted
- alternate hero species are no longer blocked by update ownership, but still need explicit capability proof
- new consequence, mixed-media, and memory work still risks landing as add-ons unless the first signature moments are proven distinct across style variants, rare, safe-tier viable, and not washed out or overbright
- future agents can overestimate extraction progress if they read folder names instead of real owners

## Area Scoreboard

### Hero

- ownership status: `owned-system`
- current runtime owner:
  - [HeroSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts) for hero meshes/materials, build, update/mutation, semantic color handoff, semantic form choreography, quality reset, telemetry inputs, and disposal
- still lives in `ObsidianBloomScene.ts`:
  - hero update context assembly
  - read-only hero root attachment and palette access for event systems
  - scene-level telemetry aggregation
- next extraction target:
  - no further ownership extraction before chamber/world authority handoff; next hero work should be capability proof
- owner lane:
  - `Hero Ecology`
- blocker:
  - runtime ownership is complete enough for safe hero capability work, but alternate hero species, quiet hero states, hero-suppressed/world-as-hero states, and proof that shape changes feel meaningfully earned are still unproven
- completion condition:
  - met for runtime ownership: hero meshes/materials/build/update/telemetry/dispose and species mutation live in `systems/hero/*`

### Chamber

- ownership status: `partial-system`
- current runtime owner:
  - [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts) for chamber rings, portal rings, chroma halos, ghost lattice, laser beams, chamber-local telemetry inputs, and disposal
  - [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) for cross-system chamber/world authority judgment derived from chamber plus world plus hero telemetry
  - [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts) for chamber-linked lighting response to resolved authority
- still lives in `ObsidianBloomScene.ts`:
  - chamber update context assembly
  - stable chamber access plus authority-context assembly
  - lighting handoff orchestration
- next extraction target:
  - no new chamber extraction before proof; next chamber work should be proof-led authority tuning or capability growth
- owner lane:
  - `World Grammar / Mutation`
- blocker:
  - chamber geometry and authority handoff are extracted, but fresh live proof still has to show that chamber presence reads intentionally instead of decoratively
- completion condition:
  - chamber geometry, chamber-local telemetry, authority handoff, and supporting composition live in explicit system/governor owners and survive proof-backed capture review

### World / Atmosphere / Lighting

- ownership status: `partial-system`
- current runtime owner:
  - [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts) for world sphere, stain/flash planes, fog, atmosphere layers, and world telemetry
  - [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) for whole-frame world/chamber/hero authority judgment
  - [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts) and [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts) for authority-driven supporting world subsystems
- still lives in `ObsidianBloomScene.ts`:
  - world update context assembly and final telemetry aggregation
- next extraction target:
  - after proof, either iterate authority-driven composition again if captures still read weakly, or tune the signature moment handoff where world authority and post consequence overlap
- owner lane:
  - `World Grammar / Mutation`
- blocker:
  - world authority is no longer scene-local math, but it still needs fresh no-touch proof and the supporting lighting/particle owners still sit behind `modules/**` plus namespace surfaces
- completion condition:
  - world authority, supporting lighting/particles composition, and takeover telemetry are owned outside the scene and proven by fresh captures

### Post / Consequence / Aftermath

- ownership status: `owned-system` for the first signature-moment vertical slice
- current runtime owner:
  - [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts) for rare moment eligibility, phase, cooldown, seed, suppression, and whole-frame consequence intent
  - [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts) for collapse scar, cathedral open, ghost residue, silence constellation, memory traces, consequence overlays, telemetry, quality reset, and disposal
  - [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts) for authored scene posture that turns signatures into playable scenes rather than free-floating effects
  - [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) for the bounded screen-space/mask/post-profile response owned by signature moments and playable scenes
  - [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) for explicit `resolveSignatureMoment -> ... -> updatePostSystem -> updatePlayableMotifSystem -> updateCompositorSystem` sequencing
- still lives in `ObsidianBloomScene.ts`:
  - signature and post update context assembly
  - scene-level telemetry aggregation
  - camera attachment for post-owned camera-space resources
- next extraction target:
  - use local Moment Lab to preview the 5 scene x 4 signature moment matrix across moment styles, then proof-tune before adding more consequence families
- owner lane:
  - `Consequence / Aftermath / Post`
- blocker:
  - ownership exists, but fresh proof must show moments and playable scenes are visually distinct, rare, premium in quiet states, and not just another overbright or ring-overdraw path
- completion condition:
  - met for the first full-capability slice when Moment Lab receipts and fresh captures show the five playable scenes plus collapse scar, cathedral open, ghost residue, and silence constellation as recognizable image classes across contrast/neon/ambient postures with safe aftermath clearance

### Playable Motif Scenes

- ownership status: `owned-system` for the first authored scene layer
- current runtime owner:
  - [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts) for scene selection from signature/motif/stage/authority context, dwell, camera-space scene silhouettes, scene driver/intent telemetry, motif/palette match telemetry, and quality/disposal lifecycle
  - [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts) for semantic motif and palette-frame intent that playable scenes consume
  - [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) for explicit sequencing between `PostSystem` and `CompositorSystem`
- still lives in `ObsidianBloomScene.ts`:
  - playable-scene update context assembly
  - camera attachment for camera-space resources
  - final telemetry aggregation
- next extraction target:
  - no broader scene family until proof shows the first five scenes read as distinct silhouettes: neon cathedral, machine tunnel, void pressure, ghost constellation, and collapse scar
- owner lane:
  - `Show Direction / Motif / Compositor`
- blocker:
  - the first owned playable scene layer exists, but fresh proof must show scene dwell, scene intent match, scene-motif match, scene-palette match, ring posture containment, and thumbnail silhouette confidence before more scenes are added
- completion condition:
  - fresh Moment Lab/contact-sheet review plus no-touch capture shows the active scene is recognizable, musically earned, and not just another transient post overlay

### Motion / Camera / Macro Event Support

- ownership status: `partial-system`
- current runtime owner:
  - runtime rigs plus remaining scene ownership
- still lives in `ObsidianBloomScene.ts`:
  - camera phrase coupling
  - some motion/event routing that should eventually become clearer system ownership
- next extraction target:
  - keep shrinking scene-local camera/event logic into motion/event system owners
- owner lane:
  - `Lighting / Cinematography`
- blocker:
  - camera phrase behavior is still entangled with legacy motion code paths even though runtime sequencing is now explicit
- completion condition:
  - camera and spatial phrase behavior are system-owned and testable

### Particles / Fields

- ownership status: `partial-system`
- current runtime owner:
  - [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts) via namespace surface at [src/scene/systems/world/ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/ParticleSystem.ts)
- still lives in `ObsidianBloomScene.ts`:
  - role selection and some field intent coupling
- next extraction target:
  - expand particle ownership from presence to explicit role families
- owner lane:
  - `Particles / Fields`
- blocker:
  - particle roles are not yet explicit enough for analyzer coverage or graduation
- completion condition:
  - field roles, behaviors, and telemetry inputs are system-owned and declared in the anthology catalog

### Compositor

- ownership status: `partial-system`
- current runtime owner:
  - [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) for the bounded signature-moment compositor slice: screen-space masks, cuts, vignettes, chromatic bands, edge windows, post-profile telemetry, quality reset, and disposal
- still lives in `ObsidianBloomScene.ts`:
  - compositor update context assembly
  - camera attachment for compositor-owned camera-space resources
  - final telemetry aggregation
- next extraction target:
  - do not broaden compositor into asset packs until the signature-moment slice is previewed and proof-tuned
- owner lane:
  - `Mixed Media / Compositor / Content`
- blocker:
  - the first compositor owner exists, but it is intentionally bounded to signature moments; mixed-media layers, asset legality metadata, and reusable compositor content families are still later work
- completion condition:
  - compositor families and asset-backed masks live in `systems/compositor/*`, feed renderer post deliberately, and are proven by fresh captures rather than lab-only previews

### Memory

- ownership status: `legacy-monolith`
- current runtime owner:
  - no dedicated runtime owner yet
- still lives in `ObsidianBloomScene.ts`:
  - only incidental residues and scene-local persistence; no true memory owner
- next extraction target:
  - `MemorySystem`
- owner lane:
  - `Motif / Memory`
- blocker:
  - no real runtime owner yet for motif recall, scar persistence, or recurrence bias
- completion condition:
  - memory families operate through `systems/memory/*` with explicit recurrence policy

### Content / Asset Packs

- ownership status: `legacy-monolith`
- current runtime owner:
  - no dedicated runtime owner yet
- still lives in `ObsidianBloomScene.ts`:
  - not as a formal content system yet, which is exactly the gap
- next extraction target:
  - `ContentSystem`
- owner lane:
  - `Mixed Media / Compositor / Content`
- blocker:
  - authored asset packs, legality metadata, and declaration ownership do not have a runtime home
- completion condition:
  - content packs and legality metadata live in `systems/content/*`

## Parallel Work Safety Rule

Parallel repertoire work becomes much safer when:

- chamber/world authority handoff is extracted and proven
- post signature moments are proven and compositor/memory have real owners

Until then, treat any new lasting family added to the scene monolith as debt, not progress.

## Start-Right Execution Order

Before wider anthology work, use this order:

1. keep this scoreboard honest when a file is only a facade or shim
2. move runtime sequencing out of [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) instead of only renaming homes around it
3. prove the new chamber/world authority split plus the first `PostSystem` signature moments with live sanity plus no-touch capture review before declaring them stable
4. tune the four signature moments from fresh proof before starting compositor, memory, or content extraction
