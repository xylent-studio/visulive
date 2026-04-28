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
- serious proof now suppresses the `M` Advanced shortcut during live no-touch missions and records mission snapshots into journal samples, clips, stills, and manifests
- the public launch surface now shows serious-proof ready/blocked state when `Proof Wave` is armed, so missing mission/build/folder/replay readiness is visible before `Start Show`
- invalid April 28 runs are debugging evidence only and should be archived before the next proof pass

This means the next agent should return to proof validation work, not release cleanup or capability expansion.

## Immediate Next Development Target

The next serious wave is:

- `Proof / Authority Validation`

The highest-leverage move is:

- keep [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) as the real orchestrator now that it explicitly sequences `resolveAuthorityFrame()`
- preserve the new split where [WorldSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts) and [ChamberSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts) expose system-local telemetry, [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts) owns cross-system authority judgment, and [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts) plus [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts) consume typed authority
- prove that split with live and no-touch evidence before starting another major extraction

## First Task Sequence

1. review the new authority split:
   - [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts)
   - [AuthorityGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts)
   - [LightingSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/LightingSystem.ts)
   - [ParticleSystem.ts](C:/dev/GitHub/visulive/src/scene/modules/ParticleSystem.ts)
2. run the live sanity pass:
   - confirm start/stop, chamber presence, world takeover, disposal, and authority-driven lighting still read correctly
3. run the proof wave:
   - launch with `npm run dev:proof`
   - select the mission under `Backstage -> Capture -> Proof Mission`
   - use `Primary benchmark` for the first canary and real primary proof
   - start only when the launch surface reports serious proof is ready
   - first run `Primary benchmark` as a 60-90 second canary to prove folder write, journal, clips, stills, no-touch tracking, and zero invalidations
   - fresh no-touch `PC Audio` benchmark batch
   - analyzer review
   - proof-pack review
   - require the proof-pack `authority split validation` and `primary authority proof` gates to pass before treating the authority split as stable
   - do not manually change scenario tags in diagnostics; the mission snapshot is the source of truth
   - prefer `npm run proof:current` for the serial benchmark/analyzer/proof-pack refresh
4. if proof still shows decorative chamber, weak world takeover, or overbright spend:
   - iterate authority plus lighting/particle composition without moving the ownership back into the scene
5. if proof holds:
   - deepen the audio-to-regime-to-cue hierarchy next
   - keep alternate hero species and world mutation work on the capability side, not as another scene-local extraction
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

## Success Criteria

The pass is successful only if at least one of these becomes more true in code, not just in docs:

- the new authority split survives live start/stop and no-touch capture review
- chamber/world-led frames read intentionally instead of decoratively
- the next agent does not need to reopen scene-local authority math to keep tuning

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

Start from the now-honest authority split: keep [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) as the orchestrator, preserve `WorldSystem -> ChamberSystem -> HeroSystem -> AuthorityGovernor -> Lighting/Particles` boundaries, and prove the new chamber/world authority behavior before starting the next major system extraction.
