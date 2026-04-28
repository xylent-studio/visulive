# VisuLive Capture Library

Date: 2026-04-15  
Status: Active tuning asset folder

This folder is the canonical home for replay captures used in tuning and review.

Current lifecycle:
- [inbox](C:/dev/GitHub/visulive/captures/inbox) for active auto-saved evidence
- [canonical](C:/dev/GitHub/visulive/captures/canonical) for curated retained scenario packs
- [archive](C:/dev/GitHub/visulive/captures/archive) for learned historical batches
- [reports](C:/dev/GitHub/visulive/captures/reports) for generated analysis only

Run-package truth:
- serious runs now live under `captures/inbox/runs/<runId>/`
- each run package may contain a run journal, run manifest, clip JSON files, and stills
- reviewed runs should also carry a review summary, optional attached review note, and recommendation JSON
- loose clip JSON files still parse, but the new default evidence unit is the run package
- run journals are local operator/dev evidence only, not hosted analytics

Run lifecycle states:
- `inbox`: freshly collected and not yet reviewed
- `reviewed-candidate`: reviewed current-proof candidate retained for comparison
- `canonical`: the currently accepted proof run for that scenario
- `archive`: historical or invalidated material kept for lineage

Current benchmark truth:
- benchmark status is defined in [benchmark-manifest.json](C:/dev/GitHub/visulive/captures/benchmark-manifest.json)
- the manifest may intentionally contain only historical baselines while a fresh current proof batch is still missing
- older captures are historical context only unless explicitly promoted back into the active current benchmark set
- replay/capture remains internal AI/developer tuning infrastructure, not the intended end-user product loop
- the manifest now separates a primary AFQR correction benchmark from secondary room-floor scenario entries so the reports can judge them independently
- the current next-level wave also expects slower ambient proof to show motion variety, palette handoff, and screen-space consequence instead of the samey lock

Evidence status labels:
- `historical-baseline`: useful lineage and comparison material, not current branch proof
- `current-candidate`: fresh current-pass evidence that is attached for review but not yet the settled benchmark truth
- `current-canonical`: fresh current-pass evidence that is the active benchmark truth

Use it for:
- canonical room scenarios
- before/after comparison material
- captures tied to specific tuning problems
- short review notes tied to meaningful passes
- generated analysis reports in [reports](C:/dev/GitHub/visulive/captures/reports)

## Naming

Prefer explicit names:

- `silence-built-in-mic-baseline.json`
- `hvac-room-tone-built-in-mic.json`
- `speech-near-device.json`
- `low-room-music-speakers.json`
- `medium-room-music-speakers.json`

If a capture is tied to a specific issue or pass, include that:

- `low-room-music-speakers_after-world-activity-pass.json`

## What Belongs Here

Keep:
- reusable captures that help evaluate the product
- captures that represent the canonical scenario pack
- captures that support a real tuning or regression question

Do not keep:
- throwaway experiments with no review value
- huge one-off files that no longer answer a real question

## What Makes A Capture Strong

The strongest captures represent one clear musical idea:
- a build that should gather
- a drop that should detonate
- a release that should linger
- a quieter passage that should still feel alive
- a slow ambient passage that still moves in space and color

If one file stretches across too many unrelated moments, it is weaker for tuning even if the visuals looked cool.

Recent analyzer updates now surface:
- source mode
- quick-start profile
- active act
- trigger count inside the capture window
- extension count inside the capture window
- oversized capture warnings
- multi-event window warnings
- recalculated quality flags under the current rules instead of stale embedded flags
- active benchmark labeling and longest contiguous run summaries for state, intent, cue family, shot class, transition class, and tempo cadence mode
- primary benchmark reads and secondary floor reads are now reported separately when the manifest provides both kinds
- motion-axis spread and palette spread by act/family are now the key wave-specific readouts to check first

That makes it easier to tell whether a file is good evidence or smeared evidence.

## Review Use

When using a capture for tuning, note:
- the machine
- the mic
- the renderer backend
- the quality tier
- the control state used for the pass

The goal is not just to collect files.
The goal is to make future tuning reproducible.

## Developer Loop

Once captures exist, do not stop at "load replay and eyeball it."

Use the full loop:

1. collect the capture
2. arm `Proof Wave` in backstage for serious runs so auto-capture, auto-save, proof stills, and run journaling are enabled together
3. save the run into [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
4. if you want the low-friction path, choose that folder once in diagnostics and let the app write there automatically
5. if you want rolling reports while music is still playing, run:

```powershell
npm run watch:captures
```

6. for a one-shot report, run:

```powershell
npm run analyze:captures
```

7. review the generated markdown report in:
   - [reports](C:/dev/GitHub/visulive/captures/reports)
8. use that report plus live visual judgment to decide the next retuning pass

The rolling watcher keeps this file current while new captures arrive:
- [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)

`npm run analyze:captures` now refreshes that same latest report too.

For the serious current-proof pass, prefer:

```powershell
npm run proof:current
```

That runs benchmark validation, refreshes the latest analyzer report, and rebuilds the latest proof pack serially.
If you want a review note scaffold after that:

```powershell
npm run proof:review-note
```

Then classify the run package itself:

```powershell
npm run evidence:index
npm run run:review -- --run-id <runId> --review-note <path-to-note>
npm run run:promote -- --run-id <runId> --state reviewed-candidate
```

Only move a reviewed candidate to canonical when it should replace the standing truth:

```powershell
npm run run:promote -- --run-id <runId> --state canonical
```

Archive the whole run package when it is useful history but not current proof:

```powershell
npm run run:archive -- --run-id <runId>
```

Benchmark hygiene is now part of the capture loop:

```powershell
npm run benchmark:validate
```

If a capture becomes benchmark truth, promote it intentionally:

```powershell
npm run benchmark:promote -- <capture-path> --id <benchmark-id> --label "<label>" --kind primary-correction
```

Use `secondary-floor` when the capture exists to judge quiet room-floor behavior.

Promotion default is now `current-candidate`.
Only pass `--status current-canonical` when the fresh batch has cleared review and you want it to become the active benchmark truth.

The latest report now distinguishes:
- long-duration windows
- multi-event trigger-sprawl windows

The old 12-capture ceiling is gone for folder auto-save.
The browser now only trims its recent replay-ready window in memory so diagnostics stay usable while this folder can keep accumulating evidence for the full session.

Legacy `1969-...` captures and prior exploratory batches now belong under [archive](C:/dev/GitHub/visulive/captures/archive), not in the active inbox.

If the inbox is empty, the analyzer now refreshes [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md) with an explicit placeholder status instead of leaving a stale report behind.

The current standard is not just "does it react."
It is also:
- does it spend similar musical moments consistently
- does the report confirm that the conductor and event system are classifying those moments coherently
- does the run journal prove when authority turned, when no-touch cleared, and whether a clip was actually captured for those moments

The local evidence catalog is now part of the workflow:

```powershell
npm run evidence:index
npm run evidence:query -- --scenario operator-trust --no-touch
npm run evidence:query -- --runs --scenario operator-trust --current-proof
npm run evidence:query -- --recommendations --owner-lane runtime-governance
npm run evidence:compare -- --scenario primary-benchmark
npm run evidence:missed
```

Use that catalog to find proof-worthy examples without re-reading raw JSON by hand.

Current capture policy:
- active inbox batches are intentionally disposable
- after a retune pass, move the learned inbox batch into [archive](C:/dev/GitHub/visulive/captures/archive) or [canonical](C:/dev/GitHub/visulive/captures/canonical) before collecting the next one
- no active benchmark may point at missing files
- no reviewed batch should remain in [inbox](C:/dev/GitHub/visulive/captures/inbox) after its pass
- no nested `archive` or stale screenshot pile should remain under `inbox` once the batch has been learned
- the current auto-capture rules are tuned for shorter windows, so anything over roughly `15s` or with repeated retriggers should be treated as weaker evidence

## Serious-Pass Standard

Every serious retuning pass should contain three batches:

1. AFQR-style primary benchmark batch
2. quiet room-floor batch
3. broader show-coverage batch

Each batch should yield:

- analyzer report
- optional proof-still bundle
- one short review note
- an explicit verdict against `truth`, `hierarchy`, `coverage`, `taste`, and `operator trust` gates

## Best Current Batch

If you want the highest-value evidence right now:

1. choose `Music On This PC`
2. turn on `Auto Capture`
3. turn on `Auto Save To Folder`
4. play 3 to 5 strong build/drop moments
5. include one or two slower build/release passages
6. run `npm run analyze:captures`

The most useful extra context is a single short note such as:
- "drop should have hit much harder"
- "aftermath looked good"
- "too center-heavy"
- "colors finally popped here"
- "ambient passage still moved in full space"
- "palette handoff finally read as intentional"

## Supporting Files

Use:
- [scenario-pack-checklist.md](C:/dev/GitHub/visulive/captures/scenario-pack-checklist.md)
- [review-note-template.md](C:/dev/GitHub/visulive/captures/review-note-template.md)
- [reviews/README.md](C:/dev/GitHub/visulive/captures/reviews/README.md)
- [reports/README.md](C:/dev/GitHub/visulive/captures/reports/README.md)

These exist so capture-driven tuning turns into evidence instead of memory.
