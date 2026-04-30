# VisuLive Operator Test Guide

Date: 2026-04-22
Status: Active operator guide

This is the practical guide for testing the autonomous-first surface rewrite.

The first question is no longer:

- which slider makes this better

The first question is:

- is the show already compelling when left alone

## Who This Is For

Use this guide if you are:

- testing the current build on the target machine
- judging whether the autonomous path is strong enough to trust
- validating that the Director Console explains an already-good show instead of asking the operator to rescue it

## Before You Start

Use:

- Windows
- latest stable Chrome
- a local `localhost` run
- the input path you actually intend to use live first

Recommended evaluation order:

1. direct computer audio
2. room listening
3. hybrid
4. sparse / silence
5. hidden lab previews after the no-touch passes are complete, if a developer needs deterministic scene or moment receipts

## No-Touch Review Path

If you want the correct first serious pass, do this:

1. Run `npm run dev`.
2. Open Chrome.
3. Choose `PC Audio`, `Microphone`, or `Combo`.
4. Press `Start Show`.
4. If the current branch still shows legacy route helpers, use the compatibility path that matches your source:
   - `Music On This PC`
   - `Music In The Room`
   - `Big Show Hybrid`
5. Grant the requested browser permissions.
6. Let calibration finish.
7. Start the music.
8. Press `F` for fullscreen.
9. Do not touch route, capture, replay, lab, or repair controls for the first several phrases.
10. Judge whether the show evolves meaningfully on its own.

If you are running a serious review pass instead of a casual look:

- run `npm run proof:preflight` before opening the browser; serious proof requires a clean committed workspace
- start the local app with `npm run dev:proof`
- set `Backstage -> Capture -> Proof Mission` before the run starts
- arm `Proof Wave`; it should force auto capture, auto-save, proof stills, route/source, and mission metadata
- confirm the capture folder points at [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- verify `Proof ready: yes` in diagnostics or backstage before pressing `Start Show`
- end with `Finish Proof Run`, then review the run package and write one short note

`Proof Wave` is now a setup transaction, not a loose toggle:

- locks the selected proof mission into the next run package
- forces the mission route and source mode before `Start Show`
- verifies the capture folder is writable
- enables auto capture
- enables auto save to folder
- enables proof stills
- starts the run journal automatically on the next `Start Show`
- starts the run journal only after audio startup succeeds
- records build identity into captures
- resets serious-proof advanced curation and steering unless the mission is explicitly exploratory
- finalizes the run only through `Finish Proof Run`, where mission eligibility and artifact integrity are derived

`Start Show` is now hard-gated for serious proof:
- if the capture folder is not writable in the repo inbox, the run should not start as serious proof
- if build identity is invalid or still a dev build, the run should not start as serious proof
- if no proof mission is selected, the run should not start as serious proof
- if replay is active, the run should not start as serious proof
- if the route/input does not match the locked mission, the run should not start as serious proof

Use these mission defaults:
- `Primary benchmark` for a normal `Music On This PC` no-touch music run
- `Operator trust` for a no-touch confidence run where the main question is whether the show stays stable without steering
- `Acoustic/drums stress` for acoustic or live-feeling music with strong drums and transients after primary proof is valid
- `Room floor` for microphone/room-input quiet behavior
- `Sparse / silence` for low-input dignity and non-collapse proof
- `Coverage` for broad cue/family/authority variety
- `Governance regression` for reproducing or verifying overbright, ring persistence, or weak authority fixes
- `Steering` only for deliberate operator-control or exploratory steering tests; it should not satisfy no-touch autonomy proof

For the next proof wave, run one mission per run:

1. `Primary benchmark`, PC Audio, EDM/electronic, no-touch, 60-90 seconds as the canary.
2. Use `Finish Proof Run`, then run `npm run proof:current`, `npm run evidence:index`, and `npm run run:review -- --run-id <runId>`.
3. For signature-moment or playable-scene review, run `npm run moment:sheet -- --run-id <runId>` and inspect the generated contact sheet before deciding whether the run proves distinct image classes.
4. If the canary is valid, `Primary benchmark`, PC Audio, no-touch, 6-8 minutes.
5. If primary proof is valid, `Operator trust`, no-touch, 6-8 minutes.
6. Run `Acoustic/drums stress`, `Room floor`, `Sparse/silence`, and `Coverage` only after the primary authority path is trustworthy.

## What The No-Touch Pass Must Prove

The autonomous path should show:

- meaningful evolution over time
- authority shifts between hero, chamber, world, and consequence layers
- visible response to section turns, releases, and aftermath
- watchable quiet states
- a sense that the whole frame changes, not just object intensity

If the show only becomes interesting after manual steering, that is a failure of the product path.

## Advanced

The canonical next-version surface is:

- `Start Show`
- route choice: `PC Audio`, `Microphone`, `Combo`
- one optional `Advanced` drawer

Use `Advanced` like this:

- `Director` to read why the autonomous director chose the current scene, motif, palette chapter, ring posture, hero role/form, and signature moment
- `Backstage` for route repair, device selection, Proof Mission, capture, replay, build truth, and diagnostics
- hidden localhost/dev labs for forced scene, motif, moment, and synthetic cue previews; lab use is exploratory and cannot satisfy serious proof

Current route truth:

- the chosen route is explicit at startup
- the app may recommend a stronger route later
- it does not switch routes for you mid-show

## Current Surface Note

The current branch should expose the new operator language:

- `Start Show` chooses `PC Audio`, `Microphone`, or `Combo`
- `Advanced > Director` is read-only and explains autonomous intent
- `Advanced > Backstage` owns route repair, Proof Mission, capture, replay, and diagnostics
- former worlds, looks, stances, anchors, pools, saved stances, and steering sliders are internal director repertoire or hidden-lab fixtures, not normal-use product knobs

If an old quick-start/settings-panel/top-chrome surface reappears, treat that as a regression and run `npm run legacy:audit`.

## Lab Preview Pass

Only run this after the no-touch pass, and only in localhost/dev proof builds.

Good lab preview should:

- force one scene, motif, moment, or synthetic cue profile deterministically
- produce an exploratory receipt, contact sheet, or temporal strip
- help developers verify capability without pretending it is no-touch proof

Bad lab use looks like:

- using forced values to claim serious proof
- tuning the show by cursor feel instead of fixing autonomous director logic
- leaving forced preview state active before a serious run

## Serious Review Standard

A serious pass now means:

1. one long direct-audio no-touch batch
2. one quiet room-floor no-touch batch
3. one hybrid batch
4. one sparse / silence batch
5. one operator-trust batch
6. optional exploratory lab receipts for any failed or unproven scene/moment matrix cells

Each serious pass should end with:

- `npm run proof:current`
- `npm run evidence:index`
- analyzer and proof-pack review
- `npm run proof:review-note`
- `npm run run:review -- --run-id <runId> --review-note <path-to-note>`
- `npm run run:promote -- --run-id <runId> --state reviewed-candidate`
- optional `npm run run:promote -- --run-id <runId> --state canonical`
- or `npm run run:archive -- --run-id <runId>`
- optional proof-still review
- one short review note
- a verdict against `truth`, `hierarchy`, `coverage`, `taste`, and `operator trust`

## What To Watch In Diagnostics

Use `Shift + D` in dev mode.

The most useful values are:

- backend
- quality tier
- route / path status
- show state
- performance regime
- cue class
- stage intent
- silence state
- phrase confidence
- section intent

If you are helping the next retuning pass directly:

- choose [captures/inbox](C:/dev/GitHub/visulive/captures/inbox) as the capture folder once
- arm `Proof Wave`
- make sure proof readiness is green before starting the run
- optionally run `npm run watch:captures` in another terminal
- run `npm run proof:current` after the pass
- run `npm run evidence:index` to refresh the local catalog for query/diff work
- use `npm run evidence:query -- --runs --scenario operator-trust --current-proof`
- use `npm run evidence:query -- --recommendations --owner-lane runtime-governance`

## Minimum Feedback To Bring Back

After a real pass, the most useful report is:

- whether `Auto Show` was compelling with no intervention
- which input route felt strongest
- whether route recommendations felt correct without hijacking the show
- whether quiet sections still felt alive
- whether world/chamber authority showed up clearly
- whether the Director Console correctly explained what you were seeing
- whether any hidden lab preview exposed a missing or samey scene/moment posture
- what still felt fake, repetitive, flat, or too menu-dependent
