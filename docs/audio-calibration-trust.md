# Audio Calibration Trust

Date: 2026-04-30
Status: Active runtime contract

This document defines the current launch-to-proof audio trust contract.

## Runtime Rule

VisuLive stays native Web Audio first:

- `getDisplayMedia()` requests PC audio, but the browser and operator still decide the actual shared source.
- `AudioWorklet` owns low-latency time-domain feature extraction.
- `AnalyserNode` owns compact spectrum diagnostics.
- no MIR, ML, stem separation, or pitch dependency belongs in the public live runtime until native proof shows a specific ceiling.

## Source Modes

- `system-audio`: primary serious-proof path. The app must verify display audio was granted, real signal was heard, music lock occurred, and calibration is stable before a Proof Wave run can start.
- `room-mic`: quiet-room baseline path. Speech, hum, HVAC, clipping, and room noise remain trust reducers.
- `hybrid`: mixed-source v1. Mic and PC audio are still analyzed together, so hybrid is useful for exploration but must not claim separated source authority until split analyzers/worklets exist.

## Trust Fields

`AudioDiagnostics` is the source of truth for launch and proof gating:

- `calibrationTrust`: `blocked`, `provisional`, or `stable`
- `calibrationQuality`: `clean`, `silent-system-audio`, `weak-signal`, `loud-calibration-risk`, `clipped-startup`, `source-ended`, or `mixed-source-risk`
- `sourceReadiness`: display/track grant, signal presence, music lock, clipping, source-ended state, first-heard timing, first music-lock timing, stable timing, source-present score, and proof readiness

Missing fields in old captures mean "not recorded." Do not zero-fill old artifacts into proof truth.

## Proof Rule

Proof readiness has two stages:

1. Pre-start setup gates: capture folder, build identity, mission, replay inactive, route coherence.
2. Post-share source gates: stable calibration plus proof-ready source readiness.

Serious proof timing starts only after post-share audio startup succeeds. A silent or weak PC-audio share may still enter casual provisional live mode, but it cannot create a current-proof-eligible run.

## Calibration Policy

- PC audio uses a longer representative calibration window than room mic.
- PC audio keeps a conservative minimum ceiling so a quiet intro does not make the first drop saturate the conductor.
- PC audio caps calibration noise-floor overfit so loud music during startup does not erase later musical detail.
- PC spectrum baselines are less suppressive than room-mic baselines because calibration may hear the actual song, not background noise.
- PC vocal-like material should not suppress percussion authority the way room speech does.
