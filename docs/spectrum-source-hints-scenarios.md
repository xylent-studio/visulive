# Spectrum Source Hints Scenario Matrix

Date: 2026-04-30
Status: Planning simulation for future implementation. No runtime changes made.
Companion doc: `docs/spectrum-source-hints.md`

## Purpose

This matrix predicts how a future `SourceHintFrame` should behave across real show situations. It is intentionally larger than the minimum request: 42 scenarios.

The point is not to prove the feature before implementation. The point is to force the design to survive likely failure modes before code is written.

## Simulation Assumptions

- Hints are private audio-conductor evidence.
- Visual systems never subscribe to raw FFT bands.
- `Music On This PC` earns the highest timing trust.
- `Music In The Room` is more conservative.
- Hybrid mode must guard against double-counted bass, echo, and nearby speech.
- Source hints can strengthen existing conductor fields; they cannot directly trigger signature moments.
- Proof reports must capture both missed opportunities and false positives.

## Scenario Matrix

| # | Scenario | Expected hint behavior | Allowed routing | Failure to catch | Proof cue |
| ---: | --- | --- | --- | --- | --- |
| 1 | Four-on-floor electronic kick, system audio | `kickPulse` high on each hit; `bassSustain` moderate | Strengthen `accent`, `beatConfidence`, bounded chamber pulse | Kick drives signature moments by itself | Pulse aligns with beat without scene churn |
| 2 | Offbeat hi-hat pattern over steady kick | `hatShimmer` high, `kickPulse` stable | Texture/particle shimmer only | Hats escalate impact state | High-frequency motion stays small |
| 3 | Sub-only intro with no drums | `bassSustain` high, `kickPulse` low, `subDrop` low | Presence/body and chamber pressure | Sub sustain is mistaken for repeated kick | No false strikes in intro |
| 4 | Moving bassline without kick | `bassSustain` high with moderate flux | Body, tunnel weight, low motion | Bass notes become drops | Stage remains tactile, not surge |
| 5 | Noise riser before drop | `noiseSweep` rises over 0.4-2.5s | Build tension and aperture opening | Riser triggers early drop | Drop spend waits for impact evidence |
| 6 | Fake drop into silence | `noiseSweep` high, then `silenceAir` high; `subDrop` low | Withhold detonation, route aftermath tension | Fake drop overfires | Analyzer marks withheld hit as correct |
| 7 | Real drop after riser | `noiseSweep` high then `subDrop` and `kickPulse` high | Strengthen `dropImpact` and section hit | Drop reads same as fake drop | Strong hit has source-hint support |
| 8 | Snare/clap fill | `snareSnap` bursts, `kickPulse` intermittent | Small cuts, shards, surface percussion | Fill causes scene churn | Cuts are bounded and rhythmic |
| 9 | Bright synth arpeggio | `tonalLift` and high `presence`, low `hatShimmer` | Palette hold support, lift texture | Arp is mistaken for hats/snare | No hard percussion response |
| 10 | Atmospheric pad, low energy | `tonalLift` or `silenceAir` moderate, low impact hints | Quiet vivid state, memory/air | Show falls dormant too early | Low-energy frame remains readable |
| 11 | Long reverb release after hit | `silenceAir` high, `releaseTail` support | Aftermath, ghost residue, decay memory | Release is treated as new hit | No extra strike after decay begins |
| 12 | Limiter pumping with no clear drums | Broadband envelope movement, low hint confidence | Mild momentum only | Pumping becomes fake beat lock | Confidence stays restrained |
| 13 | Dense maximal chorus | Multiple hints high; overall confidence must arbitrate | Strengthen existing surge only when stable | Every frame becomes maximum spend | Spend breathes with conductor |
| 14 | Quiet breakdown with vocal pad | `vocalPresence`/`tonalLift` possible, low impact | Restraint, human presence, palette stability | Voice pad triggers percussion | No snare/kick false positives |
| 15 | Sudden hard stop | Hints fall; `silenceAir` may rise | Negative space and aftermath | Stop reads as audio failure | Show holds intentional silence |
| 16 | HVAC or room low hum | `bassSustain` maybe low-confidence; `kickPulse` suppressed | Hum warning/diagnostic only | Hum creates body or fake drops | Hum rejection reason appears |
| 17 | Operator speech near mic | `vocalPresence`/speech high; `snareSnap` suppressed | Speech restraint, no major spend | Consonants cause cuts | Speech gate suppresses percussion |
| 18 | Room music at low volume | Hints weak but stable if enough confidence | Conservative presence/texture | Show sleeps despite audible music | Room floor threshold can be tuned |
| 19 | Hand clap in room, not song | `snareSnap` spike, low music confidence | Tiny diagnostic or no show spend | Clap triggers signature event | Music confidence blocks major response |
| 20 | Phone speaker tinny playback | `presence`, `snap`, `air`; weak low hints | Texture and mid presence, less bass body | Tinny audio falsely becomes full impact | Low-end spend stays restrained |
| 21 | Crowd chatter over music | Speech/vocal-like confidence mixed with music | Protect beat/impact if system audio absent | Chatter destroys conductor certainty | Conservative but not dormant |
| 22 | Low-volume bass through speakers | `bassSustain` low/moderate, poor high support | Gradual presence if calibrated | Bass disappears from show | Calibration and noise floor matter |
| 23 | PC audio plus mic speech in hybrid | System hints trusted; mic speech suppresses only speech-like routes | Maintain music timing, block speech cuts | Hybrid speech ruins PC audio response | Source-mode reasons separate |
| 24 | PC audio plus room bass double feed | Bass hints high, echo risk | Clamp low-end authority | Double bass overdrives chamber | Hybrid bass gain is bounded |
| 25 | Display share with wrong source/no audio | Hints near zero | Diagnostics warn source issue | Show invents music from silence | Source warning appears |
| 26 | Clipped input | Broadband high, clipped flag true | Restrain confidence, warn | Clipping reads as massive drop | Clipped reason suppresses spend |
| 27 | Echo/latency in hybrid | Duplicate onsets, smeared flux | Prefer system timing, damp mic hint | Beat confidence becomes unstable | Timing reason identifies hybrid smear |
| 28 | Acoustic guitar strum | `tonalLift`, `presence`, maybe `snap`; low kick | Texture/body without fake drums | Strums become snare hits | No hard cuts unless conductor permits |
| 29 | Piano chords | `tonalLift`, body/presence; transient moderate | Palette/hero lift, restraint | Piano attack becomes drum logic | Musical lift without percussion overfire |
| 30 | Drum solo | `kickPulse`, `snareSnap`, `hatShimmer` all active | Percussion clarity without scene churn | Too many hits produce chaos | Bounded hit density |
| 31 | Hip-hop 808 drop | `subDrop` and `bassSustain` high, kick may be broad | Strong body/drop support | 808 sustain repeats as kick | Sustain and onset separated |
| 32 | Dense rock guitars | High `presence`/`crack`, low reliable hats/snare | Rough texture, not constant snare | Guitars trigger snap continuously | Snap requires onset and decay |
| 33 | Vocal ballad | `vocalPresence` high, low impact | Human presence/restraint; avoid impact | Voice triggers scene churn | Stable act/palette |
| 34 | Ambient drone | `bassSustain` or `tonalLift`, low flux | Slow world/chamber memory | Drone becomes dormant or fake build | Quiet premium state survives |
| 35 | Classical strings swell | `tonalLift`, `noiseSweep` maybe gradual, low percussion | Build and lift without drop assumption | Swell becomes EDM riser/drop | No forced detonation |
| 36 | Metal double-kick | Repeated `kickPulse`, high `crack`, dense | Clamp density, preserve rhythm | Every hit becomes full show spend | Impact density limiter works |
| 37 | Jazz ride cymbal | `hatShimmer` steady, subtle body | Texture shimmer, tempo assist if stable | Ride becomes white-noise sweep | Shimmer remains local |
| 38 | Pop chorus with sidechain | `kickPulse`, `bassSustain`, `tonalLift`, high vocal presence | Chorus lift with stable beat | Sidechain pumping overstates drops | Section support but not every pump |
| 39 | Industrial noise | Broadband roughness, high flux, weak source identity | Rough texture under restraint | Noise becomes constant impacts | Hint confidence differentiates noise |
| 40 | Near silence | All hints low except possible `silenceAir` | Void/aftermath, no false events | Noise floor creates phantom music | Diagnostics show silence gate |
| 41 | Low-end laptop safe-tier performance | Same hints with reduced cost budget | Diagnostics stay lightweight | Feature extraction steals render budget | Measured overhead remains acceptable |
| 42 | Six-minute no-touch proof run | Hints vary by section, reasons stable | Better cue evidence, no public complexity | Long-run drift, fatigue, overreaction | Analyzer shows improved misses/false positives |

## Scenario Reflections

### What These Scenarios Predict

The strongest positive effect will come from disambiguating event shapes:

- Kick-like low onset versus sustained bass.
- Snare-like short broadband snap versus speech consonants.
- Hat-like high rhythmic texture versus hiss.
- Noise riser versus real drop.
- Quiet air/release versus silence or failure.

That maps well to VisuLive because the current system already has higher-level conductor language. The missing piece is not "more knobs"; it is better evidence under the conductor.

### Where The Design Is Most Likely To Fail

The highest-risk cases are:

- Room hum becoming fake low-end body.
- Speech becoming snare.
- Dense rock or industrial noise becoming constant impact.
- Hybrid input double-counting bass.
- Hi-hat shimmer earning too much visual authority.
- Overfitting thresholds to one electronic benchmark track.

These are exactly why source hints should start diagnostic-only.

### What Would Count As A Real Win

A real win is not "the spectrum moves on screen." A real win is:

- Fewer missed real drops.
- Fewer fake drops.
- More believable low-energy states.
- More readable percussion detail.
- Better capture explanations.
- No added public complexity.
- No regression in scene/motif coherence.

## Future Proof Set

When implementation starts, use this as the first proof packet:

1. A `Music On This PC` electronic benchmark with real/fake drops.
2. A no-touch low-energy ambient passage.
3. A room-mic speech and hum stress test.
4. A hybrid double-bass/echo stress test.
5. A genre spread: acoustic guitar, piano, rock, jazz ride, hip-hop 808, dense noise.
6. A six-minute no-touch run to expose drift and overreaction.

The first behavioral pass should be considered failed if it makes the show more responsive but less trustworthy.
