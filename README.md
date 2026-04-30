# VisuLive

VisuLive is a big-screen generative showpiece for Chrome on Windows.

It is now framed as one simple public portal into a much larger internal anthology engine.

It can listen to the room, to audio playing on the computer, or to both at once, and turns that input into a cinematic visual performance system: dark, authored, reactive, and capable of spectacle without collapsing into noise soup.

Live site:
- [visulive.xylent.studio](https://visulive.xylent.studio)

Legacy public archive target:
- [visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)

Current hosting note:
- no separate `frontier` / staging host is active today; staging should only be provisioned later when the rewrite is ready for real separate-host testing

Current preservation truth:
- the preserved-edition system is now part of the repo
- `v1.0.0` is the first public preserved release
- the exact stable source commit was resolved to `6f45b8a`
- the `release/v1` branch and `v1.0.0` tag exist
- the legacy archive is live at [visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)

The current visual pass is no longer color-reserved by default. It now spends a much more aggressive neon show palette when the music drives it:
- laser cyan
- tron blue
- volt violet
- hot magenta
- acid lime
- matrix green
- solar orange
- toxic pink
- cyber yellow

The current render stack also now includes:
- a real WebGPU bloom pass
- hotter untone-mapped additive neon layers
- a multi-act internal show director
- emissive-first hero/chamber rendering instead of mostly warm/cool physical lighting
- more dominant hero/core palette routing
- a darker glow-budgeted baseline so the frame does not stay washed out between events
- lower always-on chamber/world light spend
- authored palette-state direction across sections
- a less conservative quality governor so `safe` reads like an intentional live target instead of a broken fallback

The current evidence loop also now preserves authored launch-route provenance correctly for new auto captures and recalculates quality flags during analysis, so the latest report reflects current rules instead of stale serialized judgments from older files.

It now supports three input paths:
- `Microphone`
- `PC Audio`
- `Combo`

Current canon for the next-version surface is:

- one public `VisuLive` portal into an anthology engine
- `Start Show` as the front door
- explicit route choice: `PC Audio`, `Microphone`, or `Combo`
- one optional `Advanced` drawer for style curation, steering, route repair, capture, replay, system, and diagnostics
- no world / look / stance browsing on the critical start path

Current canon for the deeper engine is:

- public simplicity is a product rule, not a creative limit
- internal anthology expansion is the main ambition rule
- untouched autonomous runs should stay in the full repertoire unless the user explicitly constrains them
- more capability is the target kind of “more,” not more public clutter

The current branch may still expose legacy quick-start and settings labels while the surface rewrite catches up. Treat those as compatibility UI, not the long-term product language.

## Start Here

If you are trying to understand the project, do not start from thread history.

Use:

- `.\scripts\rehydrate-agent.ps1`

- [Docs index](C:/dev/GitHub/visulive/docs/README.md)
- [Agent guide](C:/dev/GitHub/visulive/AGENTS.md)
- [Project status](C:/dev/GitHub/visulive/docs/project-status.md)
- [Current program](C:/dev/GitHub/visulive/docs/current-program.md)
- [Anthology mastery charter](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
- [Anthology capability map](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
- [Runtime extraction scoreboard](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
- [Graduation rubric](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
- [Mastery review system](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
- [Deployment operations](C:/dev/GitHub/visulive/docs/deployment-operations.md) for hosting, release, and domain work
- [Preserved editions](C:/dev/GitHub/visulive/docs/preserved-editions.md) for V1 preservation and release history
- [Show language](C:/dev/GitHub/visulive/docs/show-language.md)
- [Agent operating model](C:/dev/GitHub/visulive/docs/agent-operating-model.md)
- [Agent workstreams](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
- [Specialist brief template](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
- [Reference systems](C:/dev/GitHub/visulive/docs/reference-systems.md)
- [Vision ledger](C:/dev/GitHub/visulive/docs/vision-ledger.md)
- [Operator test guide](C:/dev/GitHub/visulive/docs/operator-test-guide.md)
- [Documentation operations](C:/dev/GitHub/visulive/docs/documentation-operations.md)

If you want the foundational taste brief, use:

- [Product charter](C:/dev/GitHub/visulive/docs/product-charter.md)

If you want the durable future-agent continuation layer, use:

- [Anthology mastery charter](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
- [Graduation rubric](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
- [Runtime extraction scoreboard](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
- [Mastery review system](C:/dev/GitHub/visulive/docs/mastery-review-system.md)

## Run

```bash
npm install
npm run dev
```

If you want the live tuning loop on Windows, use:

```bash
npm run dev:live-loop
```

That opens the capture watcher in a second PowerShell window and starts the app in the current one.

Open the local Vite URL in Chrome on Windows.

For a full local verification pass:

```bash
npm run check
```

If you only want to validate the continuation foundation layer:

```bash
npm run anthology:validate
```

## Verify

- Start with `Start Show` and let it run without intervention first
- Choose `PC Audio`, `Microphone`, or `Combo` on the start surface
- If the current branch still shows legacy launch labels, use the compatibility route helper that matches your source path:
  - `Music On This PC` for direct computer audio
  - `Music In The Room` for microphone-first room listening
  - `Big Show Hybrid` for combined input
- Grant the requested browser permissions
- If you use `PC Audio` or `Both`, Chrome will open a share picker. Choose a tab, window, or screen source and make sure audio sharing is enabled.
- For PC Audio proof, start music before `Start Show`; for room-mic testing, bring music in after calibration if that is the scenario
- Press `F` or `Enter Fullscreen` for true immersive fullscreen; after a short idle, all chrome hides and only the visualization remains on screen
- Keep the first pass no-touch. Judge whether the autonomous path is compelling before opening any steering surface.
- Use `Advanced` only if you want to curate style, bias the director, repair the route, capture evidence, or open diagnostics.
- If the current branch still shows older menu labels, `Manual Input Setup`, `Explore`, `Director Deck`, and the full settings menu should be treated as compatibility paths to the new `Advanced` drawer model.
- Use `Shift + D` in dev mode to open diagnostics, replay capture, and auto evidence capture
- In diagnostics, choose the repo's [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) folder once if you want the app to save evidence there automatically
- Turn on `Auto Save To Folder` if you want captures written directly into that folder while the music plays
- Run `npm run watch:captures` in another terminal if you want the rolling analysis report to stay current while new captures arrive
- Run `npm run analyze:captures` if you want a one-shot developer-facing tuning report from the recorded evidence; it now also refreshes [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)
- If you want the practical first-pass guide, use:
  - [operator-test-guide.md](C:/dev/GitHub/visulive/docs/operator-test-guide.md)
- Run the target-machine review pass from the review rubric:
  - [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)

## Improvement Loop

The project now has a real evidence-driven tuning loop.

Use it like this:

1. run `npm run dev:live-loop` on Windows, or run `npm run dev` and `npm run watch:captures` in separate terminals
2. open diagnostics with `Shift + D`
3. choose [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as the capture folder once
4. turn on `Auto Capture`
5. turn on `Auto Save To Folder`
6. optionally turn on `Proof Stills` in diagnostics if you want a small synchronized evidence bundle for each auto-saved capture
7. if this is a serious proof pass, set the diagnostics `Proof scenario tag` before you start the run so the current batch is counted honestly before any benchmark promotion
8. play music and let the app save evidence directly into [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
9. run `npm run proof:current` before treating the batch as current proof truth
10. review the rolling report at [captures/reports/capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)

Folder auto-save is now effectively unbounded for the session. The app only keeps a smaller recent replay window in memory so the UI stays sane while evidence keeps accumulating on disk.

The capture lifecycle is now:
- active auto-saved evidence in [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- curated retained evidence in [captures/canonical](C:/dev/GitHub/visulive/captures/canonical)
- learned historical material in [captures/archive](C:/dev/GitHub/visulive/captures/archive)

If the inbox is empty, `npm run analyze:captures` now refreshes [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md) with an explicit "no inbox captures yet" status instead of leaving a stale report behind.

Fresh auto captures should now save with real wall-clock names such as `auto_drop_2026-04-07_21-50-53.json`. If you still see new files saving as `1969-12-31...`, refresh the app before collecting more evidence.
8. if you want a fresh standalone report, run:

```bash
npm run analyze:captures
```

9. use that evidence to drive the next retuning pass instead of tuning by memory alone

The current serious-pass cadence is:

1. one no-touch `Auto Show` direct-audio benchmark batch
2. one no-touch quiet room-floor benchmark batch
3. one broader show-coverage batch
4. one sparse / silence batch
5. one steering batch after the no-touch behavior is judged on its own merit

Each serious batch should end with:

- a validated benchmark manifest
- an analyzer report
- an optional proof-still bundle
- one short review note
- an explicit verdict against `truth`, `hierarchy`, `coverage`, `taste`, and `operator trust` gates

The analyzer now distinguishes:
- the launch profile the session started from
- the active launch-route state at capture time

That makes it easier to tell whether a weak capture came from the show engine itself or from drifting away from the authored start stance during testing.

The repo is also now prepared for specialist-agent work. If future work is split across subagents, use:
- [AGENTS.md](C:/dev/GitHub/visulive/AGENTS.md) for repo-wide rules
- [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md) for integrator and collision rules
- [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md) for lane ownership and execution order
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md) for the standard bounded brief format

Current evidence policy:
- treat [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as a disposable fresh batch, not a permanent pile
- after a retune pass, archive the learned inbox batch before collecting the next canonical run
- no active benchmark may point at missing files; use `npm run benchmark:promote -- <capture-path> ...` when benchmark truth changes
- benchmark promotion now defaults to `current-candidate`; pass `--status current-canonical` only after the batch proves itself
- no reviewed batch should remain in the inbox after the pass; promote it deliberately or archive it deliberately
- the current auto-capture tuning is intentionally shorter and stricter, so anything over roughly `15s` or with repeated retriggers is now considered weaker tuning evidence

## Surface Canon

The next-version product surface is:

- `Start Show`: the primary CTA and default operator path
- `PC Audio`, `Microphone`, and `Combo`: the only required startup choices
- `Advanced`: the only optional drawer, containing:
  - style curation
  - semantic steering
  - route repair, device selection, capture, replay, system, diagnostics

Public controls are expected to bias the director over time, not pin the show to static output values.

The long-term product identity is:

- one simple public portal
- one deep anthology engine behind it

Canonical public content language is:

- `Show Worlds`: scene grammar and authority families
- `Looks`: palette / material / post identities
- `Director Stances`: reusable advanced curation profiles, not required startup choices

The product goal is that the show remains compelling without touching any of them, and that untouched `Start Show` runs stay in the full autonomous repertoire by default.

## Compatibility Launch Mapping

Until the surface rewrite lands in code, current builds may still expose these route helpers:

### `Music On This PC`

Compatibility meaning:
- direct computer-audio route helper
- best current branch path when this machine is already playing the music

### `Music In The Room`

Compatibility meaning:
- microphone-first room route helper
- best current branch path when speakers are in the space

### `Big Show Hybrid`

Compatibility meaning:
- combined direct-audio-plus-room route helper
- best current branch path when you want both musical body and room life

If the show drifts into a weak custom state, use `Restore Recommended`. Long term, this belongs with autonomous restart / stance recovery, not as a quick-start reset concept.

### `Use Microphone`

Best when:
- you want the piece to react to the real room
- music is playing from speakers in the space
- speech, taps, clinks, and ambient life should matter

### `Use PC Audio`

Best when:
- the music source is this computer
- you want cleaner, stronger, more direct musical drive

Important:
- Chrome uses screen/tab sharing for this
- choose a source with audio enabled in the share picker

### `Use Both`

Best when:
- you want the music from the computer to drive the main body
- but you still want the room and local transients to color the experience

## Legacy Preset Note

Current builds may still expose older preset labels such as `Hush`, `Room`, `Music`, and `Surge`.

Treat those as compatibility labels while the product moves toward:

- world selection
- look selection
- director stance selection
- autonomous migration between those vocabularies with the music

## Current Doc Structure

Active canonical docs:

- [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
- [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
- [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
- [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
- [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
- [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
- [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
- [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)
- [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
- [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md)
- [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
- [reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
- [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
- [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
- [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
- [operator-test-guide.md](C:/dev/GitHub/visulive/docs/operator-test-guide.md)
- [documentation-operations.md](C:/dev/GitHub/visulive/docs/documentation-operations.md)

Foundational north star:

- [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)

Historical baselines:

- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)
