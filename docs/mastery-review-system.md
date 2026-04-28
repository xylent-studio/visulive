# VisuLive Mastery Review System

Date: 2026-04-22
Status: Active mastery review layer

This document replaces the old phase-0 review posture as the current ongoing
review system for the anthology program.

Use it with:

- [proof-pack-workflow.md](C:/dev/GitHub/visulive/docs/proof-pack-workflow.md)
- [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
- [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)

The old [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)
is now historical baseline context only.

## Review Cadence

Run mastery review:

- after any serious anthology family pass
- after any runtime extraction that changes ownership
- after every fresh proof-pack batch
- before promoting a family to `frontier` or `flagship`
- before pushing `stable`

## Review Questions

Every serious review pass should answer:

- across-room readability: does the frame read from distance before close-up detail matters?
- authority ownership: who owns the frame now, and is that ownership intentional?
- consequence: did the event change the image itself or only make it louder?
- memory: does the show remember what happened earlier?
- safe-tier dignity: does `webgpu / safe` still feel premium and authored?
- no-touch strength: was the untouched show already compelling?

## Labeling Rules

Every golden or failure reference should be labeled with:

- what it proves or what it warns against
- the anthology family it most relates to
- the failure pattern it helps avoid
- whether it is `benchmark`, `report still`, `report text`, or `historical`

Do not keep unlabeled screenshots around as implicit truth.

## Golden Review Set

Until fresh current captures are promoted, the golden set is provisional and
drawn from historical benchmark baselines plus known report stills.

### 1. Historical AFQR Primary Benchmark

- file: [room-capture_2026-04-09_02-51-04.json](C:/dev/GitHub/visulive/captures/archive/benchmarks/room-capture_2026-04-09_02-51-04.json)
- type: `benchmark`
- proves:
  - historical direct-audio baseline for comparison
  - strong direct-audio baseline for pressure, cadence, and earned spend
- family emphasis:
  - `Music Semantics`
  - `World Grammar / Mutation`
- failure pattern avoided:
  - treating old exploratory captures as current truth

### 2. Historical Quiet Room Floor Benchmark

- file: [room-capture_2026-04-09_10-22-43.json](C:/dev/GitHub/visulive/captures/archive/benchmarks/room-capture_2026-04-09_10-22-43.json)
- type: `benchmark`
- proves:
  - historical low-background room-floor reference
  - silence and sparse-music floor still belong to the real product
- family emphasis:
  - `Music Semantics`
  - `World Grammar / Mutation`
- failure pattern avoided:
  - judging the show only on loud direct-audio material

### 3. Hero Emissive Proof Still

- file: [live-hero-cool-pass-1.png](C:/dev/GitHub/visulive/captures/reports/live-review/live-hero-cool-pass-1.png)
- type: `report still`
- proves:
  - hero seam/rim direction is better than the old soft-shell read
  - dark-body contrast still matters
- family emphasis:
  - `Hero Ecology`
- failure pattern avoided:
  - reverting to softly lit blob hero treatment

### 4. Structure / Rim Proof Still

- file: [live-structure-pass-1.png](C:/dev/GitHub/visulive/captures/reports/live-review/live-structure-pass-1.png)
- type: `report still`
- proves:
  - structure, rim, and wireframe direction remain part of current taste truth
- family emphasis:
  - `Hero Ecology`
  - `Lighting / Cinematography`
- failure pattern avoided:
  - hero fill overwhelming structural read

### 5. Historical Live Baseline Still

- file: [historical-baseline-live-inspection-2026-04-08.png](C:/dev/GitHub/visulive/captures/reports/historical-baseline-live-inspection-2026-04-08.png)
- type: `report still`
- proves:
  - historical baseline room-read before the next repertoire wave
- family emphasis:
  - `Operator UX / Trust`
  - `Lighting / Cinematography`
- failure pattern avoided:
  - reviewing new passes without a stable visual baseline

## Failure Gallery

### 1. Pre-Wall-Clock Legacy Drop

- file: [auto_drop_1969-12-31_19-00-37.json](C:/dev/GitHub/visulive/captures/archive/legacy/auto_drop_1969-12-31_19-00-37.json)
- type: `historical`
- failure pattern:
  - broken timestamp / legacy evidence provenance

### 2. Pre-Wall-Clock Legacy Release

- file: [auto_release_1969-12-31_19-10-41.json](C:/dev/GitHub/visulive/captures/archive/legacy/auto_release_1969-12-31_19-10-41.json)
- type: `historical`
- failure pattern:
  - old evidence format that should never be mistaken for current truth

### 3. Zero-Byte Exploratory Drop

- file: [auto_drop_2026-04-07_23-16-06.corrupt](C:/dev/GitHub/visulive/captures/archive/quarantine/auto_drop_2026-04-07_23-16-06.corrupt)
- type: `historical`
- failure pattern:
  - broken exploratory artifact that should be excluded from proof

### 4. Smeared Exploratory Drop

- file: [auto_drop_2026-04-07_22-24-44.json](C:/dev/GitHub/visulive/captures/archive/exploratory/auto_drop_2026-04-07_22-24-44.json)
- type: `historical`
- failure pattern:
  - oversized multi-event window that blurs tuning truth

### 5. Hero-Monopoly Still

- file: [historical-baseline-desktop-review-2026-04-08.png](C:/dev/GitHub/visulive/captures/reports/historical-baseline-desktop-review-2026-04-08.png)
- type: `report still`
- failure pattern:
  - hero-only frame read with weak chamber participation and not enough whole-frame authority

## Review Outcome Rule

Every review should end with one of these outcomes:

- `hold`: the family is not yet ready to advance
- `promote to frontier`
- `promote to flagship`
- `retire or merge`

If the outcome is `hold`, record the exact blocking family, blocker type, and
next dependency in the capability map.
