# Motion / Choreography / Camera

Date: 2026-04-15

## Mission

Make motion feel authored in space instead of oscillator-driven on one axis.

## Owns

- 6DoF locomotion phrasing
- hero, chamber, and camera travel
- bank, roll, tumble, precession, and arc handoff language
- motion telemetry language for the wave

## Does Not Own

- palette policy
- shot-class policy
- renderer policy
- audio thresholds

## Success Looks Like

- slow ambient passages still move with intention
- the hero no longer reads like a body on rails
- chamber and camera carry enough spatial change to broaden the frame
- camera roll appears only when the cue earns it

## 2026-04-15 Hero Follow-Up

- The hero now follows `heroEnvelope.laneTargetX/Y` materially instead of only inheriting `heroStageX/Y` bias.
- `updateLocomotion()` now injects lane-driven travel into the hero target pose, and `updateHero()` now uses a stage-tour blend between cue bias and framing lane target.
- The hero morph path now includes discrete geometric silhouettes blended into the existing organic deformation path: cube, pyramid, octa/diamond, and prism forms.
- The next proof pack should verify that upbeat material no longer parks the hero in the upper-left and that the hero covers all four stage quadrants over a short scenario pack.

## 2026-04-15 Jambox Follow-Up

- The first discrete-form pass still collapsed too often into a mushroom-like silhouette because the hero was averaging all form weights together and the square-pyramid branch kept winning the blend.
- `updateHero()` now keeps a held primary form plus a lighter accent form instead of normalizing every shape into one composite. The live vocabulary is now orb, cube, pyramid, diamond, prism, shard, and mushroom.
- The mushroom read is now intentional and occasional. It is no longer the accidental default for upbeat matrix material.
- The next proof pack should verify visible object identity changes over one upbeat section: at least three hero silhouettes should read as distinct from across the room without the hero collapsing back into one cap-and-stem shape.

## 2026-04-15 TimeStretch Follow-Up

- The TimeStretch captures confirmed that movement variety was still getting flattened by narrow travel envelopes and repeated chamber/camera posture, even after the first 6DoF pass landed.
- `updateLocomotion()`, `updateHero()`, and `updateCamera()` now read a shared scene-variation profile that widens roam, roll, travel amplitude, and look offsets when the cue earns it. The hero and camera should now spend meaningfully more of the stage instead of resolving back into one centered lane.
- The next proof pack should verify two things together: the hero should cover more screen territory over a short pack, and the camera should present more than one compositional answer for different passages of the same song.

## 2026-04-15 Pressure-Wave Follow-Up

- The center ripple path was still structurally a single flat additive ring with one scalar warm/cool bias, so even when timing felt decent it read as decorative overlay instead of a real stage consequence.
- `buildPressureWaves()`, `triggerPressureWave(...)`, and the pressure-wave branch inside `updateAccents()` now treat each pulse as a small rig: a main wave ring, a volumetric torus edge, and a crossing halo ring with independent tilt, drift, spin, and depth bias.
- Pressure-wave color is now band-authored at spawn time. Low/sub pulses lean solar-yellow-lime, mids lean magenta-violet, and highs lean cyan-blue-white, with only light palette blending layered on top.
- The next live pass should judge three specific things: whether the ripples feel materially more 3D, whether different pulses now read as different spectral events, and whether the center of the stage feels more alive without turning into generic ring clutter.

## 2026-04-15 Ghosts N Stuff Follow-Up

- The Ghosts ’n’ Stuff captures showed that the ripple lane was still over-spending. Instead of reading as stage-centered pressure, it was collapsing into a bright knot of bands wrapped around the hero and staying active almost continuously.
- Pressure-wave triggering now has stronger cadence discipline and style routing. Moment, drop, and macro spawns no longer share the same behavior, and the lane now cools down between events unless a stronger musical handoff earns an override.
- The wave families are now more distinct on screen: low-end events behave like heavier ground swells, mids behave like torsion arcs, and bright/airy events behave like ion-crown rings. The ripple lane also now carries its own center-stage light spill so the event affects the scene, not just the ring mesh.
- The next live pass should specifically check whether the center event reads as an expanding stage consequence instead of a hero-obscuring scribble, and whether the lane now breathes between pulses instead of looking permanently “on.”
