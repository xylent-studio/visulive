# VisuLive

VisuLive is a big-screen generative showpiece for Chrome on Windows.

It can listen to the room, to audio playing on the computer, or to both at once, and turns that input into a cinematic visual performance system: dark, authored, reactive, and capable of spectacle without collapsing into noise soup.

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

The current evidence loop also now preserves authored quick-start provenance correctly for new auto captures and recalculates quality flags during analysis, so the latest report reflects current rules instead of stale serialized judgments from older files.

It now supports three input paths:
- `Use Microphone`
- `Use PC Audio`
- `Use Both`

## Start Here

If you are trying to understand the project, do not start from thread history.

Use:

- [Docs index](C:/dev/GitHub/visulive/docs/README.md)
- [Agent guide](C:/dev/GitHub/visulive/AGENTS.md)
- [Project status](C:/dev/GitHub/visulive/docs/project-status.md)
- [Current program](C:/dev/GitHub/visulive/docs/current-program.md)
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

## Verify

- Choose `Music On This PC`, `Music In The Room`, or `Big Show Hybrid` first
- Only open `Manual Input Setup` if you specifically want to override the input path yourself
- Click the start button that matches the selected launch path: `Start PC Audio`, `Start Hybrid Show`, or `Start Room Listening`
- Grant the requested browser permissions
- If you use `PC Audio` or `Both`, Chrome will open a share picker. Choose a tab, window, or screen source and make sure audio sharing is enabled.
- Let the 2-3 second calibration finish, then bring music in if you are testing the room-mic path
- If the computer is playing the music, start with `Music On This PC`
- If speakers are in the room, start with `Music In The Room`
- If you want the biggest direct-audio-plus-room reaction, start with `Big Show Hybrid`
- Use the quick dock for `Wake`, `Intensity`, `Show Scale`, and `World Activity`
- Press `M` to open the full settings surface for `Live Shaping`, `Look Shaping`, `Advanced Look Tuning`, `Input & Detection`, and `System` controls; quick starts stay primary, while input repair and deeper look tuning stay secondary
- Press `F` to enter or exit true immersive fullscreen; when fullscreen is active and the menu is closed, only the visualization remains on screen
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
7. play music and let the app save evidence directly into [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
8. run `npm run benchmark:validate` before treating the batch as canonical truth
9. review the rolling report at [captures/reports/capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)

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

1. one AFQR-style primary benchmark batch
2. one quiet room-floor benchmark batch
3. one broader show-coverage batch

Each serious batch should end with:

- a validated benchmark manifest
- an analyzer report
- an optional proof-still bundle
- one short review note
- an explicit verdict against `truth`, `governance`, `coverage`, and `taste` gates

The analyzer now distinguishes:
- the launch profile the session started from
- the active quick-start state at capture time

That makes it easier to tell whether a weak capture came from the show engine itself or from drifting away from the authored quick-start stance during testing.

The repo is also now prepared for specialist-agent work. If future work is split across subagents, use:
- [AGENTS.md](C:/dev/GitHub/visulive/AGENTS.md) for repo-wide rules
- [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md) for integrator and collision rules
- [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md) for lane ownership and execution order
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md) for the standard bounded brief format

Current evidence policy:
- treat [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as a disposable fresh batch, not a permanent pile
- after a retune pass, archive the learned inbox batch before collecting the next canonical run
- no active benchmark may point at missing files; use `npm run benchmark:promote -- <capture-path> ...` when benchmark truth changes
- no reviewed batch should remain in the inbox after the pass; promote it deliberately or archive it deliberately
- the current auto-capture tuning is intentionally shorter and stricter, so anything over roughly `15s` or with repeated retriggers is now considered weaker tuning evidence

## Quick Starts

Use these when you want the obvious first button instead of building a source/preset combination manually:

### `Music On This PC`

Uses:
- `Use PC Audio`
- `Surge` preset

Best when:
- this computer is already playing the music
- you want the cleanest, strongest musical drive

### `Music In The Room`

Uses:
- `Use Microphone`
- `Music` preset

Best when:
- speakers are in the room
- you want the mic to hear the space as part of the show

### `Big Show Hybrid`

Uses:
- `Use Both`
- `Surge` preset

Best when:
- you want the biggest reaction path
- direct music should drive the body but room life should still matter

The quick starts are now the recommended operator-facing first choices for music.

If the show ever drifts into a weak custom state, use `Restore Recommended`. It now appears in the quick dock when you are off a quick start, and in the full menu as a deeper fallback. It resets back to the strongest current quick-start stance for the active source path instead of dropping you into a generic middle state.

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

## Preset Meaning

- `Hush`: silence-first, suspended, and gallery-like
- `Room`: balanced ambient chamber behavior
- `Music`: best all-around music preset
- `Surge`: bigger, more aggressive show preset

## Current Doc Structure

Active canonical docs:

- [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
- [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
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
