# VisuLive Canonical Scenario Pack Checklist

Use this checklist when building the first reusable capture pack.

Create one clean capture for each scenario on the target machine when possible.

## Required Scenarios

- `silence-built-in-mic-baseline.json`
- `quiet-room-tone-built-in-mic.json`
- `hvac-room-tone-built-in-mic.json`
- `speech-near-device.json`
- `keyboard-desk-taps.json`
- `glass-metal-clinks.json`
- `low-room-music-speakers.json`
- `medium-room-music-speakers.json`

## Next-Level Wave Scenarios

- slow ambient passage where the image must stop looking samey
- living groove passage with visible palette handoff
- strong drop that should spend harder in space
- quiet intro or outro where the frame still breathes
- room-floor pass that confirms low-energy readability
- hybrid pass if the direct-audio batch already looks clean

## For Each Capture, Confirm

- calibration was done with music off
- the room state matched the intended scenario
- the capture name is explicit
- `npm run benchmark:validate` passed before accepting the batch as canonical truth
- renderer backend was noted
- quality tier was noted
- raw-path status was noted
- the active control state was noted
- proof stills were either collected intentionally or skipped intentionally
- a short review note was written if the capture informed a decision
- motion phrase, palette handoff, and screen-space consequence were noted when the wave was being tested

## Serious Batch Requirements

Every serious retuning pass should include:

- one AFQR-style primary benchmark batch
- one quiet room-floor batch
- one broader show-coverage batch

Each batch should be judged against:

- `truth`
- `governance`
- `coverage`
- `taste`

## Capture Standard

Each canonical capture should be:
- long enough to show the behavior clearly
- clean enough to represent the scenario
- specific enough to be reused later

Do not keep muddy captures as canonical references.
