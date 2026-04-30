# VisuLive Project Status

Date: 2026-04-30
Status: Active implementation snapshot

For the newest commit/run/blocker truth, read [current-truth.md](C:/dev/GitHub/visulive/docs/current-truth.md) before this longer status file. This document retains historical proof context by design.

This file answers five practical questions quickly:

- what is shipped now
- what is newly installed on this branch
- what is canonized now even if code is still catching up
- what is still unproven
- what should happen next

If this file and the code disagree, the code wins.

## Verification Status

Latest local verification on `codex/full-version-foundation` after the `run_20260429_181010_cr4ls7` proof review, capture queue hardening, quiet-priority capture fix, ambient signature routing, and playable-scene routing correction:

- `npm run test` passes
- `npm run build` passes
- `npm run anthology:validate` passes in the prior clean verification set and remains part of `npm run check`
- `npm run check` passes
- `npm run proof:audit` passes
- `npm run benchmark:validate` passes for manifest structure and historical baseline preservation
- `npm run proof-pack -- --limit 1` passes and now distinguishes legacy glow-spend from perceptual washout/colorfulness
- `npm run benchmark:validate -- --require-current` intentionally fails until a current-canonical benchmark exists
- `npm run evidence:index` passes
- `npm run evidence:query -- --runs --limit 5` passes
- `npm run evidence:query -- --missed --limit 5` passes and surfaces missed marker kind, severity, expected evidence, and run provenance
- `npm run proof-pack -- --limit 1 --strict` intentionally fails because strict release proof still has missed-opportunity and scenario-coverage blockers
- `npm run release:verify` is now intentionally strict and must fail until a current-canonical benchmark plus fresh proof-pack gates exist
- `npm run proof:preflight` must pass after the current analyzer/capture fixes are committed and before the next serious run

Current standing warning:

- the build still emits a large `three-vendor` chunk warning
- the invalid April 28 run is now archived as debugging evidence only: it had dirty build identity, no selected proof scenario, no-touch failure, and run-journal persistence failure before the retry/snapshot hardening pass
- the later April 28 diagnostic run `run_20260428_165811_8gs5ht` showed strong chamber/world authority but invalid proof metadata: primary-benchmark manifest with room-floor route invalidation, null sample scenario, null clip declared scenario, and false `advanced:steer` contamination; it must remain diagnostic until the Mission Control pass is rerun cleanly
- Linear is active in the `visulive` workspace through the direct `mcp__linear__` connector; the stale `mcp__codex_apps__linear_mcp_server` namespace still points at the older workspace and should not be used for VisuLive writes
- archived primary signature run `run_20260429_004346_zsvdmx` is valid, no-touch, finalized, and artifact-integrity clean; it is development evidence, not current-canonical proof, because it still has one missed governance-risk opportunity and no benchmark promotion
- latest valid development baseline `run_20260429_123116_jzqbjo` is also diagnostic, not a greenlight: Proof Mission and natural signature/playable firing worked, but the run exposed the next blocker as semantic coherence rather than raw capability
- latest valid proof pass `run_20260429_181010_cr4ls7` is also diagnostic, not promotable: it stayed clean/no-touch/current-proof-valid, but refreshed review still has 4 real missed opportunities, no natural `machine-tunnel`, no natural `ambient-premium`, sticky collapse/portal scene churn, and high-confidence hero-form/scene-coherence recommendations
- regenerated current proof-pack output may report no signature moment evidence after inbox cleanup because the latest signature run was archived intentionally; use the archived run package for development diagnosis and collect a fresh canary after committing the current fixes

## Start-Right Audit Snapshot

The dirty branch is not random drift.
It is one coherent rewrite wave across product shell, runtime scaffolding, proof tooling,
and canon.

But it is still transitional in four important ways:

- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) now sequences frame preparation, stage preparation, signature-moment resolution, `WorldSystem`, `ChamberSystem`, the owned `HeroSystem` pass, explicit authority resolution, stage-runtime orchestration, `PostSystem`, `PlayableMotifSystem`, and bounded `CompositorSystem`; the scene still assembles compatibility context, but chamber/world authority math, first-wave signature moment eligibility, and playable scene posture no longer live there
- `src/scene/systems/**` and `src/scene/governors/**` are partly namespace shims over `src/scene/modules/**` and `src/scene/rigs/**`, not a finished ownership split
- the new shell is directionally correct, but [ShowLaunchSurface.tsx](C:/dev/GitHub/visulive/src/ui/ShowLaunchSurface.tsx), [BackstagePanel.tsx](C:/dev/GitHub/visulive/src/ui/BackstagePanel.tsx), and [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx) still carry overlap and transition debt
- Proof Mission Control has produced valid current-proof-eligible primary benchmark and operator-trust run packages, but strict release proof still needs clean scenario coverage, benchmark promotion, and no missed opportunities
- The latest proof-pack now exposes the evidence-platform gap more honestly: context-aware matching avoids false misses when a saved v3 clip actually spans a marker, while still reporting 18 missed marker clusters across the current reviewed set that need explicit trigger clips or stills rather than generic nearby evidence
- The Mythic Signature Moment Engine full-capability slice is now implemented but unproven: `SignatureMomentGovernor` selects rarer moments with decision traces, style routing, candidate state, and risk-based safe-neon preservation; `PostSystem` owns stronger dark-bite, neon-vault, ghost-echo, and quiet-field silhouettes; `PlayableMotifSystem` owns five authored scene postures; `CompositorSystem` owns bounded screen-space/post-profile response; chamber, lighting, and particles now preserve saturated local neon while decaying ring wallpaper after strikes; Moment Lab can preview the moment/style variants locally; and the analyzer can report signature moment coverage, style spread, playable scene coherence, compositor risk, perceptual colorfulness, washout, recomputed package integrity, and kind-aware missed opportunities from fresh captures
- The semantic motif and playable scene pass is now implemented but unproven by fresh capture: direction now derives `void-anchor`, `machine-grid`, `neon-portal`, `rupture-scar`, `ghost-residue`, `silence-constellation`, `acoustic-transient`, and `world-takeover` motif snapshots plus semantic episode id/age/transition reason, palette base hold reason, and ring posture; palette base identity now dwells separately from modulation; `HeroSystem` defaults to planned semantic form/role with longer dwell and exposes pending form; [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts) owns five authored scene postures plus scene driver/intent match; and analyzer/recommendation output can report unearned palette churn, hero-form switch rate, planned-active form match, hero/world hue divergence, ambiguous silhouette risk, scene churn, scene-motif mismatch, scene-intent mismatch, ring posture spread, and samey scene silhouettes
- The authored procedural scene ontology pass is now implemented but unproven by fresh capture: [visualAssetProfiles.ts](C:/dev/GitHub/visulive/src/scene/assets/visualAssetProfiles.ts) defines procedural-only profiles for the five playable scenes, [visualAssetPacks.ts](C:/dev/GitHub/visulive/src/scene/assets/visualAssetPacks.ts) defines the source-owned abstract mask/glyph/surface/geometry/particle/post-memory pack catalog with legality and fallback behavior, `PlayableMotifSystem` reports profile id, silhouette family, surface role, compositor mask, and particle job, `CompositorSystem` responds to portal/shutter/iris/scar/ghost mask families, run journals and analyzer summaries preserve those fields, and `moment:sheet` now includes quick scoring tags for `favorite`, `weak`, `reads-at-thumbnail`, `scene-label-mismatch`, `generic-ring-wallpaper`, and `premium-frame`
- The autonomous Director Console pass is now implemented but unproven by fresh capture: normal `Advanced` no longer exposes Style/Steer as user tuning knobs, the visible console is read-only and explains director intent, scene ontology, motif/palette/ring/hero state, signature moments, proof state, and internal repertoire coverage; captures and run journals serialize `directorConsoleSnapshot`; `moment:sheet` now writes package-local review sheets with package-relative still links so archived runs do not leave stale inbox paths
- [autonomous-director-backlog.md](C:/dev/GitHub/visulive/docs/autonomous-director-backlog.md) is the durable ledger for deferred visual ontology, hidden lab, Hero/World, compositor/memory, asset provenance, proof telemetry, and operator UX work

This means the branch is promising enough to continue from, but not honest enough to treat as a clean baseline unless future work keeps correcting those gaps.

## Preserved V1 Status

The preservation system for the first public VisuLive edition is now installed.

That includes:

- a preserved-editions ledger in [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)
- a tracked V1 preservation folder in [preserved-releases/v1.0.0](C:/dev/GitHub/visulive/preserved-releases/v1.0.0/README.md)
- a live artifact capture script at [capture-netlify-site-artifact.mjs](C:/dev/GitHub/visulive/scripts/capture-netlify-site-artifact.mjs)
- a packaging script at [prepare-preserved-release.mjs](C:/dev/GitHub/visulive/scripts/prepare-preserved-release.mjs)
- legacy smoke-check support via `npm run prod:smoke:legacy`

What is now resolved:

- the exact currently deployed stable source commit for `v1.0.0`: `6f45b8a`
- the annotated tag `v1.0.0`
- the maintenance branch `release/v1`
- the exact live artifact captured from production deploy `69e191a1e164309b55b6ff01`
- the dedicated legacy Netlify site deployed at [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)
- Netlify-managed TLS issued for the legacy hostname

What is still pending:

- historical proof-pack and screenshot recovery if the original April 2026 assets are later recovered

## Immediate Next Development Wave

The release and preservation baseline is now good enough to stop doing hosting cleanup and return to
development.

The next wave is:

- `Coherence Proof / Tuning`
- run it only after launching through `npm run dev:proof`, selecting a Proof Mission in `Backstage -> Capture`, arming `Proof Wave`, and confirming the launch surface says serious proof is ready
- end it only through `Finish Proof Run`, then use the receipt commands to refresh reports, index evidence, and review the run package
- `VIS-12` canary is done and `VIS-14` has a reviewed-candidate full primary benchmark: `run_20260428_194808_ot6j46`
- next, commit/restart the latest capture/scene routing build, archive `run_20260429_181010_cr4ls7` as diagnostic if it is still in inbox, use local Moment Lab/contact sheets if visual sanity is needed, run a 90-120 second `Primary benchmark` canary against `Jon Hopkins - Emerald Rush` for continuity, then run a full primary benchmark if the canary improves planned-active hero form match, scene intent/motif/palette match, machine/ambient reach, missed opportunities, and ring posture behavior; refresh serious evidence with `npm run proof:refresh`; `Operator trust` remains the next proof lane after coherence has a clean primary run
- the next proof review must also check scene-profile match, silhouette-family spread, surface-role spread, compositor-mask spread, particle-field-job spread, and any `sceneProfileMismatch` or `decorativeParticleActivity` flags before starting the Hero/World Wave
- if coherence proof holds, the next feature wave is `Hero/World Wave`: hero-suppressed/world-as-hero states, stronger alternate hero roles, and first world mutation verbs through owned systems only
- do not mix acoustic/drums, operator trust, room floor, and primary benchmark in one run; choose one mission per run and let the app lock the route/source/scenario snapshot

Use [next-agent-brief.md](C:/dev/GitHub/visulive/docs/next-agent-brief.md) for the immediate cold-start
task framing.

## Canon Installed On This Branch

The repo now has explicit anthology-engine canon for:

- one public portal with `Start Show` and route chips
- one optional `Advanced` drawer
- an internal anthology-engine posture instead of one-scene-forever language
- a published mastery spine under [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md), [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md), [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md), [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md), and [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
- a published anthology capability map under [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
- a published target runtime structure under [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md)
- six promotion gates: `architecture`, `truth`, `hierarchy`, `coverage`, `taste`, and `operator trust`
- a rewrite phase order that keeps broader public expansion behind proof-backed backbone work
- a machine-readable anthology family declaration system in [anthology.ts](C:/dev/GitHub/visulive/src/scene/contracts/anthology.ts) and [anthologyCatalog.ts](C:/dev/GitHub/visulive/src/scene/direction/anthologyCatalog.ts)
- a validator at [validate-anthology-catalog.mjs](C:/dev/GitHub/visulive/scripts/validate-anthology-catalog.mjs) wired into `npm run check`

This is doc truth now.
Code and hosting are still catching up to parts of it.

## Shipped Now

### Input and operator path

The app currently ships with:

- microphone, PC audio, and combo input paths
- `Start Show` as the front door
- one required route choice: `PC Audio`, `Microphone`, or `Combo`
- one unified `Advanced` drawer for the read-only Director Console plus Backstage route repair, capture, replay, system truth, and diagnostics
- world / look / stance / pool curation and steering are internal autonomous repertoire, not normal-use product controls
- the Director Console explains current autonomous scene ontology, motif, palette chapter, ring posture, hero role/form, signature moment, proof state, and why the director is holding or changing the frame
- route recommendations surfaced without silent route switching

### Show system

The product now reads as one public portal while the internal anthology grows.

Current public show count is unchanged, but the branch materially changes the internal posture:

- untouched runs default to full-spectrum world and look pools instead of a narrowed starter set
- runtime resolution now separates autonomous truth, advanced curation, and advanced steering
- old advanced steering descriptors remain internal bias grammar for the autonomous director and hidden lab work; serious proof still resets remembered preferences at run start and serializes the reset into evidence
- anthology director intent is now explicit in runtime contracts and capture metadata
- current anthology intent names world family, mutation verb, hero species intent, consequence mode, aftermath state, lighting rig, camera phrase, motif, and memory state

The internal structure is also materially scaffolded even though the public product stays simple:

- stage-frame, pressure-wave, lighting, particle, motion, macro-event, director-state, signature-moment, and post-consequence logic now have named module, governor, system, or rig homes
- the public runtime vocabulary and folder layout now point toward orchestration-first ownership
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) still assembles cross-system context directly, but chamber/world authority judgment now lives in [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) instead of scene-local math
- first-wave rare moment eligibility now lives in [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), first-wave post consequence rendering now lives in [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), and the first authored playable scene layer now lives in [PlayableMotifSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/motif/PlayableMotifSystem.ts)
- `systems/**` and `governors/**` should currently be treated as API and namespace surfaces, not final proof that ownership is finished

### Tooling and release operations

This branch also installs:

- app-visible build identity in the `System` section and diagnostics
- `.nvmrc` for the repo Node version
- `npm run proof-pack`
- `npm run prod:smoke`
- `npm run release:verify`
- stricter benchmark manifest validation that rejects non-canonical benchmark paths
- preserved-edition packaging and release-history scaffolding

### Evidence and benchmark discipline

Benchmark truth is now stricter:

- benchmark paths must live under `captures/canonical` or `captures/archive`
- promotion tooling rejects inbox paths
- replay captures now serialize the autonomous shell state, curation state, steering state, and new anthology intent metadata
- proof-pack output now reports scenario coverage, no-touch autonomy, silence dignity, world-authority delivery, and operator-trust gates

## Canonized But Not Implemented Yet

The anthology program is ahead of code in these ways:

- the anthology runtime contracts now exist, but hero species, world mutation, compositor, and memory are still mostly intent-layer truth rather than fully delivered runtime behavior
- the target runtime structure now includes compositor, memory, and content ownership, but those systems are not fully extracted yet
- the current runtime facade and namespaced system folders are still more structural promise than finished ownership
- the mastery review system is installed, but its first golden review set is still provisional because fresh canonical captures have not yet replaced the older report-derived stills
- `stable` is the only active public release lane today; a separate frontier host is future staging infrastructure and is not yet provisioned in production
- the legacy V1 preservation system is installed and live, but historical proof-pack and screenshot recovery for the original April 2026 release is still incomplete
- build identity exists in the app and strict proof tooling; fresh proof still needs a clean committed build launched through `npm run dev:proof`

## Installed But Still Unproven

These changes are real, but not yet proven against a fresh post-change capture cycle:

- whether untouched full-spectrum runs materially improve repertoire instead of just adding more named metadata
- whether the new authority-driven chamber/world takeover reads more clearly across the room
- whether collapse scar, cathedral open, ghost residue, and silence constellation read as distinct, rare, premium, safe-tier image classes instead of generic treatment
- whether neon cathedral, machine tunnel, void pressure, ghost constellation, and collapse scar read as stable authored playable scenes instead of short-lived overlays
- whether quiet room-mic music floor remains vivid, readable, and mobile
- whether the anthology intent layer maps cleanly onto future analyzer coverage
- whether the new architecture pass preserves live feel while the remaining flagship hotspots are extracted
- whether the simplified shell feels truly simple instead of a re-skinned control console

## Current Structural Constraints

The biggest remaining constraints are still:

- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) is still too large
- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) is now a real frame orchestrator, but it is not the final runtime owner until later post/compositor/memory extraction lands
- `src/scene/systems/**` and `src/scene/governors/**` still mask the real implementation hotspots in `modules/**` and `rigs/**`
- the remaining flagship hotspot is now proof on the new authority split plus the new signature moments, then later compositor/memory ownership and hero/world capability proof
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx) and [director.ts](C:/dev/GitHub/visulive/src/types/director.ts) are still temporary integration hubs with too much responsibility
- the show/audio routing stack is still flatter than the target regime hierarchy
- proof-pack output still reflects an older capture library that predates the full anthology metadata set
- benchmark truth is stricter now, but the full graduation workflow is not complete yet
- legacy `ActivationOverlay`, `SettingsPanel`, quick-dock, and old top-chrome shell surfaces have been removed; `npm run legacy:audit` now guards the current `ShowLaunchSurface` + `ShowHud` + `BackstagePanel` + `DiagnosticsOverlay` surface contract

## Next Execution Order

The next highest-leverage sequence is:

1. make the baseline honest: keep docs, agent guidance, shell language, and proof expectations aligned with actual code ownership
2. run live start/stop sanity and a fresh no-touch `PC Audio` benchmark batch on the new authority-driven chamber/world split
3. use analyzer and proof-pack output to decide whether authority plus lighting/particle composition needs another pass or is ready to hold
4. proof-tune the Mythic Signature Moment Engine and Authored Playable Motif System until the four moments and five scenes are distinct, stable, rare, safe-tier viable, and not another overbright/ring-overdraw path
5. formalize the stronger audio-to-regime-to-cue hierarchy and stop resolving similar situations into one house answer
6. land the first real anthology capability wave: alternate hero species and world mutation verbs, only through owned systems
7. extract compositor/memory/content once the signature-moment proof wave is stable
8. record fresh direct-audio, room-floor, combo, sparse/silence, and operator-trust proof packs on the new backbone
9. only provision a separate frontier host and site later, once the rewrite is ready for real staging use and the extra environment is worth the complexity

## Not Ready Yet

Do not treat the following as complete:

- a second public show
- a public anthology browser
- more public controls
- frontier repertoire families piled on top of the monolith
- automatic production deploy policy changes
- shared-host `stable` and `frontier` behavior
