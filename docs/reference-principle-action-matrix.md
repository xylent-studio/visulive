# VisuLive Reference Principle Action Matrix

Date: 2026-04-08  
Status: Reference-to-implementation bridge

This doc converts the current reference canon into concrete lane-level actions for VisuLive.

It is not a moodboard. It is a working map for implementation.

## Historical image read

The historical April 8 screenshot baseline and report read as:
- a center-led cyan/electric hero with strong structural promise
- chamber geometry and beam language that is moving in the right direction but still not fully dominant
- frame-wide translucent structure that suggests stage scale, but not yet full stage authorship
- better darkness and emitted structure than earlier soft-shell versions

That means the next push should not be hero polish first.
It should be cue-authored stage composition with chamber and screen-space consequence.

## How to use this matrix

For each lane:
- steal the principle
- turn it into a concrete behavior
- keep anti-copy guardrails active
- stop when the frame class is distinct enough at distance

## Lane matrix

### Cue

What the references teach:
- grandMA3 cue sequences, timing hierarchy, and phaser thinking
- Notch-style separation between live input and performance consequence
- TouchDesigner/Timer CHOP style timed process thinking
- Resolume-style modular cue routing

Concrete VisuLive actions:
- keep the typed `VisualCueState` as the bridge between conductor truth and stage consequence
- make cue classes name the visual event, not just scale it
- give every cue an envelope: gather, spend, hold, decay, residue
- require cue classes to choose a dominant participation profile across hero, chamber, screen-space, and aftermath
- bias repeated musical situations toward repeatable visual archetypes instead of one generic response

Anti-copy guardrails:
- do not copy lighting-console UX or patch-graph UI literally
- do not let cue logic become a second audio detector
- do not collapse all cues into one transition amount

Failure pattern this lane should reduce:
- empty novelty without consequence
- one-house-style cue answers

What this lane is still missing:
- a few more distinct cue families that are visually separable at a distance
- research on how much cue state should persist across phrase boundaries versus reset

### Chamber

What the references teach:
- laser systems, Niagara emitters, and staged world-building all treat architecture as an actor
- world-scale systems can own the frame when the cue earns it
- beam, fan, aperture, vault, lattice, and collapse logic can be a show language

Concrete VisuLive actions:
- make the chamber capable of chamber-dominant frames, not just background motion
- author cue classes that widen, compress, cage, sweep, or open the space
- let ring systems, beam planes, halos, and field geometry become the main read on selected cues
- make chamber behavior visible in silhouette from across the room
- use chamber scale and negative space as a dramaturgical tool, not a cleanup pass

Anti-copy guardrails:
- do not turn the chamber into decorative support geometry
- do not make every chamber change a motion increase
- do not rely on hero brightness to make the room feel active

Failure pattern this lane should reduce:
- decorative chamber
- hero monopoly

What this lane is still missing:
- a stronger chamber supremacy taxonomy
- research on how to express laser-show precision without borrowing sterile laser-demo aesthetics

### Compositor

What the references teach:
- Disguise-style compositing layers and masks
- AfterImageNode / residue logic
- the idea that major events should change the image itself
- black-value discipline from high-end show systems

Concrete VisuLive actions:
- keep screen-space consequence selective and cue-driven
- use afterimage, stain, flare, wipe, and ghost layers only when the cue class earns them
- make rupture and aftermath visually different from gather and reveal
- let residue persist long enough to read, then get out of the way
- use subtraction, occlusion, and localized burn instead of only additive glow

Anti-copy guardrails:
- no permanent haze
- no always-on smear
- no uniform bloom fog
- no compositor behavior that hides weak composition

Failure pattern this lane should reduce:
- fake escalation by brightness
- permanent residue

What this lane is still missing:
- research on directional wipe language and whether it should live in scene-owned event geometry or renderer policy
- better proof of how much residue is still readable on `webgpu / safe`

### Framing

What the references teach:
- big-screen composition depends on silhouette, distance readability, and layer dominance
- the frame must be readable across the room before micro detail matters
- chamber, hero, residue, and accent need to trade dominance deliberately

Concrete VisuLive actions:
- design every major cue around a whole-frame class, not just an object pose
- make the frame read as gather, spend, rupture, aftermath, or reset from distance
- use negative space, off-center authority, and edge participation to stop the image from feeling center-locked
- allow the chamber to outrank the hero when the cue class calls for it
- require new passes to pass a distance test, not just a close-up detail test

Anti-copy guardrails:
- do not use center-lock as the default compositional habit
- do not confuse busy peripheral motion with better framing
- do not let detail steal the frame from silhouette

Failure pattern this lane should reduce:
- strong metadata with weak visible change
- center-locked hero framing

What this lane is still missing:
- a simple, explicit distance-readability rubric for captures
- more research on stage-wide wipe and reveal composition

### Safe-tier

What the references teach:
- the best systems still stay readable under constrained budgets
- architecture should survive without premium-only tricks
- control/data separation matters more when resources are tight

Concrete VisuLive actions:
- treat `webgpu / safe` as production truth, not degraded fallback
- validate every new image idea first in safe-tier framing and post budgets
- keep the cue layer expressive even if the compositor has to become more selective
- prefer a few highly legible spends over dense premium-only layering
- ensure chamber authority survives when particle and post budgets are trimmed

Anti-copy guardrails:
- do not prototype only in premium conditions
- do not assume expensive post is the core answer
- do not design premium-only spectacle that collapses into flatness in safe-tier

Failure pattern this lane should reduce:
- safe tier treated like a degraded fallback
- premium-only image design

What this lane is still missing:
- empirical thresholds for when residue stops being readable on safe-tier
- a clearer list of which compositor ideas must be redesigned instead of merely reduced

### Hero

What the references teach:
- the strongest hero forms are iconic, emitted, and structurally legible
- dark mass plus seam/rim/cavity is stronger than filled-shell glow
- the hero should support stage meaning, not absorb it all

Concrete VisuLive actions:
- keep pushing emitted structure, seams, membranes, and cavity reads
- reduce hero responsibility when the chamber or compositor can carry the cue
- use the hero as one actor in the system, not the system itself
- make the hero a structural anchor for the frame, not the only source of consequence
- let the hero disappear into the world on some cues and re-emerge on others

Anti-copy guardrails:
- do not return to soft blob lighting
- do not let the hero monopolize every important frame
- do not solve chamber weakness by making the hero louder

Failure pattern this lane should reduce:
- hero monopoly
- softly lit blob regression

What this lane is still missing:
- a stronger split between hero as icon and hero as emitted structure
- research on how far the hero can demote without losing identity

## Highest-value extracted principles

1. Cue hierarchy matters more than raw reaction count.
2. The screen must remember what just happened.
3. The chamber must sometimes own the frame.
4. Dark value is a feature, not an absence.
5. Safe-tier has to remain authored and premium.
6. Distinct cue classes must produce distinct image classes.
7. The hero should stay iconic but stop carrying the whole show.
8. Composition beats local prettiness when the goal is across-room authority.

## Principle gaps that still need research

- how to express stage-wide wipes and directional energy without overcomplicating the compositor
- how to measure distance readability in a simple, repeatable review pass
- how to make residue survive safe-tier without becoming haze
- how much chamber dominance the show can sustain before hero identity weakens
- which cue families still need stronger visual separation at the level of silhouette and space

## Bottom line

The reference canon is now usable as an implementation map.

The next risk is not lack of references.
The next risk is under-converting principles into concrete stage behavior.
