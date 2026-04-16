# VisuLive Tuning Workflow

Date: 2026-04-15  
Status: Active evaluation and tuning workflow

This document defines how the project should be tuned from here forward.

The goal is simple:

Stop tuning the system only by memory and ad hoc room feel.

The project is now too rich for that to remain reliable.

## What The Current Captures Already Taught Us

The first real evidence batch is useful enough to stop guessing.

Current takeaways from the fresh wall-clock captures:
- the signal path is materially healthier on direct PC audio than the old mixed baseline
- accent is strong enough to support sharp punctuation
- music confidence is decent, but many drops still land in `surge` with only moderate confidence
- drop detection is still conservative for the kinds of moments that should feel huge
- section-change release is still under-read in some builds
- visual archetype consistency is improving, but not yet trustworthy enough to call finished
- the quiet room-mic music floor is now a separate benchmark from AFQR, and it still needs a readable subject floor instead of tiny center pinning
- the slow ambient material still exposes the samey lock most clearly, which means motion, palette handoff, and screen-space consequence all need more authored spread

The most repeated current warning is still:
- "a surge posture is active with only moderate peak confidence"

That means the system is often trying to spend a big show posture before the conductor is fully convinced the music earned it.

## Why This Matters

The product is driven by:
- real room audio
- smoothing
- state memory
- event cooldowns
- layered scene consequences

That means a change that feels better in one moment can easily:
- break silence stability
- overspend events
- collapse contrast
- hurt low-music readability
- make the scene look bigger but worse

This is why the next phase must include repeatable tuning.

## Current Tuning Loop

Right now the intended loop is:

1. run locally
2. choose the correct quick start
3. calibrate cleanly
4. let auto capture save evidence during real musical moments
5. review the rolling or manual analysis report
6. replay captures when needed
7. retune against saved evidence instead of memory alone

This is now a real tuning system, not just a nicer live-only loop.

## Latest Retuning Focus

The most recent shipped pass retuned the show in three specific ways:
- stronger hysteresis between `surge`, `generative`, `aftermath`, and quiet states
- stricter macro-event spending so rare events feel earned
- clearer separation between hero motion and chamber/world participation
- a new internal show-director layer that dynamically shifts color, framing, glow, laser drive, and scene spend over time with the music
- a docs-led next-level wave now targets stage-led 6DoF locomotion, act/family palette holds, and screen-space consequence

That pass should be judged primarily on:
- whether hush feels calmer and more withheld
- whether aftermath lingers with consequence instead of snapping back
- whether `World Activity` now feels more like room-scale participation than camera/hero inflation

## Current Replay And Auto-Evidence Workflow

The app now ships a dev-only replay workflow behind `Shift + D`.

What it does now:
- record interpreted room sessions while the listening engine is live
- arm automatic evidence capture around big musical moments such as drops, section changes, releases, and quiet room-floor music where that is the real review target
- save those sessions as JSON captures
- load a saved capture back into the app
- drive the renderer from that capture instead of the live microphone
- scrub, pause, restart, and compare behavior deterministically

Why this matters:
- it stops the project from depending only on room luck
- it makes event tuning and contrast tuning repeatable
- it lets us compare multiple control passes against the same material
- it keeps AFQR and quiet room-mic floor evidence separate so one failure mode cannot hide the other

Current workflow:

1. on Windows, run `npm run dev:live-loop` if you want the browser app and rolling analyzer together
2. otherwise run `npm run dev` and `npm run watch:captures` in separate terminals
3. start the chosen listening path and calibrate cleanly
4. open diagnostics with `Shift + D`
5. choose [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as the capture folder once
6. turn on `Auto Capture`
7. turn on `Auto Save To Folder`
8. run one scenario cleanly
9. if using manual capture, click `Stop + Save`
10. if using auto capture, let the app write new `.json` captures directly into [captures](C:/dev/GitHub/visulive/captures)
11. use `Load Latest Auto`, `Load`, `Play`, `Pause`, `Restart`, `Return To Live`, and the scrub bar to review the capture

Important:
- manual capture and auto evidence capture are intentionally paused while replay mode is active
- return to live mode before expecting new evidence to be recorded
- fresh auto captures should now save with real wall-clock labels such as `auto_drop_2026-04-07_21-50-53.json`
- if you still see new captures saving as `1969-12-31...`, refresh the app before collecting more evidence
- newer captures now store source mode, quick-start profile, trigger count, and extension count
- captures now preserve both the launch profile and the current active quick-start state, so the report can distinguish "started from the right authored posture" from "drifted into a custom mix later"
- auto captures now cap their total window length so one saved file is more likely to represent one musical idea
- captures now preserve boot/calibration summaries, source integrity, decision summaries, and input-drift summaries so floor-policy issues can be judged directly
- diagnostics now support optional proof-still bundles for auto-saved captures; use them as synchronized evidence checkpoints, not as a screenshot stream
- folder auto-save is no longer limited by the old in-app 12-capture ceiling; the app now keeps only a recent replay window in memory while continuing to save evidence to disk
- captures now also preserve visual telemetry summaries such as glow budgets, palette spread, hue variation, and temporal window means
- captures now also preserve active act telemetry, so the report can show which hidden show act actually owned the moment
- capture quality flags now call out lower-confidence evidence such as `manualCustom`, `safeTierActive`, `highAmbientGlow`, `lowPaletteVariation`, `undercommittedDrop`, `weakPhraseRelease`, and `multiEventWindow`
- for the current visual pass, pay special attention to `ambientGlowBudget`, `worldGlowSpend`, `heroHue`, `worldHue`, and `paletteState`; those are now the fastest signals for whether the image is still washing out or collapsing back into too little palette variation
- analysis now recalculates quality flags from the capture contents under the current rules, so older files are re-evaluated instead of carrying stale embedded flags forever
- the latest report now distinguishes `Long captures (>15s)` from `Multi-event windows (high trigger/extension count)`; both matter, but they are not the same problem
- the latest report now separates primary benchmark reads from secondary floor reads, so AFQR and quiet room music can be judged independently
- after the current retune, restart the live loop before collecting the next canonical batch so the shorter auto-window rules are actually active

### Developer loop after capture

Once captures exist, the next step is no longer guesswork.

Run:

```powershell
npm run analyze:captures
```

Or target a specific file/folder:

```powershell
npm run analyze:captures -- captures\\low-room-music-speakers.json
```

That script writes a markdown report into:
- [captures/reports](C:/dev/GitHub/visulive/captures/reports)

If `npm run watch:captures` is active, it keeps a rolling latest report updated at:
- [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)

`npm run analyze:captures` now refreshes that same latest report too, so the canonical report path stays current even when the watcher is not running.
When the inbox is empty, that latest report should still show manifest-backed active benchmark and secondary floor reads so archived truth does not disappear from the operator view.

The report summarizes:
- state occupancy
- performance-intent occupancy
- moment counts
- signal peaks and means
- beat-interval stability
- dominant visual event archetype
- trigger-to-archetype spread across the analyzed capture set
- source-mode spread and quick-start spread
- launch-profile spread versus active quick-start spread
- how many captures were customized away from their launch quick start
- quality-tier spread
- act spread
- ambient-vs-event glow occupancy
- palette-state spread
- hero/world hue variation
- event latency between audio trigger and visual spend
- renderer-quality transitions and first downgrade timing
- proof-still filenames when a capture saved synchronized stills
- coverage debt and monopoly findings across show language and asset layers
- review-gate guidance for `truth`, `governance`, `coverage`, and `taste`
- inferred tuning flags and likely weak spots
- fresh-capture metrics separated from legacy pre-wall-clock captures when both are present

This is now the main autonomous review surface for developers between live tests.

### Benchmark discipline

Do not leave benchmark truth implicit.

Before accepting a serious batch, run:

```powershell
npm run benchmark:validate
```

If the batch becomes new benchmark truth, promote it intentionally:

```powershell
npm run benchmark:promote -- <capture-path> --id <benchmark-id> --label "<label>" --kind primary-correction
```

Use `secondary-floor` for quiet room-floor truth.

Hard rule:

- no active benchmark may point at missing files
- no reviewed batch remains in `captures/inbox` after its pass; it must be promoted or archived deliberately

## Serious-Pass Cadence

Every serious tuning pass now has three required evidence batches:

1. one AFQR-style primary benchmark batch
2. one quiet room-floor benchmark batch
3. one broader show-coverage batch

Each batch should produce:

- analyzer report
- optional proof-still bundle
- one short review note
- an explicit pass/fail verdict against the review gates

## Review Gates

Treat these as the standing acceptance system:

- `truth`: benchmark manifest valid, source provenance coherent, capture integrity intact
- `governance`: hero coverage, ring-belt persistence, wirefield density, composition safety, and world delivery remain within the current band
- `coverage`: no major monopoly and no dormant core lanes across the batch
- `taste`: fullscreen across-room authority, mid-distance chamber read, and up-close reward still feel premium
- `motion`: the wave shows clear multi-axis travel and camera phrasing instead of one-axis wobble
- `color`: palette holds and handoffs read as authored by act and family, not by twitch

The analyzer can automate most of `truth`, `governance`, and `coverage`.
`taste` still requires a human review note.

## Target-Machine Discipline

Every major visual pass should still be judged on the real machine posture:

- `webgpu / safe`
- current target display posture
- fullscreen room-read behavior

Do not accept a visual improvement that quietly buys its effect with target-machine instability.

## What A Meaningful Next Batch Looks Like

Do not just let random music run for an hour and assume the evidence will be equally useful.

The best next batch is:
- 3 to 5 strong build/drop moments from direct PC audio
- 1 to 2 slower build/release phrases
- at least one slower ambient passage that should expose the samey lock if it is still there
- 1 quieter atmospheric passage
- 1 quiet room-floor batch where `floor` capture behavior is allowed to prove itself
- optional second pass in `Big Show Hybrid` if the direct-audio batch is already clean

For each batch, the highest-value context is:
- quick start used
- whether the source was `Music On This PC`, `Music In The Room`, or `Big Show Hybrid`
- track or artist name if you know it
- one short note such as:
  - "drop should have felt much bigger"
  - "aftermath looked good"
  - "color went hard here"
  - "too much stayed in the center"

This is enough context to make the next tuning pass sharper without turning the workflow into paperwork.

### Avoid weak evidence

Try not to mix too many variables in the same batch:
- do not keep changing sliders every 20 seconds
- do not mix room-mic-only and PC-audio captures in the same tuning read unless that is the point of the batch
- do not leave an old watcher running after analyzer changes without restarting it

If the report shows oversized captures, that means:
- the moment is smeared across too much time
- the file is weaker for targeted retuning
- the next batch should be recollected after refreshing the app and restarting the watcher/live loop

## Consistency Standard

The system is not allowed to be "awesome by accident."

That means:
- similar drops should land in similar visual archetypes
- similar builds should spend in similar families and macro-event classes
- the app can still vary, but it must vary for musical reasons, not because a cursor happened to rotate

The current tuning loop should explicitly check:
- whether drop captures converge on a stable archetype
- whether aftermath captures actually enter aftermath behavior
- whether speech-like captures stay out of surge-heavy event spending
- whether auto-captured moments are visually and semantically consistent enough to trust

### What auto evidence capture records

Auto capture does not yet save raw PCM audio.

It records:
- the interpreted `ListeningFrame`
- the low-level `AnalysisFrame`
- runtime diagnostics and guardrail truth
- the active controls and renderer state at the time of capture
- trigger metadata explaining why the moment was captured

That is enough for deterministic visual retuning and conductor review, which is the current goal.

## Capture Storage

Store replay captures in:
- [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) for active auto-saved evidence
- [captures/canonical](C:/dev/GitHub/visulive/captures/canonical) for curated retained scenario packs
- [captures/archive](C:/dev/GitHub/visulive/captures/archive) for learned historical batches

The simplest intended setup is:
- choose the repo's `captures/inbox` folder once in diagnostics
- let the app auto-save there
- let the watcher keep the latest report warm in the background

When the inbox is empty, the analyzer now refreshes the latest report path with an explicit placeholder status instead of leaving stale evidence behind.

Use these support files:
- [scenario-pack-checklist.md](C:/dev/GitHub/visulive/captures/scenario-pack-checklist.md)
- [review-note-template.md](C:/dev/GitHub/visulive/captures/review-note-template.md)

This folder is now the canonical place for reusable tuning material.

## Required Scenario Pack

Every meaningful tuning pass should be judged against the same scenario set.

### Core scenarios
- true silence
- quiet room tone
- HVAC hum
- speech near the device
- keyboard / mouse handling
- desk taps
- glass / metal clinks
- low room music
- medium room music

These remain the canonical room scenarios.

## What We Need Next

The replay harness now exists in a useful first form.

The next tuning workflow improvements should be:
- build the canonical capture pack
- add short review notes for each meaningful tuning pass
- compare retuning changes against the same saved material before continuing
- continue structural extraction so telemetry, hero, chamber, and motion ownership no longer collide in one scene file

## Replay Harness Reality

The replay harness now does the important job:
- capture listening frames from a real session
- save them to disk
- replay them deterministically into the renderer
- compare renderer behavior across changes

It is now one of the main quality-protection systems in the repo.

What is still missing:
- capture set management inside the app
- loop points
- side-by-side comparison workflow
- per-capture notes/tags
- optional raw-audio sidecar recording if we later decide it is worth the added complexity

### Scenario storage

Now that the harness exists, store captures in:
- [captures](C:/dev/GitHub/visulive/captures)

Keep file names explicit, for example:
- `silence-built-in-mic-baseline.json`
- `hvac-built-in-mic-baseline.json`
- `speech-near-device.json`
- `low-music-room-speakers.json`

## Manual Workflow For Real-Room Validation

Even with replay shipped, every serious tuning pass still needs a clean live-room check.

### 1. Establish the environment
- same machine if possible
- same mic if possible
- same Chrome version if possible
- same room posture if possible

### 2. Calibrate correctly
- calibrate with the room in baseline state
- do not calibrate with music already playing unless specifically testing that case

### 3. Use the same scenario order
- silence
- room tone
- HVAC
- speech
- taps
- clinks
- low music
- medium music

### 4. Capture runtime truth
For each tuning session, note:
- preset
- all control settings
- renderer backend
- quality tier
- raw-path status
- the scenario pass/fail observations

### 5. Change one thing at a time
Do not:
- tweak five controls
- tweak event logic
- tweak scene geometry
- and then decide by feel

Make bounded changes and compare them against the same scenario sequence.

### 6. Save the evidence
- record a replay capture for the scenario that best demonstrates the change
- note the control state and renderer truth
- write a short pass note if the change is meaningful
  - use [review-note-template.md](C:/dev/GitHub/visulive/captures/review-note-template.md)

## Tuning Priorities

When tuning, use this priority order.

### Priority 1: silence and room truth

If silence, room tone, or HVAC are broken, do not continue to aesthetic polish.

### Priority 2: low-music wake-up

Low music is the hardest and most important emotional case.

### Priority 3: big-screen readability

If the screen is still too center-locked or too busy, fix that before adding detail.

### Priority 4: event spending

If events feel spammy, reduce spending before adding more event types.

### Priority 5: material beauty

Only after the above should material nuance be a priority.

## Review Artifact Standard

Every meaningful tuning pass should produce a short note containing:
- what changed
- why it changed
- what scenario set was tested
- what improved
- what regressed
- what should happen next

This can live in a future review folder or be added to a lightweight log later.

## The Three Tuning Lenses

Every change should be judged through three lenses.

### 1. Acoustic honesty
- does the response still make sense for the room?

### 2. Visual authorship
- does it feel more directed, not just more active?

### 3. Operator clarity
- is it easier to steer intentionally?

If a change fails any of those, it is probably not a good change.

## What The Next Tuning Infrastructure Pass Should Deliver

### Must-have
- documented scenario pack
- canonical saved captures
- replay playback mode
- metadata capture
- short retuning notes linked to meaningful passes

### Nice-to-have
- side-by-side before/after replay
- export/import control state snapshots
- simple event logging during replay

## Bottom Line

The project is now too sophisticated to keep tuning by memory and raw intuition alone.

The next serious quality leap requires:
- repeatable scenarios
- deterministic playback
- documented observations
- tighter change isolation

That is how we protect quality while still moving fast.
