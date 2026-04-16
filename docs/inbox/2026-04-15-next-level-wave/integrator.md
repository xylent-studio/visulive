# Wave Integrator / Handoff

Date: 2026-04-15

## Mission

Hold the wave together and keep the lane boundaries explicit.

## Owns

- sequencing
- merge points
- doc updates
- handoff clarity

## Does Not Own

- scene policy
- renderer policy
- audio semantics
- capture analysis implementation

## Success Looks Like

- one clear execution order
- no duplicate policy decisions
- no context loss between the docs packet and the canonical docs
- the next reviewer can see what changed, why it changed, and what must be retested
