# Show Direction / Color

Date: 2026-04-15

## Mission

Make palette changes feel authored by act and family, not by momentary twitch.

## Owns

- act selection
- palette-state logic
- palette holds and handoffs
- temporal windows
- cue-family color bias

## Does Not Own

- raw beat detection
- motion solve
- renderer policy
- compositor consequence implementation

## Success Looks Like

- similar musical moments converge on similar color families
- color changes feel deliberate enough to read from across the room
- slow passages can stay varied without turning random
- the show stops falling back to one samey color answer

## 2026-04-15 Hero Follow-Up

- `showDirection.ts` now relaxes the strongest solar-magenta monopoly by reducing `reveal` and `rupture` palette concentration, adding `solar-magenta` fatigue, and softening the left-bias anchor for `matrix-storm`.
- The hero material stack now spends continuous `stageCuePlan.paletteTargets` downstream instead of relying mostly on the active palette-state boolean, so magenta, pink, violet, yellow, acid, blue, cyan, and ghost-white can all read on the hero.
- The next proof pack should verify higher hero hue range and visibly distinct color/style passes across at least one upbeat scenario, not just palette-state changes in telemetry.

## 2026-04-15 Jambox Follow-Up

- The Jambox captures showed that hero color still felt narrower than the semantic palette state, especially under `matrix-storm`, where the shell kept compressing back toward cool cyan/blue and pale white.
- Palette scoring now gives `matrix-storm` more room for `tron-blue`, `acid-lime`, `void-cyan`, and `ghost-white` while still allowing `laser-bloom` to break warmer on real section turns.
- The hero shell and emissive stack now use form-linked color recipes. Cube, prism, shard, diamond, and mushroom spend noticeably different neon mixes instead of all collapsing back into the same cool-biased recipe.
- The next proof pack should verify both breadth and visibility: more distinct hero hue range, and more clearly different hero color personalities from one geometric form to the next.

## 2026-04-15 TimeStretch Follow-Up

- The TimeStretch captures showed that the deeper issue was not only hero hue range. `matrix-storm`, `reveal`, and the same chamber/light grammar were still forcing multiple songs back into the same visual sentence.
- `showDirection.ts` now gives system-audio more genuine escape routes out of the matrix/reveal monopoly, including cooler/whiter matrix recovery palettes, broader act switching, and non-reveal matrix family outcomes. The scene runtime and renderer now also spend more regime-specific color, light, and post-treatment identity so different passages can read as different worlds rather than the same world at different intensities.
- The next proof pack should verify palette novelty at the whole-frame level, not just on the hero: more cool/ghost recovery looks, stronger prismatic and solar breaks, and fewer runs where the chamber, lighting, and post all stay inside one samey neon envelope.

## 2026-04-15 Render Blocker Follow-Up

- The latest diagnosis showed that authored palette and hero-form intent was already reaching the scene, but the visible hero body was still being driven back toward a dark neutral shell after palette application. Human observers were mostly seeing glow variation, not object-body variation.
- `ObsidianBloomScene.ts` now gives the hero shell a much higher body-color authority, shortens live palette spending under high variation pressure, suppresses line/aura dominance just enough for the shell to read, and makes mushroom much rarer unless a true ghost-chamber haunt earns it.
- `listeningInterpreter.ts` also now promotes more structured system-audio grooves from `gather` into `ignite`, so the scene spends stronger mid-level consequence before needing a full detonation.

## 2026-04-15 Emission Follow-Up

- The next captures made the remaining problem explicit: the hero was still reading as a cyan wire shell around a violet core, which meant the render stack was averaging palette choices into one familiar cyan-plus-purple sentence.
- The hero body, core, twins, aura, seam, and ghost layers are now driven by explicit palette-led primary/accent/pulse colors instead of relying mainly on weighted blends across the whole neon set. The hero also now carries dedicated hero-linked point lights so the object itself becomes a real color source in the scene.
- The next proof pass should judge this specifically as a human observer: does the hero itself become red/pink/orange/yellow/lime/cyan/blue/violet/white over time, or does it still read as the same cyan-purple device with different surroundings.

## 2026-04-15 Music-Linked Hero Color Follow-Up

- The render-side hero color path still had one major semantic bug: after the emission pass landed, the swatch selection was still advancing on elapsed time, so the hero could change color even when the music had not earned a new handoff.
- `ObsidianBloomScene.ts` now keeps a held hero-color handoff state. Primary, accent, and pulse colors only reseed on meaningful palette-routing and music cues: act/family/palette handoffs, section turns, strike/release moments, phrase turns, bar turns, and strong tone pivots.
- Tone routing is now explicit inside the handoff logic: low-end dominant material steers toward heavier/warm or dense swatches, mid material steers toward magenta-violet/toxic accents, and airy/bright material steers toward cyan-blue-white spends within the active authored palette family.
- The next live pass should verify the exact intended behavior: the hero should not free-run through colors on a static passage, but it should visibly hand off to new self-emitted color identities when the song changes tone, section, phrase posture, or impact class.

## 2026-04-15 Hero Glow Follow-Up

- The Ghosts ’n’ Stuff captures also showed a read-order problem: even after color variation landed, the hero’s luminous authority was still too easy for the ripple lane to drown out.
- The hero shell emissive, core emissive, aura spend, energy-shell spend, and hero-linked point lights are now all tuned hotter so the hero reads more like a self-emitting object and less like a dim center mass surrounded by brighter event overlays.
- The next live pass should judge this as hierarchy, not only brightness: when a pressure event arrives, the hero should still feel like a powered subject inside the frame instead of disappearing under the event layer.
