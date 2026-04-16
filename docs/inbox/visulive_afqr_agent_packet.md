# VisuLive AFQR Capture Packet — Full Truth, Full Push

This packet is the next instruction set for the manager / lead agent after the AFQR capture run and diagnosis pass.

It is not a generic encouragement note.

It is a merged directive built from:
- the AFQR system-audio / `webgpu` / `safe` capture
- the current `src` tree
- the weak/strong screenshots from this run
- the prior north-star / flagship direction
- the manager’s own diagnosis pass
- independent review of where the system is actually failing now

---

## 0. Executive truth

The project is no longer mainly blocked by “lack of reactivity.”

It is blocked by **semantic lock-in, bad composition governance, hero overreach, and weak translation from music truth into distinct whole-frame stage behavior.**

The system is reacting.
The system is not yet **staging**.

The biggest current failure is:

> VisuLive keeps interpreting large portions of the song as one dominant consequence family, and then lets the hero break the frame plan while chamber/world remains more declared than delivered.

That is why the telemetry sounds ambitious while the screenshots feel underwhelming.

---

## 1. What this AFQR capture proves

### Track / run posture
- Track: `AFQR.mp3` / “Thunderclap (Original Mix)” by Adventure Club
- Duration: about 4:34
- Source: `System Audio`
- Backend: `webgpu`
- Tier: `safe`
- Quick start: `Music On This PC`
- Preset: `pulse`

### Operator controls used in this run
- sensitivity `0.84`
- inputGain `0.50`
- eqLow `0.58`
- eqMid `0.50`
- eqHigh `0.60`
- framing `0.84`
- energy `0.90`
- worldActivity `0.82`
- spectacle `0.92`
- geometry `0.58`
- radiance `0.72`
- beatDrive `0.86`
- eventfulness `0.78`
- atmosphere `0.80`
- colorBias `0.70`

### Dominant current reality
The capture is badly locked into one state cluster.

Capture summary highlights:
- dominant cue family: `rupture` ≈ **77.7%**
- dominant act: `eclipse-rupture` ≈ **74.6%**
- dominant show family: `portal-iris` ≈ **76.5%**
- dominant world mode: `collapse-well` ≈ **77.7%**
- dominant compositor mode: `flash` ≈ **77.7%**
- dominant residue mode: `scar` ≈ **77.7%**
- dominant palette: `solar-magenta` ≈ **62.9%**

This means the cue system exists, but for this song it is still collapsing too much of the music into one visual verdict.

### Composition / hero failure
The most serious metric is not brightness. It is hero dominance escaping the stage plan.

Capture summary highlights:
- `heroScaleMean`: **2.008**
- `heroScalePeak`: **2.703**
- `stageHeroScaleMaxMean`: **1.386**
- `heroScreenXMean`: **0.838**
- `overbrightRate`: **0.898**

Independent review of the frame telemetry:
- `heroScale > stageHeroScaleMax` in about **83.2%** of frames
- `heroScale > 1.2 * stageHeroScaleMax` in about **77.9%** of frames
- longest `rupture` block: about **91.9s**

This is not a minor overshoot.
This is a structural failure of shot safety and stage governance.

### What the screenshots are telling us
The screenshots from this run line up with the data:
- strongest frames are the darker, smaller-hero frames because they preserve distance readability and negative space
- weak frames are the giant-right-hero / persistent horizontal ring-belt / dense wirefield frames
- chamber/world does not yet reliably read as a real stage actor
- the system often says “world-dominant rupture” in telemetry while the picture still reads “hero close-up inside support scaffolding”

That mismatch is the core problem.

---

## 2. What the manager already diagnosed correctly

The manager’s diagnosis pass correctly identified several critical truths:
- the run is dominated by `surge / detonate / eclipse-rupture / rupture`
- the repertoire is underused
- the `release` path is effectively broken by routing/ordering
- `surge` is too sticky in the conductor
- show-direction is amplifying that lock-in
- the hero is still too large for too much of the song
- the loss of awe is not mainly from a spend governor being too conservative, but from semantic flatness and under-diversified image classes

Treat those findings as confirmed and worth acting on immediately.

---

## 3. Core diagnosis — merged truth

### A. The system is semantically over-locked
Different musical situations are still being interpreted as:
- surge
- detonate
- eclipse-rupture
- rupture
- collapse-well
- flash/scar

That is too much of one family for too long.

The problem is not “no cue layer.”
The problem is:
- the conductor gets sticky
- show-direction boosts the same branch too often
- act-to-cue routing is still too monopolistic
- the scene does not produce enough truly different whole-frame classes even when cues differ

### B. The hero is escaping the plan
The stage plan says one thing.
The actual hero scale/position do another.

That means:
- “max” is not a true max
- downstream multipliers are blowing past planned ceilings
- hero off-center drift is too large
- forward/depth bias plus right-shift plus scale are creating bad big-screen shots

### C. Chamber/world authority is still mostly declarative
Telemetry can say:
- world weight high
- chamber active
- dominance = world

But the image still often says:
- hero first
- chamber support
- wirefield clutter
- midline ring belt as the main structural read

That is not enough.

### D. Public controls and internal runtime ranges are still too compressed
The operator is already running a “hot” profile.
Yet the system is not producing the right stage hierarchy.

This suggests:
- user-facing `0..1` ranges are too blunt
- internal runtime remaps are too compressed
- cue-family-specific internal range control is still underdeveloped
- the system cannot easily move between brooding, architectural, chamber-led, rupture-led, and aftermath-led regimes without collapsing back into one visual tendency

### E. BPM and richer musical routing are still underused
The system has:
- beat phase
- bar phase
- phrase phase
- tempo lock
- tempo density

But literal BPM and richer band-separated musical truth are still not doing enough downstream work.

The show is rhythm-aware.
It is not yet truly groove-aware and phrase-authored enough.

---

## 4. The next phase’s true objective

Do **not** treat the next phase as “do a nicer art pass.”

The objective is:

> Fix stage governance, break semantic lock-in, make chamber/world visibly authoritative, and build richer music-to-stage routing so the system can create multiple distinct image classes across AFQR without losing safe-tier quality.

That is the job.

---

## 5. Required execution order

### Phase 1 — Conductor de-stick
Primary file:
- `src/audio/listeningInterpreter.ts`

Goals:
- reduce resonance carryover dominance
- tighten `surge` hold logic
- reduce how long `detonate` remains the active semantic verdict inside extended high-energy sections
- require fresher evidence for staying in peak postures
- preserve power without permanent “full rupture” interpretation

Specific asks:
1. Reduce sticky carryover that leaves resonance acting like stored authority for too long.
2. Tighten `surge` hold so it depends on fresh impact/phrase evidence, not just saturated confidence.
3. Let energetic sections remain powerful without saying “detonate/rupture” for 60–90 seconds straight.
4. Add or improve tests for:
   - long electronic drops
   - release tails after heavy sections
   - phrase resets that should escape surge/rupture

### Phase 2 — Break act-to-cue monopoly
Primary file:
- `src/scene/showDirection.ts`

Goals:
- remove or weaken hard forcing from act to cue family
- fix the `release` routing bug
- diversify high-energy electronic material into more than one image family
- build intra-surge differentiation

Specific asks:
1. Fix the `afterglow` / `release` ordering issue so `release` is actually reachable.
2. Remove hard or near-hard “if act is eclipse-rupture then cue/family must be rupture” style behavior.
3. Strengthen access to alternatives like:
   - `matrix-storm`
   - `laser-bloom`
   - `reveal`
   - real `release`
   - `reset`
4. Add sub-class behavior inside long peak sections so not every powerful moment becomes the same stage verdict.
5. Add or improve tests around:
   - cue family spread
   - release reachability
   - high-energy track differentiation

### Phase 3 — Make shot safety real
Primary files:
- `src/scene/FramingRig.ts`
- `src/scene/ObsidianBloomScene.ts`
- related telemetry/capture analysis files as needed

Goals:
- hero max becomes a real max
- off-center drift becomes governed
- chamber visibility and frame hierarchy become monitored
- composition safety becomes a first-class system, not just taste

Required new telemetry / analysis fields:
- `heroCoverageEstimate`
- `heroOffCenterPenalty`
- `chamberPresenceScore`
- `frameHierarchyScore`
- `compositionSafetyFlag`
- optional: `ringBeltDominancePenalty`

Specific asks:
1. Ensure `stageHeroScaleMax` remains real even after later multipliers / axis deformation.
2. Add cue-family-specific safe envelopes for:
   - hero scale
   - hero stage X/Y
   - depth bias
   - chamber minimum presence
3. Add capture analysis flags for:
   - prolonged oversized hero
   - prolonged off-center hero drift
   - chamber under-presence during world-dominant cues
4. Make `FramingRig` own more of this, not just pass through.

### Phase 4 — Chamber/world authority pass
Primary files:
- `src/scene/ChamberRig.ts`
- `src/scene/ObsidianBloomScene.ts`
- any scene routing code needed

Goals:
- chamber becomes visually authoritative, not only present
- world-dominant telemetry corresponds to actual world-dominant frames
- stage can change without depending on hero enlargement

Specific asks:
1. Strengthen chamber/world image classes such as:
   - enclosure / cage
   - collapse well that actually reads as environment
   - aperture / iris world openings
   - chamber sweeps
   - architectural laser/field reads
   - chamber-led aftermath residue
2. Reduce persistent “horizontal ring belt + clutter wirefield” as the default strong-energy read.
3. Make at least 3 cue classes produce genuinely chamber/world-led frames.

### Phase 5 — Expand music-to-stage routing
Primary files:
- `src/audio/stageAudioFeatures.ts`
- `src/scene/showDirection.ts`
- any rig input contracts

Goals:
- stop listening to music too generically
- route different musical truths to different stage systems
- use tempo/phase/bands/presence/memory more intelligently

Required control families:
- BPM
- BPM confidence / tempo confidence
- beat phase
- bar phase
- phrase phase
- phrase boundary / phrase approach
- band-isolated hits
- band presence
- band persistence
- short memory / trail / residue-driving history

Recommended band families to start with:
- sub: `20–60 Hz`
- kick/body: `60–120 Hz`
- low-mid drive: `120–300 Hz`
- presence: `1–4 kHz`
- air/chatter: `6–12 kHz`

Required routing direction:
- ChamberRig listens to pressure, phrase, presence, world intention
- HeroRig listens to impact and articulation
- EventRig listens to beat phase, transitions, cue envelope timing
- CompositorRig listens to impact, wipe, residue, aftershock
- FramingRig listens to phrase resets / phrase approach, but under shot safety constraints

Important:
Do not only expose “beat happened.”
Expose continuous musical truths.

### Phase 6 — Decouple public controls from internal stage ranges
Primary files:
- `src/types/tuning.ts`
- related control/runtime mapping code

Goals:
- preserve simple operator controls
- gain stronger internal expressive range
- avoid flattening distinct stage regimes into one compressed runtime envelope

Specific asks:
1. Keep public UI simple.
2. Add internal stage-range mapping per:
   - cue family
   - stage family
   - maybe benchmark/test profile
3. Allow different safe internal regimes for:
   - brood
   - gather
   - reveal
   - rupture
   - release
   - haunt
   - reset
4. Do not require the operator to discover hidden power by maxing sliders blindly.

### Phase 7 — AFQR benchmark recapture
Run the same track again after the above changes.

Treat AFQR as a benchmark track.

Capture checkpoints around:
- airy/drive opening
- first gather/build
- first major rupture
- breakdown/hold
- second gather/build
- second major rupture
- final hold/release

Required review outputs:
- 3 strong stills + 3 weak stills
- cue family spread
- chamber/world dominance notes
- hero scale safety notes
- overbright / washout notes
- before/during/after readability notes
- what changed and why

---

## 6. Acceptance targets for the next AFQR run

These are targets, not sacred forever-values.

### Semantic spread
Current run is too monopolized.
Next run should roughly aim for:
- `surge` under **40–45%**
- `rupture` cue under **50–55%**
- nonzero real `release`
- nonzero real `reset`
- real `matrix-storm` access
- at least **4 clearly different image classes** across the song

### Hero safety
Current hero behavior is too excessive.
Next run should roughly aim for:
- hero exceeding stage max in **far less than 20%** of frames
- rupture `heroScreenX` substantially lower than current mean
- fewer long continuous oversized hero runs
- hero large only when earned

### Stage/readability
Next run should show:
- chamber/world actually taking over during at least some peak sections
- reduced persistent midline ring-belt dominance
- stronger distinction between:
  - gather
  - rupture
  - release
  - haunt
  - reset
- more across-room readable compositions

### Spend / washout
Do not chase intensity by simply brightening.
Aim for:
- lower washout / overbright rate than the current run
- stronger image consequence without global haze

---

## 7. AFQR-specific tuning trial profile to test after structural fixes

This is a trial profile, not the main fix.

Recommended profile range to test for AFQR after conductor / cue / framing fixes:
- sensitivity: `0.82–0.86`
- inputGain: `0.50–0.54`
- eqLow: `0.60–0.64`
- eqMid: `0.48–0.52`
- eqHigh: `0.56–0.60`
- framing: `0.92–0.98`
- energy: `0.82–0.88`
- worldActivity: `0.94–1.00`
- spectacle: `0.94–1.00`
- geometry: `0.62–0.70`
- radiance: `0.46–0.58`
- beatDrive: `0.94–1.00`
- eventfulness: `0.62–0.74`
- atmosphere: `0.50–0.64`
- colorBias: `0.60–0.72`

Reasoning:
- lower radiance / atmosphere should reduce washout and pale fogginess
- higher framing + worldActivity should help chamber/world claim more of the shot
- slightly lower energy/eventfulness can reduce ugly overspend while keeping intensity
- higher beatDrive should help musical lock
- a bit more geometry can help architecture read

Important:
Do not mistake this for the core fix.
If rupture still enlarges and shoves the hero, profile changes alone will not solve the problem.

---

## 8. Explicit anti-goals for this phase

Do **not**:
- add more “cool effect” layers first
- compensate for weak chamber authority by making the hero bigger
- hide composition problems under bloom or haze
- keep the same semantic lock but with different color
- let “world-dominant” remain mainly declarative
- treat BPM as a number to display rather than a timing truth to route
- claim success from one or two pretty stills
- skip fresh AFQR benchmark recapture

---

## 9. Required manager posture

Use multiple subagents with hard ownership again.

Required lanes for this phase:
1. conductor / listening de-stick
2. cue / show-direction diversification
3. framing / shot-safety / telemetry
4. chamber/world authority
5. music-feature routing / band lanes / timing lanes
6. controls/runtime-range redesign
7. capture analysis / benchmark validation

Do not let all of them thrash `ObsidianBloomScene.ts` blindly.
Protect merge order.

Suggested merge order:
1. conductor changes + tests
2. show-direction changes + tests
3. framing/telemetry safety layer
4. chamber/world authority pass
5. music-routing expansion
6. control/runtime-range mapping
7. benchmark recapture + proof pack

---

## 10. The direct manager prompt

Use this as the next lead instruction.

---

You now have a strong truth pass from the AFQR benchmark capture.

Treat this as a benchmark correction phase, not a generic continuation.

The capture proves the current main failures are:
- semantic lock-in (`surge / detonate / eclipse-rupture / rupture` dominating too much of the song)
- release/reset/image-class underuse
- hero scale and position escaping the stage plan
- chamber/world authority being more declared than delivered
- compressed runtime range and underused richer music routing
- insufficient shot safety for a flagship big-screen system

This phase is NOT:
- an orb polish pass
- an effect expansion pass
- a brightness pass

This phase IS:
- conductor de-stick
- cue diversification
- composition safety
- chamber/world authority
- richer music-to-stage routing
- AFQR benchmark recapture

### Required execution order

1. **Conductor de-stick pass**
   - reduce resonance carryover dominance
   - tighten surge hold
   - make detonate decay faster inside long drops
   - preserve power without permanent full-rupture semantics
   - add tests

2. **Show-direction / cue diversification pass**
   - fix release routing / ordering bug
   - weaken act-to-cue monopoly
   - let high-energy sections visit more than one visual family
   - create more than one kind of powerful image
   - add tests

3. **Shot-safety / framing governance pass**
   - make hero max a real max
   - control hero off-center drift
   - define cue-family-safe camera/hero envelopes
   - add composition telemetry + analysis flags
   - move real ownership into FramingRig

4. **Chamber/world authority pass**
   - make world-dominant cues visibly world-dominant
   - reduce persistent ring-belt/wirefield default behavior
   - produce at least 3 cue classes with chamber/world-led frames

5. **Music routing pass**
   - expand stage audio features with stronger band/timing/presence lanes
   - route BPM/phase/phrase/band truth differently to different rigs
   - do not listen to all audio in one generic way

6. **Control/runtime-range pass**
   - keep public UI simple
   - create richer internal stage ranges
   - avoid flattening all strong states into one compressed runtime envelope

7. **AFQR benchmark recapture**
   - same song
   - same source mode
   - same safe-tier posture
   - return proof pack with strong/weak frames and metrics

### Required acceptance targets

Aim for:
- `surge` under roughly 40–45%
- `rupture` under roughly 50–55%
- nonzero real `release`
- nonzero real `reset`
- clear `matrix-storm` or equivalent non-rupture high-energy family
- at least 4 meaningfully different image classes across the track
- hero exceeding stage max far less often than current run
- chamber/world visibly taking over during some major sections
- lower washout / overbright behavior than current run

### Additional instructions

- Do not let the cue layer stay elegant in code but flat on screen.
- Do not let the hero keep overriding the world.
- Do not add more spectacle before fixing shot safety and semantic spread.
- Use AFQR as a real regression benchmark from now on.
- Return your multi-agent plan and start with conductor + show-direction before another major scene art pass.

Proceed.

---

## 11. Bottom line

The current run is valuable because it finally made the real failure visible.

The system is no longer “not reacting enough.”
It is reacting too monotonically and too hero-dominantly.

Fix that first.

Then build the next layer of awe on top of a stage that can actually hold it.
