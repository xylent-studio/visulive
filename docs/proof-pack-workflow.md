# VisuLive Proof Pack Workflow

Date: 2026-04-23  
Status: Active evidence workflow

This document defines the first reusable proof-pack pass for VisuLive.

The goal is not to replace human judgment. The goal is to turn the current
captures, analysis report, and screenshot set into a consistent review packet
that can be generated on demand and compared across passes.

Use this together with:

- [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
- [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
- [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)

## What This Workflow Owns

This workflow owns:
- evidence packaging
- strong/weak capture selection
- no-touch evidence classification
- scenario coverage grouping
- cue-class grouping
- chamber-authority grouping
- authority-split validation
- compositor consequence grouping
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
- run packages in `captures/inbox/runs/<runId>/`
- latest generated capture report in `captures/reports/capture-analysis_latest.md`
- current screenshot batch in `captures/inbox/screenshots`

For fresh current-proof work, tag the run in diagnostics with one of:
- `primary-benchmark`
- `room-floor`
- `coverage`
- `sparse-silence`
- `operator-trust`
- `steering`

Current scenario coverage now reads those capture-level tags before any benchmark promotion happens.
For current v3 captures, scenario coverage should only count when the serialized scenario assessment validates the declared scenario.

Freshness matters more than filenames:
- `latest` means latest generated summary, not automatically fresh proof
- current proof only exists when the newest current review captures clear the manifest freshness policy
- historical baseline benchmark captures may remain attached for context, but they do not satisfy current proof gates
- screenshot references only satisfy review completeness if they also clear the current proof cutoff and freshness window

The proof-pack harness does not image-analyze PNG pixels.
It inventories the screenshots and binds them to the capture evidence pack for
manual review.

Current proof honesty also expects:
- valid build identity on current captures
- scenario assessment recorded on current captures
- no mismatch between declared no-touch/operator-trust claims and serialized intervention history

## Script

Generate a proof pack with:

```bash
npm run proof-pack
```

Useful options:

```bash
npm run proof-pack -- --output docs/proof-pack_latest.md
npm run proof-pack -- --manifest docs/proof-pack_latest.json
npm run proof-pack -- --recommendations docs/proof-pack_recommendations_latest.json
npm run proof-pack -- --limit 5
npm run proof-pack -- --captures captures/inbox --screenshots captures/inbox/screenshots --report captures/reports/capture-analysis_latest.md
```

If you want markdown, manifest, and recommendation JSON in one run:

```bash
npm run proof-pack -- --output docs/proof-pack_latest.md --manifest docs/proof-pack_latest.json --recommendations docs/proof-pack_recommendations_latest.json
```

If you want the standard serial refresh path instead of running the steps manually:

```bash
npm run proof:current
```

## Output Shape

The markdown proof pack includes:
- executive read
- evidence freshness
- validation gates
- scenario coverage
- cue spread
- authority split read
- chamber authority spread
- compositor consequence spread
- strongest evidence picks
- weakest evidence picks
- screenshot review set

The JSON manifest includes:
- source report provenance
- aggregate spread by cue/chamber/compositor class
- aggregate authority metrics and risk counts
- gate statuses
- proof-eligible capture count
- missed-opportunity count
- run-level recommendation summaries
- strong evidence candidates
- weak evidence candidates
- screenshot inventory

The recommendation JSON includes:
- one recommendation artifact per run id
- ranked issues and severity
- owner lane and subsystem
- supporting clip/still references
- target metrics and recommended next proof scenario

Current implemented scoring is still mostly scenario and show-state oriented.
Future anthology scoring should read the anthology catalog and graduation rubric
so proof packs can report family coverage and graduation readiness directly.

Current proof-pack truth is now run-aware:
- scenario coverage should only count current captures whose serialized proof validity remains current-proof-eligible
- recommendation output should be read as tuning hints, not automatic code changes
- missed capture opportunities are now a proof gate, not just an optional note

## How To Read It

Treat the proof pack as a decision aid, not as a victory lap.

Strong evidence should show:
- clear cue identity
- safe-tier viability
- visible chamber participation
- visible event spend
- enough variety to distinguish one stage class from another

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
- current-branch freshness
- build identity
- scenario validation
- safe-tier discipline
- cue diversity
- chamber participation
- compositor consequence
- current screenshot review completeness
- no-touch autonomy
- authority split validation
- primary authority proof
- silence dignity
- world authority delivery
- operator trust
- scenario coverage

If a gate fails, the next pass should fix the structure first.
Do not compensate by brightening the image.

No-touch autonomy currently means:
- captures recorded before any steering or backstage intervention
- at least one capture that clears the current no-touch proof window

Authority split validation currently means:
- at least one current-proof-eligible capture clears the authority-ready shape
- chamber presence mean is at least `0.24`
- world dominance delivered mean is at least `0.28`, or the capture reports shared/dominant world authority
- frame hierarchy mean is at least `0.62`
- hero coverage mean stays at or below `0.32`
- overbright rate stays at or below `12%`
- the batch has no hero-monopoly or overbright-risk captures

Primary authority proof currently means:
- at least one current `primary-benchmark` scenario capture
- the capture cleared the no-touch proof window
- the capture shows shared/dominant world authority or world dominance delivered at/above the authority threshold

Scenario coverage currently expects evidence across:
- `primary-benchmark`
- `room-floor`
- `coverage`
- `sparse-silence`
- `operator-trust`

Historical baselines may be listed separately in the pack, but they do not count toward that current scenario gate.

Anthology-family scoring is not fully implemented yet.
Until it is, use the proof pack plus the mastery review system together:

- proof pack for evidence grouping and gate health
- mastery review for golden references, failure patterns, and human review judgment

## Recommended Review Order

1. Read the validation gates.
2. Read the strongest evidence picks.
3. Read the weakest evidence picks.
4. Review the screenshot inventory manually.
5. Decide whether the next pass is architectural, cue-level, chamber-level, or compositor-level.

If the batch informed a real decision, scaffold the short human note with:

```bash
npm run proof:review-note
```

Then review and classify the run package itself:

```bash
npm run run:review -- --run-id <runId> --review-note <path-to-note>
npm run run:promote -- --run-id <runId> --state reviewed-candidate
```

For signature-moment or playable-scene work, also generate a local still review sheet:

```bash
npm run moment:sheet -- --run-id <runId>
```

Use that sheet for the across-room thumbnail assay and temporal-strip review before making taste claims from memory.

## Practical Note

This workflow is intentionally lightweight.
It is meant to run on the current repo state without adding any new runtime
dependencies or touching the scene, renderer, or audio layers.
