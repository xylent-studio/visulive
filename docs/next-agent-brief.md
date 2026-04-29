# VisuLive Next Agent Brief

Date: 2026-04-28  
Status: Active cold-start handoff

Use this if you are the next agent starting development work after the V1 preservation pass.

Read first:

1. [README.md](C:/dev/GitHub/visulive/README.md)
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
4. [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
5. [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
6. [AGENTS.md](C:/dev/GitHub/visulive/AGENTS.md)

## Current Branch Truth

- active rewrite branch: `codex/full-version-foundation`
- frozen preservation branch: `release/v1`
- do not treat `release/v1` or [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio) as active development targets unless the task is explicitly about legacy preservation or critical legacy repair

## What Just Finished

- `v1.0.0` preservation is live and published
- [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio) is live over HTTPS
- the preserved V1 GitHub release is published at [https://github.com/xylent-studio/visulive/releases/tag/v1.0.0](https://github.com/xylent-studio/visulive/releases/tag/v1.0.0)
- Cloudflare/Netlify helper scripts are installed for future domain and release work
- Linear is active through the direct `mcp__linear__` connector; use that connector for VisuLive and do not use the stale `mcp__codex_apps__linear_mcp_server` namespace, which still reads the older `learning-capture-pipeline` workspace in this session
- Linear project is created: [Proof Backbone & Clean Workspace](https://linear.app/visulive/project/proof-backbone-and-clean-workspace-c336ef31d99c), with issues `VIS-5` through `VIS-16`
- Proof-run persistence now snapshots run journals/manifests before async writes, retries transient File System Access write-state failures, and avoids recursive `run-journal-save-failed` invalidation loops
- Proof Mission Control now makes `Proof Wave` a setup transaction: the operator chooses a mission, the app forces route/source, auto capture, auto-save, proof stills, run journal, and locked mission metadata before `Start Show`
- serious proof now starts the run journal only after audio startup succeeds, suppresses accidental live proof controls without contaminating no-touch proof, and records mission snapshots into journal samples, clips, stills, and manifests
- `Finish Proof Run` is now the canonical end path: it stops audio, closes pending auto clips, writes finish/finalized markers, derives final mission eligibility, checks artifact integrity, disarms Proof Wave, and shows review commands
- the public launch surface now shows serious-proof ready/blocked state when `Proof Wave` is armed, so missing mission/build/folder/replay readiness is visible before `Start Show`
- the live HUD now shows proof mission, elapsed/target time, no-touch state, clip/still counts, last persistence state, and a `Finish Proof Run` action
- invalid April 28 runs are debugging evidence only; active `captures/inbox/runs` should be empty before the next proof pass
- `Primary benchmark` canary `run_20260428_192855_gnmlg1` and full run `run_20260428_194808_ot6j46` are reviewed-candidate proof packages, not current-canonical release proof
- the full primary run confirms strong chamber/world authority and no hero monopoly, but strict proof is blocked by overbright/ring taste failures and one missed `operator-trust-clear` evidence opportunity
- the Mythic Signature Moment Engine is now a fuller capability slice: [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts) selects rare moments with style routing and candidate precharge, [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts) owns style-matrix consequence rendering and telemetry, [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts) owns the bounded screen-space/post-profile slice, and [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) explicitly sequences `resolveSignatureMoment`, `updatePostSystem`, and `updateCompositorSystem`
- the first four signature moments are `collapse-scar`, `cathedral-open`, `ghost-residue`, and `silence-constellation`; each now has contrast-mythic, maximal-neon, and ambient-premium postures, but they are unproven until Moment Lab preview plus fresh capture review

This means the next agent should return to proof validation and signature-moment tuning, not release cleanup or another capability expansion.

## Immediate Next Development Target

The next serious wave is:

- `Signature Moment Proof / Tuning`

The highest-leverage move is:

- keep [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) as the real orchestrator now that it explicitly sequences `resolveAuthorityFrame()`
- preserve the new split where [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts) and [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts) expose system-local telemetry, [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) owns cross-system authority judgment, and [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts) plus [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts) consume typed authority
- prove the authority split plus the first 4x3 signature moment matrix with Moment Lab preview, live sanity, and no-touch evidence before starting another major extraction or new visual family

## First Task Sequence

1. review the new signature-moment path:
   - [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts)
   - [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts)
   - [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts)
   - [CompositorSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/compositor/CompositorSystem.ts)
   - [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts)
   - [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts)
   - [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts)
2. run the live sanity pass:
   - use `Backstage -> Capture -> Moment Lab` on localhost/dev proof builds to preview all 4 moments across contrast/neon/ambient styles and save exploratory receipts
   - confirm start/stop, chamber presence, world takeover, signature moments, compositor masks, aftermath clearance, disposal, and authority-driven lighting still read correctly
3. run the proof wave:
   - launch with `npm run dev:proof`
   - select the mission under `Backstage -> Capture -> Proof Mission`
   - use a short `Primary benchmark` canary first for the new signature-moment build, then a full `Primary benchmark` if the canary is valid
   - start only when the launch surface reports serious proof is ready
   - use `Finish Proof Run`; do not close the tab or rely on stopping audio informally
   - analyzer review
   - proof-pack review
   - require the analyzer to report signature moment coverage, style spread, overbright/ring impact, perceptual washout/colorfulness, aftermath clearance, and distinctness before tuning from the run
   - do not manually change scenario tags in diagnostics; the mission snapshot is the source of truth
   - prefer `npm run proof:current` for the serial benchmark/analyzer/proof-pack refresh
4. if proof shows generic treatment, weak distinction, overbright spend, ring overdraw, weak world/post leadership, or poor quiet beauty:
   - tune [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts), [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts), authority-fed lighting/particles, or stage cue policy without moving ownership back into the scene
5. if signature proof holds:
   - run `Operator trust`
   - then deepen the audio-to-regime-to-cue hierarchy or move to compositor/memory based on evidence
6. keep [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) responsible for orchestration/context assembly instead of scene-local sequencing
7. update:
   - [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
   - [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md) if family maturity or blockers changed
8. write a checkpoint with `Write-AgentCheckpoint.ps1`

## Do Not Do Yet

- do not add a second public show
- do not add a public world/look browser on the front door
- do not add major new anthology families into legacy monolithic ownership
- do not use the April 28 invalid run as current proof; it is debugging evidence only
- do not treat `systems/**` or `governors/**` folder names as proof that extraction is done
- do not spend time on legacy V1 work unless explicitly asked
- do not promote a run to `current-canonical` until it has a review note, zero invalidations, no missed capture opportunities, validated scenario assessment, screenshot/still refs, and relevant strict gates passing
- do not add a fifth signature moment before the first four and their three postures are previewed, proof-tuned, and distinct

## Success Criteria

The pass is successful only if at least one of these becomes more true in code, not just in docs:

- the signature moments survive live start/stop and no-touch capture review
- collapse scar, cathedral open, ghost residue, and silence constellation read as distinct image classes across contrast-mythic, maximal-neon, and ambient-premium variants
- at least one proof moment is world/post-led with hero visibly demoted
- aftermath clears instead of becoming permanent treatment

## Verification Expectation

Run at minimum:

- `npm run test`
- `npm run build`
- `npm run check`
- `npm run benchmark:validate`
- `npm run analyze:captures`
- `npm run proof-pack -- --limit 5`

Or use:

- `npm run proof:current`

If the pass touches release/evidence plumbing, also run:

- `npm run proof:audit`
- `npm run benchmark:validate -- --require-current` and expect failure until a valid current-canonical benchmark is promoted
- `npm run proof-pack -- --limit 1 --strict` and expect failure until a valid current-proof-eligible run exists
- `npm run prod:smoke:legacy`
- any task-specific proof or capture command needed by the pass

## If You Need One Sentence

Start from the now-owned signature moment capability slice: keep [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) as the orchestrator, preserve `SignatureMomentGovernor -> World/Chamber/Hero -> AuthorityGovernor -> Stage -> PostSystem -> CompositorSystem` boundaries, and prove the four 3-style moments before adding more spectacle.
