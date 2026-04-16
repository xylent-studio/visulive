# VisuLive Project Status

Date: 2026-04-15
Status: Active implementation snapshot

This is the repo's current status page.

Use it to answer five practical questions quickly:

- what is already shipped
- what is still unfinished
- what is blocking the next quality leap
- what should be tested next
- what should not be worked on yet

If this file and the code disagree, the code wins. If this file and older planning docs disagree, this file is the current implementation snapshot.

## Current State

The project is in a real operator-testable state.

That means:

- the app runs
- the listening engine works
- the visual system works
- the controls are usable
- the docs are navigable
- the repo now has an explicit specialist-agent operating model for future parallel work
- the next source of truth is real testing and captured evidence, not more speculative planning

### Verification status

Latest local verification:

- `npm run check` passes
- `82` tests pass
- production build passes

Current standing warning:

- the build still reports a large `three-vendor` chunk warning

## Shipped Now

### Input and listening

The app now supports:

- `Use Microphone`
- `Use PC Audio`
- `Use Both`

The operator-facing quick starts now support:

- `Music On This PC`
- `Music In The Room`
- `Big Show Hybrid`

The listening stack now includes:

- mic-truth reporting
- direct PC-audio capture through Chrome share picker
- hybrid source mode
- semantic listening interpretation
- conductor-level beat / phrase / drop intent
- show-state and moment logic
- hidden diagnostics with runtime truth

### Visual and show system

The current visual system now includes:

- full-frame chamber/world participation
- macro event logic
- layered macro-event stacking
- deterministic event spending based on musical signature instead of simple event rotation
- an internal show-director layer that retunes color, framing, radiance, world activity, geometry, and laser drive over time with the music
- multi-state show behavior
- stronger drop / section camera and world consequence
- aggressive neon / laser / psychedelic palette spend across world, chamber, hero, particles, and lights
- laser-fan chamber architecture and giant chroma halos
- more independent shell choreography across membrane, crown, edges, halos, and chamber rings
- a true organic spatial-life layer across chamber, hero, shell, and camera
- a hidden multi-act show director so the flagship can transform internally as `Void Chamber`, `Laser Bloom`, `Matrix Storm`, `Eclipse Rupture`, and `Ghost Afterimage`
- an emissive-first hero/chamber render model so color authority comes from emitted/additive structure instead of mostly from warm/cool stage lighting
- controlled exposure lift in the renderer so color and glow pop harder on real musical peaks without just washing the scene brighter
- a darker ambient-vs-event glow budget so baseline luminance stays restrained and peaks spend most of the bloom
- a stricter ambient-light retune across the world, chamber, hero, particles, and lights so the frame stays darker between events and saves its hottest spend for real hits
- neutral tone mapping and a stronger event-biased bloom model so saturated highlights survive the render pipeline better instead of flattening into pastel ACES compression
- a new additive hero aura layer so the main object is no longer forced to read only as a physically lit mesh
- a cooler stage-light model so the hero is less likely to pick up beige warm/cool reflections that neutralize the neon palette
- authored palette-state direction across sections (`void-cyan`, `tron-blue`, `acid-lime`, `solar-magenta`, `ghost-white`)
- stronger palette authority on the hero, shell, and accent layers so the image is less likely to flatten back into one safe purple read
- temporal motion windows between beats so shell/world behavior can gather, strike, release, float, turn, and resolve with more intention
- a docs-led next-level wave for stage-led 6DoF motion, act/family palette holds, and screen-space consequence
- corrected framing/camera semantics so higher composition/framing actually opens the shot instead of tightening it
- a smaller, less frame-dominant hero baseline so the chamber can read as a world instead of a close-up object study
- darker hero material bodies with hotter emissive edge spend so the main form reads more neon/electric and less pastel/matte
- explicit emissive seam, rim, and fresnel layers so the main object can read more like dark matter wrapped in emitted light instead of a softly lit solid
- overlay emissive layers that render on top intentionally instead of depth-fighting against the hero shell
- a real WebGPU bloom pass in the render pipeline instead of exposure-only fake glow
- untone-mapped additive neon layers so lasers, halos, stains, membrane light, and other emissive accents read hotter and more electric
- more dominant weighted hero/core/membrane/crown palette routing so the main object is less likely to flatten into one safe purple read
- a darker baseline glow balance so bloom, world stain, shell light, and environmental flash are spent more selectively instead of overwhelming the frame most of the time
- a less conservative quality governor so WebGPU machines stay in richer quality tiers unless performance truly deteriorates
- fullscreen visualization-only mode
- room-scale framing controls
- curated operator controls
- pointer/cursor interaction disabled in normal runtime so the show reads as screen-led rather than mouse-steered
- a real framing-governor layer with shot classes, transition classes, fallback rules, and composition-safety enforcement behind the scene
- stage-composition telemetry in the live frame path, including hero coverage, off-center, depth, chamber presence, frame hierarchy, ring-belt persistence, wirefield density, and declared-vs-delivered world dominance
- a true post-deformation hero max clamp so the planned hero ceiling is now enforced on final rendered scale instead of only on the base scalar
- governance-aware replay/analyzer plumbing so fresh captures can be judged on composition safety instead of only cue spread, glow, and exposure
- manifest-backed benchmark reads in reports even when the active inbox is empty, so archived truth remains visible in `capture-analysis_latest.md`
- chamber-envelope-driven world, chamber, stage-frame, and light-rig floors so chamber authority is now spent through the actual live scene instead of staying mostly semantic
- stronger internal range mapping behind the existing controls so `Composition`, `World Activity`, `Show Scale`, `Glow`, and color posture now bite harder without adding more public knobs
- a brighter low-energy music floor so quiet-but-real musical input can still read as a restrained neon stage instead of collapsing into a nearly invisible dot

### Controls and operator UX

The current public operator model now includes:

- quick starts for the three main music use cases
- quick-start-first startup flow with manual input override kept secondary
- curated presets: `Hush`, `Room`, `Music`, `Surge`
- a narrower quick dock focused on first-response steering
- `Restore Recommended` now returns the active source path to its strongest current quick-start stance
- the runtime tuning layer now preserves extra high-end headroom instead of flattening the strongest show combinations into the same ceiling
- deeper `Live Shaping`, `Look Shaping`, `Advanced Look Tuning`, `Input & Detection`, and `System` controls in the full menu
- input device selection
- input trim and band bias controls kept behind an explicit `Input Repair` path instead of front-loading them into the normal operator flow

### Tuning infrastructure

The repo now includes:

- replay capture and deterministic replay
- automatic evidence capture around drops, section changes, and releases
- wall-clock auto-capture file naming for saved evidence
- browser-side capture folder saving through Chrome's File System Access path
- a Windows live-loop command that starts the app and rolling capture watcher together
- developer-side capture analysis reports generated from saved evidence
- a rolling latest capture-analysis report watcher
- manual capture analysis now refreshes the same `capture-analysis_latest.md` path as the watcher
- capture analysis now separates fresh wall-clock evidence from legacy pre-fix captures so current tuning reads are less muddy
- capture analysis now reports source-mode spread, quick-start spread, average capture duration, and oversized capture warnings
- capture analysis now reports both launch-profile spread and active quick-start spread, so tuning can separate authored starting posture from later custom drift
- capture analysis now separates primary benchmark reads from secondary floor reads, so AFQR and quiet room-mic evidence do not collapse into one verdict
- benchmark manifests now carry explicit primary and secondary scenario entries with per-entry kinds
- auto capture windows are now capped more aggressively so one file is less likely to blur multiple musical moments together
- replay capture schema now writes `v2` evidence with boot/calibration summaries, source integrity, decision summaries, input-drift summaries, and optional proof-still metadata
- auto capture now supports a quiet room-music `floor` trigger so low-energy room-floor proof can be collected without pretending everything important is a drop
- diagnostics can now arm optional proof still bundles for auto-saved captures; the intended use is a few synchronized evidence stills, not screenshot streams
- benchmark manifest validation and promotion now have explicit CLI support through `npm run benchmark:validate` and `npm run benchmark:promote -- ...`
- the current auto-capture rules are intentionally short and strict; captures over roughly `15s` or with repeated retriggers are treated as weaker evidence
- visual telemetry is captured alongside audio/conductor truth, including glow budgets, active act, palette state, hue spread, and temporal motion windows
- visual telemetry now also serializes asset-layer activity and quality-transition summaries so the analyzer can judge utilization and renderer stability instead of only correctness
- aggregate capture reports now surface explicit review-gate guidance for `truth`, `governance`, `coverage`, and `taste`, so serious passes can end in a real verdict instead of only a narrative read
- capture metadata carries quality flags such as `manualCustom`, `safeTierActive`, `highAmbientGlow`, `lowPaletteVariation`, `undercommittedDrop`, `weakPhraseRelease`, and `multiEventWindow`
- auto captures preserve authored quick-start provenance correctly in the live path, so new evidence no longer falls back to `manual/none` when it really came from a quick start
- the analyzer recalculates quality flags from the capture contents instead of trusting stale serialized flags from older files
- replay capture serialization and the analyzer now normalize wrapped pre-roll chronology around the active trigger, so timestamp resets do not collapse duration or contaminate post-trigger evidence with stale frames
- the default active capture lifecycle is `captures/inbox` -> `captures/canonical` / `captures/archive`
- the analyzer and watcher use `captures/inbox` by default and ignore archived history unless explicitly targeted
- the latest report path stays truthful even when the inbox is empty by writing an explicit placeholder status instead of leaving stale evidence behind
- folder auto-save keeps gathering evidence beyond the old 12-capture in-app ceiling; only the recent replay-ready window is trimmed in memory

## Current Constraints Still Holding Back The Vision

- The flagship scene is still too monolithic for unconstrained parallel visual work.
- The first structural extraction pass has started by moving asset-layer telemetry production into a dedicated telemetry rig, but hero/chamber/event ownership still needs deeper extraction before aggressive parallel visual work is safe.
- Framing governance is now installed, and the first AFQR aftermath-lock correction wave has landed, but the correction is not benchmark-proven yet on a fresh post-fix rerun.
- Chamber/world authority is measurable now and is finally wired into the live chamber/light floor, but it is still not proven strongly enough in fresh captures.
- Screen-space consequence vocabulary is still underdeveloped relative to the target.
- The slow ambient captures now make the samey lock obvious: motion, palette handoff, and screen-space consequence all need more authored spread.
- Tempo/BPM is still underused as downstream stage-cadence truth.
- The hero still carries too much compositional responsibility in the strongest cue families.
- AFQR is no longer rupture-locked, aftermath-locked, portal-iris-locked, or vector-handoff-locked in the latest proof runs; the remaining high-confidence bottleneck is act/palette monopoly, with `matrix-storm` and `tron-blue` still sticking too long across strong PC-audio batches.
- Wildfire contrast proof showed that framing/family governance improved materially, but also exposed a real wrapped-pre-roll evidence defect; that chronology bug is now fixed for future captures.
- The quiet room-mic floor benchmark is no longer authored as a pure tiny-dot failure in code, but it still needs fresh proof to confirm that the live floor is bright, readable, and mobile enough.

## What Is Still Not Done

The following work is still genuinely unfinished.

### 1. Canonical capture pack is not recorded yet

The replay system exists, but the baseline capture set is still missing.

That means the repo still does not yet contain canonical saved sessions for:

- silence
- room tone
- HVAC
- speech
- taps
- clinks
- low music
- medium music

The capture lifecycle is ready for that pack now:

- active new evidence goes into [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- curated retained sessions should be moved into [captures/canonical](C:/dev/GitHub/visulive/captures/canonical)
- prior learned batches are archived under [captures/archive](C:/dev/GitHub/visulive/captures/archive)

### 2. First evidence-based retuning cycle is not complete

We have completed the first AFQR correction pass in conductor/show-direction, installed the first framing-governance layer, landed the first aftermath-lock correction pass in audio, show-direction, framing, and analyzer reporting, and now wired chamber envelopes and stronger internal range mapping into the live chamber/light floor. But the cycle is not complete until fresh AFQR and quiet room-mic floor batches are recorded and reviewed separately against those new live floors.

That means the next strong tuning decisions still need:

- fresh post-retune session captures
- generated analysis reports from those captures
- explicit pass/fail observations
- consistency checks across similar musical moments
- one or more follow-up retuning passes against those captures

The active evidence system is now stricter than the old loop:

- every serious pass should produce an analyzer report
- proof still bundles are optional but preferred over ad hoc screenshot streams
- benchmark pointers must validate before a pass is accepted
- the analyzer now treats coverage debt and monopolies as product-facing review findings, not just diagnostics

### 3. Real-world operator validation is still pending

The app is ready for testing, but the repo does not yet contain the actual first operator evidence pass on the target setup.

### 4. Dependency chunk size is still large

This is not blocking local use, but it is still present:

- `three-vendor` remains above the warning threshold during build

That is a dependency-size issue, not a repo-structure issue.

### 5. Heavy parallel visual work is still structurally unsafe

The specialist-agent model is documented, but the code still has one major collision hotspot:

- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

That file still contains:

- hero render
- chamber and lighting
- motion and choreography

So future specialist visual work should still be:

- sequenced
- or split by explicit method/zone ownership

until the scene is extracted into separate hero, chamber, and motion systems.

### 6. Governance metrics are wired, but proof still depends on fresh captures

The repo can now report:

- hero coverage and off-center penalties
- composition safety and fallback activity
- chamber presence and frame hierarchy
- ring-belt persistence and wirefield density
- declared-vs-delivered world dominance
- longest contiguous runs for state, intent, cue family, shot class, transition class, and tempo cadence mode
- active benchmark labeling through [captures/benchmark-manifest.json](C:/dev/GitHub/visulive/captures/benchmark-manifest.json)

That is enough to judge the next rerun honestly.

It is not enough to claim success without new capture proof.

## Known Non-Blocking Issues

- Build still warns about the large `three-vendor` chunk.
- Fresh captures are strong enough to guide tuning, but they still show repeated "surge with only moderate confidence" warnings, which means event spending is ahead of conductor certainty in too many moments.
- The renderer is still usually operating in `webgpu / safe`, so `safe` is now treated as a real target look and not just a degraded fallback.
- Quick starts and presets are now much clearer, but still need real operator pressure to prove the final wording and defaults.
- The system is still capable of control overlap if pushed carelessly; `Intensity`, `Show Scale`, and `World Activity` must continue to be validated for distinctness.
- The new deterministic event-spend layer still needs real musical proof that similar drops/builds now land consistently enough to trust.

## What Should Happen Next

This is the actual execution order.

### Step 1

Execute the docs-led next-level wave against the current evidence pack.

That means:

- evidence baseline
- show-direction and color authoring
- motion / locomotion / camera
- compositor / safe-tier consequence
- evidence rerun
- canon update

Judge:

- motion-axis spread
- palette handoff clarity
- screen-space consequence
- whether the slow-track samey lock actually loosens

### Step 2

Run a fresh AFQR benchmark recapture against the governance layer, aftermath-lock correction, and the new chamber/shot-diversity pass.

Judge:

- shot-class diversity
- composition safety rate
- hero coverage peaks
- hero travel and off-center occupancy
- chamber/world dominance delivery
- whether laser-bloom and pressure still monopolize the run
- whether ring-belt and wirefield persistence still flatten the image classes
- whether the hero still spends too much time near center even when the cue wants travel

### Step 3

If AFQR clears the governance gates, begin the next chamber/world authority wave.

That means:

- stronger chamber-dominant sections
- stronger world-takeover delivery
- less persistent ring-belt staging
- less hero-over-responsibility during rupture
- less reliance on tiny central hero holds as the default readable event carrier

The latest live pass already started this wave.
The next rerun should decide whether it actually worked.

### Step 4

After governance is benchmark-proven, move into tempo-cadence expansion and broader internal scene/image families.

Recommended path:

- run `npm run dev:live-loop`
- choose the repo [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) folder once in diagnostics
- enable `Auto Capture`
- enable `Auto Save To Folder`

### Step 5

Write short review notes for what passed, what failed, and what still felt wrong.

### Step 6

Run `npm run analyze:captures` and review the generated capture-analysis report.

### Step 7

Do the next retuning pass against those saved captures and reports, not against memory alone.

### Step 8

Only after the above, decide whether the next major move is:

- further director retuning
- deeper modulation/LFO architecture
- better post stack
- direct capture UX polish
- or another visual-system leap

## What Should Not Happen Next

Do not:

- add more scene families yet
- add a large new set of controls
- treat the current build as aesthetically finished
- keep making big changes without captures and notes
- let thread memory become the main project record again

## Current Readiness

If I were handing this to myself cold, I would call it:

- ready for serious operator testing
- ready for capture-driven tuning
- ready for automated evidence capture plus report-driven retuning
- not yet ready to call production-finished
- not yet ready for heavy parallel visual specialization

## Current Definition Of Success

The project is properly on track if the next pass produces:

- a real capture pack
- grounded operator notes
- a smaller, more precise retuning target list
- no repo drift between code, docs, and actual state
- a clearer path toward whole-frame stage authority
- a broader show-language system that is no longer bottlenecked by aftermath monotony or hero immobility
