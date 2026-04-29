# VisuLive Project Status

Date: 2026-04-28
Status: Active implementation snapshot

This file answers five practical questions quickly:

- what is shipped now
- what is newly installed on this branch
- what is canonized now even if code is still catching up
- what is still unproven
- what should happen next

If this file and the code disagree, the code wins.

## Verification Status

Latest local verification on `codex/full-version-foundation` after proof-run reliability hardening and the full `Primary benchmark` proof pass:

- `npm run anthology:validate` passes
- `npm run check` passes
- `npm run test` passes
- `npm run build` passes
- `npm run proof:audit` passes
- `npm run benchmark:validate` passes for manifest structure and historical baseline preservation
- `npm run benchmark:validate -- --require-current` intentionally fails until a current-canonical benchmark exists
- `npm run evidence:index` passes
- `npm run evidence:query -- --runs --limit 5` passes
- `npm run proof-pack -- --limit 3 --strict` intentionally fails because strict release proof still lacks operator-trust and full scenario coverage, and current primary proof still fails overbright/ring taste gates
- `npm run release:verify` is now intentionally strict and must fail until a current-canonical benchmark plus fresh proof-pack gates exist
- `npm run proof:preflight` must pass after the current proof-capture fix is committed and before the next serious run

Current standing warning:

- the build still emits a large `three-vendor` chunk warning
- the invalid April 28 run is now archived as debugging evidence only: it had dirty build identity, no selected proof scenario, no-touch failure, and run-journal persistence failure before the retry/snapshot hardening pass
- the later April 28 diagnostic run `run_20260428_165811_8gs5ht` showed strong chamber/world authority but invalid proof metadata: primary-benchmark manifest with room-floor route invalidation, null sample scenario, null clip declared scenario, and false `advanced:steer` contamination; it must remain diagnostic until the Mission Control pass is rerun cleanly
- Linear is active in the `visulive` workspace through the direct `mcp__linear__` connector; the stale `mcp__codex_apps__linear_mcp_server` namespace still points at the older workspace and should not be used for VisuLive writes

## Start-Right Audit Snapshot

The dirty branch is not random drift.
It is one coherent rewrite wave across product shell, runtime scaffolding, proof tooling,
and canon.

But it is still transitional in four important ways:

- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) now sequences frame preparation, `WorldSystem`, `ChamberSystem`, the owned `HeroSystem` pass, explicit authority resolution, and stage-runtime orchestration; the scene still assembles compatibility context, but chamber/world authority math no longer lives there
- `src/scene/systems/**` and `src/scene/governors/**` are partly namespace shims over `src/scene/modules/**` and `src/scene/rigs/**`, not a finished ownership split
- the new shell is directionally correct, but [ShowLaunchSurface.tsx](C:/dev/GitHub/visulive/src/ui/ShowLaunchSurface.tsx), [BackstagePanel.tsx](C:/dev/GitHub/visulive/src/ui/BackstagePanel.tsx), and [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx) still carry overlap and transition debt
- Proof Mission Control has produced valid current-proof-eligible primary benchmark run packages, but operator-trust proof is still missing and the latest full run exposed one evidence-platform gap: `operator-trust-clear` was journaled but not captured as a supporting still/clip because authority still work was in flight

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

- `Proof / Authority Validation`
- run it only after launching through `npm run dev:proof`, selecting a Proof Mission in `Backstage -> Capture`, arming `Proof Wave`, and confirming the launch surface says serious proof is ready
- end it only through `Finish Proof Run`, then use the receipt commands to refresh reports, index evidence, and review the run package
- `VIS-12` canary is done and `VIS-14` has a reviewed-candidate full primary benchmark: `run_20260428_194808_ot6j46`
- next, commit/restart the operator-trust-clear capture fix, then run `VIS-13` as the first clean `Operator trust` proof pass
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
- one unified `Advanced` drawer for style curation, steering, route repair, capture, replay, system, and diagnostics
- world / look / stance / pool curation moved behind advanced interaction instead of the public startup path
- route recommendations surfaced without silent route switching

### Show system

The product now reads as one public portal while the internal anthology grows.

Current public show count is unchanged, but the branch materially changes the internal posture:

- untouched runs default to full-spectrum world and look pools instead of a narrowed starter set
- runtime resolution now separates autonomous truth, advanced curation, and advanced steering
- anthology director intent is now explicit in runtime contracts and capture metadata
- current anthology intent names world family, mutation verb, hero species intent, consequence mode, aftermath state, lighting rig, camera phrase, motif, and memory state

The internal structure is also materially scaffolded even though the public product stays simple:

- stage-frame, pressure-wave, lighting, particle, motion, macro-event, and director-state logic now have named module or rig homes
- the public runtime vocabulary and folder layout now point toward orchestration-first ownership
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) still assembles cross-system context directly, but chamber/world authority judgment now lives in [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) instead of scene-local math
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
- the target runtime structure now includes post, compositor, memory, and content ownership, but those systems are not fully extracted yet
- the current runtime facade and namespaced system folders are still more structural promise than finished ownership
- the mastery review system is installed, but its first golden review set is still provisional because fresh canonical captures have not yet replaced the older report-derived stills
- `stable` is the only active public release lane today; a separate frontier host is future staging infrastructure and is not yet provisioned in production
- the legacy V1 preservation system is installed and live, but historical proof-pack and screenshot recovery for the original April 2026 release is still incomplete
- build identity exists in the app and strict proof tooling; fresh proof still needs a clean committed build launched through `npm run dev:proof`

## Installed But Still Unproven

These changes are real, but not yet proven against a fresh post-change capture cycle:

- whether untouched full-spectrum runs materially improve repertoire instead of just adding more named metadata
- whether the new authority-driven chamber/world takeover reads more clearly across the room
- whether quiet room-mic music floor remains vivid, readable, and mobile
- whether the anthology intent layer maps cleanly onto future analyzer coverage
- whether the new architecture pass preserves live feel while the remaining flagship hotspots are extracted
- whether the simplified shell feels truly simple instead of a re-skinned control console

## Current Structural Constraints

The biggest remaining constraints are still:

- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) is still too large
- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) is now a real frame orchestrator, but it is not the final runtime owner until later post/compositor/memory extraction lands
- `src/scene/systems/**` and `src/scene/governors/**` still mask the real implementation hotspots in `modules/**` and `rigs/**`
- the remaining flagship hotspot is now proof on the new authority split plus later post/compositor ownership and hero/world capability proof
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx) and [director.ts](C:/dev/GitHub/visulive/src/types/director.ts) are still temporary integration hubs with too much responsibility
- the show/audio routing stack is still flatter than the target regime hierarchy
- proof-pack output still reflects an older capture library that predates the full anthology metadata set
- benchmark truth is stricter now, but the full graduation workflow is not complete yet
- legacy [ActivationOverlay.tsx](C:/dev/GitHub/visulive/src/ui/ActivationOverlay.tsx) and [SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx) still remain in the repo as shell debt even though they are no longer the active product path

## Next Execution Order

The next highest-leverage sequence is:

1. make the baseline honest: keep docs, agent guidance, shell language, and proof expectations aligned with actual code ownership
2. run live start/stop sanity and a fresh no-touch `PC Audio` benchmark batch on the new authority-driven chamber/world split
3. use analyzer and proof-pack output to decide whether authority plus lighting/particle composition needs another pass or is ready to hold
4. formalize the stronger audio-to-regime-to-cue hierarchy and stop resolving similar situations into one house answer
5. land the first real anthology capability wave: alternate hero species, world mutation verbs, and owned consequence / aftermath behavior
6. extract `PostSystem`, then compositor/memory/content, once the authority proof wave is stable
7. record fresh direct-audio, room-floor, combo, sparse/silence, and operator-trust proof packs on the new backbone
8. only provision a separate frontier host and site later, once the rewrite is ready for real staging use and the extra environment is worth the complexity

## Not Ready Yet

Do not treat the following as complete:

- a second public show
- a public anthology browser
- more public controls
- frontier repertoire families piled on top of the monolith
- automatic production deploy policy changes
- shared-host `stable` and `frontier` behavior
