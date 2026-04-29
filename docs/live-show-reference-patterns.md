# Live Show Reference Patterns

Date: 2026-04-29
Status: Active reference translation for VisuLive

This document turns real-world live visual practice into engineering rules for VisuLive. It is not a mood board. It exists so future visual work borrows the right lessons: authored systems, performance grammar, readable silhouettes, and proofable scene consequence.

## Source Set

- Moment Factory / Phish at Sphere, Unreal Engine spotlight: https://www.unrealengine.com/spotlights/moment-factory-redefines-live-concerts-with-real-time-visuals-for-phish-at-sphere
- Moment Factory / Phish 2026 Sphere residency: https://momentfactory.com/blogs/news/phish-at-shere-2026
- Sphere Experience / Postcard from Earth technical positioning: https://investor.sphereentertainmentco.com/press-releases/news-details/2023/THE-FUTURE-OF-IMMERSIVE-ENTERTAINMENT-IS-NOW---THE-SPHERE-EXPERIENCE-PREMIERES-TOMORROW/default.aspx
- Anyma / The End of Genesys interview: https://www.grammy.com/news/anyma-interview-new-album-the-end-of-genesys-sphere-performance
- Eric Prydz Holosphere 2.0 case study: https://hive.run/case-study/eric-prydz-holosphere-2-0-at-ibiza-residency/
- Radiohead / Supervoid real-time show note: https://supervoid.tv/work/radiohead/
- Radiohead / Disguise and Notch case study: https://www.disguise.one/en/insights/case-study/radioheads-record-breaking-tour-put-visuals-round-disguise-and-notch
- Chemical Brothers / Smith & Lyall live show page: https://www.smithandlyall.com/home/the-chemical-brothers-live-show
- Chemical Brothers / Marcus Lyall interview summary: https://www.designnews.com/electronics/creating-the-ultimate-audio-and-visual-experience-at-concerts
- Massive Attack / United Visual Artists: https://www.uva.co.uk/features/massive-attack-world-tour-2014-2016
- Amon Tobin ISAM / Communication Arts: https://www.commarts.com/project/22824/amon-tobin-isam
- projectM / MilkDrop lineage: https://projectm-visualizer.org/docs
- projectM preset authoring guide: https://github-wiki-see.page/m/projectM-visualizer/projectm/wiki/Preset-Authoring-Guide
- TouchDesigner concert visual techniques: https://interactiveimmersive.io/blog/touchdesigner-operators-tricks/concert-visual-effects-with-touchdesigner/

## Patterns Worth Bringing In

### 1. Playable Systems Beat Fixed Timelines

Phish at Sphere is the clearest model for VisuLive: build scenes like playable environments, not fixed videos. The useful lesson is not "use Unreal" or "copy Sphere." It is that a show can have authored worlds that adapt to uncertain music while still feeling intentionally directed.

VisuLive translation:

- `PlayableMotifSystem` should keep growing as a small set of authored scenes with stable identity.
- Scene parameters should be few, meaningful, and safe to combine.
- Musical uncertainty should expand or hold a scene, not force random changes.

### 2. Operator Simplicity Requires Internal Rigor

The Phish system needed a console that could be understood by someone other than the engineers. Radiohead's recent live system also prioritizes fully live flexibility over rigid timecode. Both point to the same product rule: the user should not manage internal complexity.

VisuLive translation:

- Proof Mission stays one intent choice, not many capture toggles.
- Moment Lab can expose force/preview controls locally, but public `Start Show` remains simple.
- Agent tools need one-command review outputs, not manual evidence spelunking.

### 3. Distinct Image Classes Matter More Than Effect Count

Anyma works because it has a story-world and major recognizable moments. Chemical Brothers and Prydz work because the viewer remembers large iconic images, not parameter noise. Amon Tobin ISAM worked because the stage surface itself became a transformable sculpture.

VisuLive translation:

- `collapse-scar`, `cathedral-open`, `ghost-residue`, and `silence-constellation` must be thumbnail-readable.
- The five playable scenes must have silhouette identities before adding new scenes.
- "More particles" is not a valid next feature unless it changes image class or authority.

### 4. Start Simple, Then Make It Massive

Chemical Brothers' visual direction emphasizes a small number of elements made big and exciting. That is directly relevant to the user's complaint about random color and shape changes.

VisuLive translation:

- Hold palette base and hero form long enough to read.
- Spend variety on modulation, posture, camera, and consequence inside a semantic chapter.
- Add spectacle by deepening one scene, not by cycling many weak ideas.

### 5. Real-Time Does Not Mean Constantly Changing

Radiohead's no-timecode live setup and Phish's jam-ready scenes are flexible, but not arbitrary. The key is performer-responsive stability: a scene can breathe, evolve, and wait.

VisuLive translation:

- Scene dwell and phase envelopes are core show quality, not anti-variety constraints.
- Hero form switching should remain scarce and motivated.
- Long-form songs like `Strobe` should reveal progression by spatial evolution, not churn.

### 6. Digital Lighting Is Its Own Scenic System

Moment Factory's Sphere work treats digital lighting as a virtual rig, not as bloom afterthought. Sphere's own positioning highlights the fusion of display, sound, and architecture.

VisuLive translation:

- Lighting, particles, rings, and compositor should be routed by authority and scene posture.
- Ring authority must decay unless the scene explicitly owns architecture.
- Safe tier should preserve local saturated color and dark anchors before adding global haze.

### 7. Spatial Sound Lessons Still Apply Without Spatial Audio

Sphere's audio system can target different locations, but VisuLive can still borrow the composition idea: different musical sources or regimes should appear to occupy different visual zones.

VisuLive translation:

- Bass/drop pressure can bias void, scar, and chamber floor.
- Shimmer/high-frequency material can bias portal seams, constellation fields, and rim accents.
- Release tails should move to residue/memory instead of triggering fresh impact.

### 8. Narrative Does Not Require Literal Characters

Anyma uses literal lore and characters. VisuLive should not copy that directly yet. The portable lesson is act-level transformation: beginning, rupture, memory, and future-facing reveal.

VisuLive translation:

- Use scene arcs as abstract narrative.
- `ghost-residue` should recall prior impact as memory, not just draw a new decoration.
- `silence-constellation` should feel like a premium interlude, not waiting.

### 9. Data Can Be Content When It Has Meaning

Massive Attack/UVA use real-time data and typographic systems with topical meaning. projectM/MilkDrop proves that small authored equations can become huge variation when driven by audio variables.

VisuLive translation:

- Analyzer data should feed review and curation, not public telemetry.
- Audio variables need authored grammar: bass/mid/treble, beat, phrase, release, and confidence should map to different visual jobs.
- Future motifs can use local data aesthetics, but only if they strengthen the show identity.

### 10. Projection-Mapped Thinking Helps Browser 3D

Amon Tobin ISAM treated a physical sculpture as the canvas. VisuLive can borrow the mindset without projection mapping: the chamber, world, and compositor are the canvas, not just a background.

VisuLive translation:

- Scenes should deform the frame surface, not only the hero mesh.
- Camera-space masks and post cuts are legitimate scenic architecture.
- The hero can be embedded, hidden, fractured, or demoted when the scene owns the frame.

### 11. Trigger Envelopes Beat Raw Thresholds

TouchDesigner practice often uses trigger envelopes, counters, and audio/MIDI-derived events instead of direct noisy threshold mapping.

VisuLive translation:

- Every major event needs `arm -> precharge -> strike/open -> hold -> residue -> clear`.
- Rhythmic counters can safely add detail inside a scene without changing scene identity.
- Capture should mark precharge, peak, residue, and missed opportunities separately.

### 12. Proof Has To Review Time, Not Single Frames

The strongest references are memorable because they develop. A single still cannot prove phrase logic, aftermath, or scene stability.

VisuLive translation:

- Use contact sheets for across-room recognition.
- Use temporal strips for phase arcs.
- Serious proof must include scene dwell, moment spread, style spread, missed opportunities, and aftermath clearance.

## VisuLive Design Rules From This Pass

- Keep the next creative work inside owned systems: `SignatureMomentGovernor`, `PostSystem`, `PlayableMotifSystem`, `CompositorSystem`, `AuthorityGovernor`, lighting, particles, and show direction.
- Do not add another public control surface for reference-inspired work.
- Do not add a new moment until the current four moments and five playable scenes are recognizable.
- Prefer fewer, stronger scenes over a larger weak vocabulary.
- Preserve dark anchors and saturated local color before increasing bloom.
- Use phrase-scale gates for scene, palette, and hero-form changes.
- Add review tooling before judging taste from memory.

## Next Reference-Driven Work Queue

1. Generate Moment Lab receipts/contact sheets for the 5 scene x 4 signature moment matrix.
2. Review across-room thumbnails and temporal strips before serious proof.
3. Run a short `Primary benchmark` canary from a clean inbox.
4. If contact sheets show weak silhouettes, tune `PlayableMotifSystem` before another long run.
5. If temporal strips show weak arcs, tune `SignatureMomentGovernor` and `PostSystem`.
6. If proof still shows random-feeling color or form changes, tune motif/palette/hero arbitration before adding features.
7. If proof holds, deepen music semantics and then move toward memory/compositor expansion.
