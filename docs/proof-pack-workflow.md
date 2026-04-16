# VisuLive Proof Pack Workflow

Date: 2026-04-15  
Status: Active evidence workflow

This document defines the first reusable proof-pack pass for VisuLive.

The goal is not to replace human judgment. The goal is to turn the current
captures, analysis report, and screenshot set into a consistent review packet
that can be generated on demand and compared across passes.

## What This Workflow Owns

This workflow owns:
- evidence packaging
- strong/weak capture selection
- cue-class grouping
- chamber-authority grouping
- compositor consequence grouping
- motion-phrase grouping
- palette-handoff grouping
- safe-tier validation gates
- screenshot review inventory

This workflow does not own:
- scene code
- renderer policy
- audio semantics
- operator UI
- visual taste decisions without evidence

## Inputs

Use the current artifact set:
- capture JSON files in `captures/inbox`
- latest capture report in `captures/reports/capture-analysis_latest.md`
- current screenshot batch in `captures/inbox/screenshots`

The proof-pack harness does not image-analyze PNG pixels.
It inventories the screenshots and binds them to the capture evidence pack for
manual review.

## Script

Generate a proof pack with:

```bash
node scripts/build-proof-pack.mjs
```

Useful options:

```bash
node scripts/build-proof-pack.mjs --output docs/proof-pack_latest.md
node scripts/build-proof-pack.mjs --manifest docs/proof-pack_latest.json
node scripts/build-proof-pack.mjs --limit 5
node scripts/build-proof-pack.mjs --captures captures/inbox --screenshots captures/inbox/screenshots --report captures/reports/capture-analysis_latest.md
```

If you want both markdown and JSON in one run:

```bash
node scripts/build-proof-pack.mjs --output docs/proof-pack_latest.md --manifest docs/proof-pack_latest.json
```

## Output Shape

The markdown proof pack includes:
- executive read
- validation gates
- cue spread
- chamber authority spread
- motion spread
- palette spread
- compositor consequence spread
- strongest evidence picks
- weakest evidence picks
- screenshot review set

The JSON manifest includes:
- source report provenance
- aggregate spread by cue/chamber/compositor class
- gate statuses
- strong evidence candidates
- weak evidence candidates
- screenshot inventory

## How To Read It

Treat the proof pack as a decision aid, not as a victory lap.

Strong evidence should show:
- clear cue identity
- safe-tier viability
- visible chamber participation
- visible event spend
- enough variety to distinguish one stage class from another
- clear motion phrasing that is more than one-axis wobble
- clear palette handoff that reads as an act or family choice

Weak evidence should expose:
- under-committed drops
- long or smeared windows
- cue classes that collapse into the same picture
- chamber frames that still behave like support geometry
- compositor spend that is present but not yet decisive
- motion that still looks flat or circular for no musical reason
- palette that still reads as one samey answer

## Validation Gates

Use these as the first proof-pack gates:
- safe-tier discipline
- cue diversity
- chamber participation
- motion diversity
- palette diversity
- compositor consequence
- screenshot review completeness

If a gate fails, the next pass should fix the structure first.
Do not compensate by brightening the image.

## Recommended Review Order

1. Read the validation gates.
2. Read the strongest evidence picks.
3. Read the weakest evidence picks.
4. Review the screenshot inventory manually.
5. Decide whether the next pass is architectural, cue-level, chamber-level, or compositor-level.

## Practical Note

This workflow is intentionally lightweight.
It is meant to run on the current repo state without adding any new runtime
dependencies or touching the scene, renderer, or audio layers.
