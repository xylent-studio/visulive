# Next-Level Wave Packet

Date: 2026-04-15  
Status: Temporary handoff packet

This packet is temporary. It exists so the docs-only wave can survive context loss while the canonical docs absorb the decisions.

## Purpose

The approved wave is:

- stage-led 6DoF locomotion
- act/family-authored palette holds and handoffs
- screen-space consequence that reads harder without adding controls

The wave is meant to break the slow-track samey lock without adding a new scene family or a new public control surface.

## Source Order

Read and update in this order:

1. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
4. [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
5. [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
6. [docs/proof-pack-protocol.md](C:/dev/GitHub/visulive/docs/proof-pack-protocol.md)
7. [docs/proof-pack-workflow.md](C:/dev/GitHub/visulive/docs/proof-pack-workflow.md)
8. [captures/README.md](C:/dev/GitHub/visulive/captures/README.md)
9. [captures/scenario-pack-checklist.md](C:/dev/GitHub/visulive/captures/scenario-pack-checklist.md)
10. [captures/review-note-template.md](C:/dev/GitHub/visulive/captures/review-note-template.md)

## Execution Order

1. evidence baseline
2. show-direction and color authoring
3. motion / locomotion / camera
4. compositor / safe-tier consequence
5. evidence rerun
6. canon update

## Hard Boundaries

- `showDirection.ts` owns act, palette, and temporal-window intent
- `framing-governor.ts` owns shot class, envelopes, cadence, and composition safety
- motion owns locomotion solve, not policy
- renderer owns safe-tier consequence, not show-direction truth
- no new public controls
- no new scene family

## Briefs

- [Integrator brief](./integrator.md)
- [Motion / Choreography / Camera brief](./motion.md)
- [Show Direction / Color brief](./show-color.md)
- [Compositor / Safe-Tier / Screen-Space Consequence brief](./compositor.md)
- [Evidence / Capture / Analyzer brief](./evidence.md)

## Done When

The packet is done when the canonical docs reflect the wave and the next proof pack can be judged without reopening thread history.
