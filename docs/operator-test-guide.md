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
- validating that steering improves an already-good show instead of rescuing a weak one

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
5. steering after the no-touch passes are complete

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
9. Do not touch any steering controls for the first several phrases.
10. Judge whether the show evolves meaningfully on its own.

If you are running a serious review pass instead of a casual look:

- run `npm run proof:preflight` before opening the browser; serious proof requires a clean committed workspace
- start the local app with `npm run dev:proof`
- arm `Proof Wave`
- confirm the capture folder points at [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- set `Backstage -> Capture -> Proof Scenario` before the run starts
- verify `Proof ready: yes` in diagnostics or backstage before pressing `Start Show`
- finish by reviewing the analyzer report and writing one short note

`Proof Wave` now does the serious-pass setup in one path:
- verifies the capture folder is writable
- enables auto capture
- enables auto save to folder
- enables proof stills
- records build identity into captures
- starts a run journal on the next `Start Show`

`Start Show` is now hard-gated for serious proof:
- if the capture folder is not writable in the repo inbox, the run should not start as serious proof
- if build identity is invalid or still a dev build, the run should not start as serious proof
- if no proof scenario is selected, the run should not start as serious proof
- if replay is active, the run should not start as serious proof
- if the route/input does not match the declared scenario, the run should not start as serious proof

Use these scenario defaults:
- `Primary benchmark` for a normal `Music On This PC` no-touch music run
- `Operator trust` for a no-touch confidence run where the main question is whether the show stays stable without steering
- `Room floor` for microphone/room-input quiet behavior
- `Sparse / silence` for low-input dignity and non-collapse proof
- `Coverage` for broad cue/family/authority variety
- `Steering` only for deliberate operator-control or exploratory steering tests; it should not satisfy no-touch autonomy proof

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

- `Style` to constrain or curate world pools, look pools, worlds, looks, and stances
- `Steer` to bias the autonomous director with macro appetites
- `Backstage` for route repair, device selection, capture, replay, build truth, and diagnostics

Current route truth:

- the chosen route is explicit at startup
- the app may recommend a stronger route later
- it does not switch routes for you mid-show

## Current Branch Compatibility Note

The current branch may still expose older UI language while the surface rewrite catches up.

Map it like this:

- quick starts -> temporary route helpers for `Auto Show`
- `Manual Input Setup` -> temporary compatibility path to `Advanced > Backstage`
- `Explore` -> temporary compatibility path to `Advanced > Style`
- `Director Deck` -> temporary compatibility path to `Advanced > Steer`
- older settings panel -> temporary compatibility path to the unified `Advanced` drawer
- legacy preset labels -> temporary compatibility labels, not long-term product language

Do not treat older slider names as the canonical product model.

## Steering Pass

Only run this after the no-touch pass.

Good steering should:

- bias the director over multiple phrases
- change world, look, authority, and consequence tendencies over time
- never freeze the scene into a static answer by accident

Bad steering looks like:

- setting one value and parking the scene there
- using controls to rescue a weak default
- needing constant intervention to keep the show alive

## Serious Review Standard

A serious pass now means:

1. one long direct-audio no-touch batch
2. one quiet room-floor no-touch batch
3. one hybrid batch
4. one sparse / silence batch
5. one steering batch

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
- whether advanced style curation felt real or superficial
- whether steering biased the show over time instead of freezing it
- what still felt fake, repetitive, flat, or too menu-dependent
