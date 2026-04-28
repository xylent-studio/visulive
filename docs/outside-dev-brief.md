# VisuLive Outside Dev Brief

Date: 2026-04-20
Status: Shareable external review brief

This file is external prompt material.
It is not internal source-of-truth canon.

If this brief conflicts with current repo truth, prefer:

- [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
- [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
- [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
- live code in [src](C:/dev/GitHub/visulive/src)

## Message

We need an outside technical and creative read on VisuLive.

This project has made real progress, but it is not yet where it needs to be. We do not want another round of vague inspiration or another pile of undirected tweaks. We need a serious diagnosis and a real plan for how to get from the current build to the thing we have actually been trying to make.

VisuLive is supposed to become a big-screen generative showpiece: something that can live on a large display and feel authored, alive, reactive, cinematic, and capable of real spectacle. The target is not "a tasteful orb visualizer." The target is a room-scale performance system with consequence, memory, transformation, and musical intelligence.

Right now, the repo is real and the system is real. It runs, it listens, it captures evidence, it has a conductor layer, it has a show-director layer, it has internal acts, it has quick starts, and it has a documented tuning loop. But the output is still not consistently delivering the dream. We have had flashes of the right direction, but not the fully convincing system yet.

We need you to help us figure out what is actually holding us back, what architecture or visual assumptions are wrong, and what the best plan is from here.

## What The Project Is

VisuLive currently:
- runs in Chrome on Windows
- supports microphone input, PC audio input, or both
- is tuned first around `Music On This PC`
- uses WebGPU where available, and the real live posture we keep seeing is `webgpu / safe`
- has one public flagship scene with hidden internal acts
- has an evidence loop with auto capture, replay, and capture analysis

The current repo truth lives in:
- [C:/dev/GitHub/visulive/README.md](C:/dev/GitHub/visulive/README.md)
- [C:/dev/GitHub/visulive/docs/project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
- [C:/dev/GitHub/visulive/docs/current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
- [C:/dev/GitHub/visulive/docs/show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
- [C:/dev/GitHub/visulive/docs/reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
- [C:/dev/GitHub/visulive/docs/vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)

## What We Have Already Done

We have already built more than a toy or a concept.

Current implemented foundation includes:
- semantic listening instead of raw FFT-only scene control
- conductor-style signals like beat confidence, drop impact, section change, release tail, and performance intent
- a hidden multi-act show director
- fullscreen visualization-only mode
- curated quick starts for `Music On This PC`, `Music In The Room`, and `Big Show Hybrid`
- a replay and evidence loop with auto captures, analysis, and quality flags
- a darker glow-budgeted baseline
- emissive-first hero and chamber rendering
- palette-state direction and internal act logic
- slower inter-beat motion windows
- safe-tier-aware tuning

We have also invested heavily in repo truth:
- the docs are real
- the capture lifecycle is real
- the project now has an explicit specialist-agent operating model

## What Improved

These are real gains, not imaginary ones:
- The wireframe and emitted-structure direction is stronger than earlier filled-shell versions.
- The scene can now read darker between events instead of staying permanently washed out.
- The hero has seam, rim, fresnel, and aura logic that is materially closer to the intended electric structure look.
- The palette is less trapped in muted gold/teal than before.
- The system now captures and analyzes live evidence instead of relying only on memory and taste arguments.
- The repo is much more recoverable than it was before.

Historical screenshots that still show a promising direction:
- [live-hero-cool-pass-1.png](C:/dev/GitHub/visulive/captures/reports/live-review/live-hero-cool-pass-1.png)
- [live-structure-pass-1.png](C:/dev/GitHub/visulive/captures/reports/live-review/live-structure-pass-1.png)
- [historical-baseline-live-inspection-2026-04-08.png](C:/dev/GitHub/visulive/captures/reports/historical-baseline-live-inspection-2026-04-08.png)

The strongest current clue is this:
- emitted wireframe, seams, rims, and structural glow feel more correct than the old softly lit blob approach

## What Is Still Not Good Enough

This is the honest part.

The project is still missing the mark in several ways:
- It still does not consistently feel incredible.
- It still does not consistently read as a true neon, laser, Tron-like, electric showpiece.
- The hero still too often falls back into a softly lit, filled object read.
- The framing regressed at points; the image lost some of the stronger composition and alive-in-space feeling it had earlier.
- The overall movement can still feel less alive and emotionally convincing than it should.
- The system sometimes reacts technically without feeling musically or visually satisfying.
- The show is still too often "interesting reactive graphics" instead of "a performance system with consequence."

We have also seen a tension that matters:
- some passes improved color, but hurt framing
- some passes improved darkness, but hurt vitality
- some passes improved wireframe/emitted structure, but the overall system still did not lock into the dream

That means we are not just missing "more tweaks."
We are likely still wrong or incomplete in one or more deeper assumptions.

## Our Current Suspicions

These are not certainties. They are the current best internal suspicions.

We may still be held back by:
- too much reliance on one central hero object instead of a stronger multi-layer stage image
- lighting assumptions that still behave like sculpture lighting instead of show-light logic
- not enough separation between dark anchor, emissive structure, and event composites
- not enough structural consequence on section turns and drops
- a conductor that is better than before but still not authoritative enough for the event spending we want
- a scene monolith that makes coherent iteration harder than it should be
- safe-tier constraints that may still be flattening the output more than we want
- a missing or underdeveloped 2D or screen-space compositing vocabulary
- not enough truly authored choreography between beats, bars, phrases, and drops

We also suspect that we may be too trapped in "improve this scene" thinking when the real answer may be a more radical restructuring of how the show composes itself.

## Where We Need Help

We want you to approach this critically and independently.

Please do not assume the current architecture is fundamentally correct just because a lot of work has gone into it.

We need you to tell us:
- what is actually working
- what is still fundamentally wrong
- what is missing
- what is overbuilt
- what is underbuilt
- what architecture is helping us
- what architecture is boxing us in
- what sequence of work gives us the best odds of real positive movement right now

## What We Want From You

Please produce a real plan, not just impressions.

We want:

1. A diagnosis
- What do you think the actual bottlenecks are?
- What is preventing the system from reaching the intended visual authority?
- What is making the hero/read/composition/color/reactivity underperform?

2. A technical and artistic strategy
- What should we keep?
- What should we stop doing?
- What should we re-architect?
- What should be split into separate systems?
- What should be relegated to later?

3. A prioritized implementation plan
- What should happen first?
- What should happen second?
- What should not be touched until later?
- What changes are likely to create real leverage instead of more local churn?

4. A specialist work map
- How would you split this across focused sub-teams or subagents?
- Which lanes are actually independent?
- Which ones must remain tightly integrated?

5. A stronger reference map
- What other systems, tools, games, light shows, stage choreography models, VJ workflows, or render paradigms should we be studying?
- Which references are useful because of composition, not just because they are flashy?
- Which ones are useful because of cueing, dramaturgy, lighting logic, or motion language?

## What We Specifically Need You To Think Hard About

Please look hard at these questions:

- Are we still trying to make a physically lit 3D object do a job that really needs a hybrid 2D/3D compositing approach?
- Is the hero itself the wrong dominant image grammar?
- Do we need a more radical split between dark mass and emitted structure?
- Do we need more screen-space event layers or post passes?
- Do we need a stronger show cue engine above the current conductor?
- Is the current framing/composition logic too parameterized and not authored enough?
- Are we spending too much effort on reactivity and not enough on choreography?
- Is `safe` tier forcing us into compromises that need a different visual design rather than more tuning?
- Do we need stronger act changes, not just stronger moments inside one act?
- Are we missing a simpler and more iconic image vocabulary?

## References We Already Use

These are already in the repo and are worth retaining:
- [projectM](https://github.com/projectM-visualizer/projectm)
- [Butterchurn](https://github.com/jberg/butterchurn)
- [Resolume Wire FFT / BPM support](https://resolume.com/support/en/wire-fft)
- [Notch working with audio](https://manual.notch.one/1.0/en/docs/learning/working-with-audio/)
- [TouchDesigner Audio Spectrum CHOP](https://docs.derivative.ca/Audio_Spectrum_CHOP)
- [Three.js WebGPURenderer](https://threejs.org/docs/#manual/en/introduction/WebGPURenderer)

## References We Think Need To Be Added Or Considered

Please also think about systems and domains like:
- [Synesthesia docs](https://synesthesia.live/docs)
- [Synesthesia Shader Format](https://app.synesthesia.live/docs/ssf/ssf.html)
- [Unreal Niagara overview](https://dev.epicgames.com/documentation/fr-fr/unreal-engine/overview-of-niagara-effects-for-unreal-engine)
- [vvvv gamma](https://vvvv.org/download/)
- [vvvv gamma 3D graphics / VL.Stride](https://thegraybook.vvvv.org/reference/libraries/graphics-3d.html)
- [vvvv gamma audio](https://thegraybook.vvvv.org/reference/libraries/audio.html)
- [vvvv gamma RenderDoc GPU debugging](https://vvvv.org/blog/2024/introducing-renderdoc-gpu-debugging/)
- [Houdini character and animation tools](https://www.sidefx.com/products/houdini/characters/)

And beyond software, please think about:
- concert lighting cue logic
- laser show composition
- video game VFX and boss-fight staging
- UI and VFX readability in games with strong silhouette and impact language
- music-driven pacing in systems like Rez Infinite, Tetris Effect, Thumper, Control, Returnal, and similar references

We do not need direct copying.
We need better principles and better decisions.

## Practical Repo Truth

Please assume:
- the repo is real and organized
- the docs are worth reading
- the evidence loop is worth using
- the visuals are not "there" yet
- we are open to significant change if it is clearly justified

One important implementation truth:
- [C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) is still too monolithic and may itself be part of the problem

## What Success Looks Like

A good response from you would give us:
- a brutally honest diagnosis
- a clear picture of why progress has been partial
- a practical plan we can execute now
- a smarter reference map
- a recommendation for how to divide the work
- confidence that the next round of work can actually move the project materially forward

## Direct Ask

Please review where we are, think deeply, and give us a real plan for how to get VisuLive to the vision.

We do not need reassurance.
We need the smartest path forward.
