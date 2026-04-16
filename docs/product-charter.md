# VisuLive Product Charter

Date: 2026-04-08
Status: Foundational north star
Target: Chrome on Windows PC, live microphone and/or PC audio input, real-time premium visual response

This is the foundational product and taste brief.
For current behavior and implementation truth, use [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md) and [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md).

## Mandate

Build a live audiovisual performance system for a desktop browser.

It listens to room sound, computer audio, or both and responds in real time with visual behavior that feels authored, premium, and room-commanding. It must read as a flagship show machine, not a visualizer app, not a shader demo, and not a preset browser.

The standard is dark luxury with stage authority:

- cinematic, not ravey
- authored, not generic
- whole-frame, not center-locked
- alive at idle
- articulate under impact
- selective, not noisy
- coherent enough to feel directed

This is a product with taste and consequence, not a container for effects.

## Product Thesis

The right product is not "music visualization in the browser."

The right product is a living room-scale visual instrument and stage machine that interprets real acoustic life:

- HVAC hum
- keyboard clicks
- desk taps
- speech
- distant music
- glass and metal clinks
- room tone

That requires a different posture from most visualizers. Ambient sound is weak, messy, and irregular. Raw FFT-to-shader mapping will look dead in quiet rooms and vulgar in noisy ones.

The core job is:

1. listen intelligently
2. extract meaningful structure from imperfect sound
3. express that structure with dignity

If the system is visually impressive but acoustically naive, it fails.

## Product Principles

### 1. Silence is part of the product

Silence is not an absence state. Silence is a visual state with its own beauty, breath, and tension.

### 2. One flagship scene first

Do not build mode soup. One flagship scene with conviction is worth more than ten average scenes with options.

### 3. Reaction quality beats reaction quantity

The system does not need to react to everything. It needs to react well to what matters.

### 4. K.I.S.S. in UX, not in craft

The interface must stay minimal. The execution underneath it must not.

### 5. Premium means controlled

No rainbow equalizers, no gamer neon, no gratuitous camera movement, no constant high-energy spectacle, no cheap "look how reactive this is" behavior.

Premium also means black value stays meaningful and event spend feels earned.

### 6. The renderer serves the interpretation layer

The visual engine must consume stable, meaningful audio features. It must not become a dumping ground for DSP guesses.

### 7. Whole-frame authority matters

The hero can be iconic.
It cannot monopolize authorship.

The chamber, environment, residue, and framing must be able to own the picture when the music earns it.

## Non-Goals

This first product is not:

- a DJ tool
- a Winamp successor
- a multi-scene preset browser
- a music-first spectacle engine
- a maximalist generative-art sandbox
- a mobile-first experience

Future expansion can exist, but the first release does not earn that complexity by default.

## Experience Standard

The product should feel like:

- obsidian
- smoked graphite
- dark air
- low light on glass
- restrained metal
- latent pressure
- resonance in space

The product should not feel like:

- EDM graphics
- audio bars
- circles around album art
- rainbow particles
- gamer HUDs
- hobbyist shader toys

## Creative Direction

The first flagship scene is `Obsidian Bloom`.

This is not just a codename. It is the visual and behavioral doctrine for version one.

## Scene Doctrine: `Obsidian Bloom`

### Scene Intent

Create a dark stage image with a strong anchor, an active chamber, and authored residue. It should feel half object, half world: substantial enough to feel physical, open enough to feel like a space.

The scene must remain composed under all input conditions. The viewer should read intention, not parameter mapping.

### Core Composition

- one dominant hero entity, but not the only image authority
- one surrounding chamber/world layer
- one environmental field
- one post/residue layer
- no cluttering secondary objects competing for attention

The visual weight must be allowed to shift by cue. The frame can be hero-led, chamber-led, or residue-led when the music earns it.

### Primary Form

The hero should feel like a hybrid of:

- smoked glass
- dense vapor
- polished mineral
- tensioned membrane

It must not read as a blob, a jelly toy, or a lava lamp.

Recommended behavior:

- subtle internal pressure at idle
- deformation under sustained energy
- crisp local articulation on transients
- occasional brief surface fractures, folds, or glints under sharp impacts

The hero should read as dark mass wrapped in emitted structure, not a softly lit filled sculpture.

### Atmosphere

The surrounding atmosphere should be sparse and spatial.

Think:

- suspended particulate dust
- faint volumetric air
- minimal drift
- trace halos around intense events

The atmosphere supports scale and depth. It does not steal focus.

### Light

Light should feel like it is being released from within the system, not sprayed onto it.

Recommended lighting behavior:

- low base luminance
- internal glow rising with sustained energy
- crisp highlights on transients
- bloom with discipline, never milkiness

### Motion

Motion must feel inertial and deliberate.

The scene should avoid:

- constant oscillation
- random jitter
- perpetual orbit
- "reactive" micro-trembling

Preferred motion language:

- breath
- pressure
- expansion
- recoil
- release
- shimmer only at the edge of activation

### Camera

The camera should be nearly still.

If motion exists, keep it limited to:

- barely perceptible drift
- subtle parallax
- minor depth adjustment during sustained activation

The camera is not a performer.

### Palette

Base palette:

- obsidian
- smoked graphite
- low amber or restrained gold
- deep teal or emerald for cool structure

Accent policy:

- violet or rose can exist only as a rare accent under specific states
- accent color must feel earned, not decorative
- neon spend should be selective, not constant

## Stage Doctrine

The show must be built so the chamber, environment, and residue can take the lead when the cue demands it.

The hero can be iconic.
It cannot monopolize authorship.

Composition, consequence, and pacing matter more than local prettiness.

## Bottom Line

VisuLive should behave less like a reactive object and more like an authored stage machine.

If a change does not move the system toward that outcome, it is probably not the right change.
