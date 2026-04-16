# VisuLive Cue Grammar

Date: 2026-04-08  
Status: Active bridge between conductor truth and visual consequence

This document defines how musical facts become visual cues.

It exists to prevent the show from collapsing into one generic reactive continuum.

## What this doc owns

This doc owns:
- cue classes
- cue state
- cue envelopes
- cue budgets
- consequence routing
- cue-level aftercare

This doc does not own:
- raw audio detection
- conductor certainty semantics
- scene-specific implementation details
- renderer policy

## Bridge Rule

Conductor truth is not the final artistic decision.

The conductor tells us what happened.
The cue layer decides what class of visual event that deserves.

That means a detected musical moment should be translated into:
- an event class
- an intensity envelope
- a duration posture
- a chamber participation level
- a screen-space spend level
- a residue expectation

## Cue Classes

The initial cue vocabulary should stay small and reusable.

Recommended classes:
- `gather`
- `tighten`
- `reveal`
- `fan-sweep`
- `orbit-widen`
- `laser-burst`
- `rupture`
- `collapse`
- `hold`
- `recovery`
- `residue`
- `haunt`

## Cue State

Each cue should carry a small state object with:
- `cueClass`
- `confidence`
- `intensity`
- `attack`
- `hold`
- `release`
- `tail`
- `budget`
- `chamberWeight`
- `heroWeight`
- `screenSpaceWeight`
- `residueWeight`

## Cue Envelope

Envelope is not just audio ADSR copied into visuals.

It is the authored lifespan of the visual event.

At minimum, the cue envelope should answer:
- how early the frame begins to gather
- when the event peaks
- how long the event is allowed to hold authority
- how the event decays
- what memory or stain remains after the peak

## Cue Budget

Budget means visual spend, not CPU budget.

The budget should control:
- bloom spend
- flare spend
- motion spend
- chamber activation
- hero emphasis
- residue duration
- screen-space distortion

If a cue has no budget, it is just noise with a name.

## Consequence Rules

Cue classes must change the frame, not only the object.

Examples:
- `gather` should tighten scale, timing, and negative space
- `reveal` should widen composition and expose architecture
- `fan-sweep` should give the chamber a directional read
- `rupture` should spend hard in screen-space consequence
- `collapse` should reduce volume and leave visible aftermath
- `haunt` should make the frame remember the prior event

## Priority Rules

When cues conflict:
- phrase-scale cues outrank instant flicker
- chamber authority can outrank hero emphasis
- residue can outrank fresh brightness
- safe-tier discipline outranks premium-only flourish

## What This Layer Is For

This layer exists so similar musical situations can resolve into similar visual classes.

It should make the show feel authored, repeatable, and legible.

It should not make the show feel rigid or over-programmed.

## Bottom Line

The cue layer is the translation layer between listening and spectacle.

Without it, the project keeps solving the art too locally.
