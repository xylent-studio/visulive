# VisuLive Agent Operating Model

Date: 2026-04-28  
Status: Active specialist-agent coordination model

This document defines how specialized agents should work on VisuLive as a system.

The goal is not to maximize the number of agents.
The goal is to make specialist work cumulative, coherent, and testable.

## Core Principle

VisuLive should use:
- one lead integrator
- several bounded specialists

Not:
- a pile of disconnected agents all editing the same giant scene file

The lead integrator is responsible for:
- choosing which lane works next
- defining the brief
- protecting cross-lane coherence
- merging or refining the resulting work
- updating the canonical docs when the truth changes

## Why This Model

The project's blockers are now specialized:
- hero render grammar
- chamber and lighting authority
- choreography and pacing
- conductor certainty
- evidence quality
- operator clarity
- safe-tier fidelity

But the repo still has one major monolith:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

It also still has one major extraction honesty problem:
- [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) is now an explicit frame orchestrator, but [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) remains a compatibility shell for context assembly and unreduced ownership debt

That means parallel specialization is good only if:
- ownership is explicit
- collisions are controlled
- the integrator keeps the whole show language intact

## Specialist Lanes

The active lanes are:
- Hero Render / Emissive Materials
- Chamber And Light
- Motion And Choreography
- Show Direction / Act / Palette
- Conductor And Cueing
- Evidence And Tuning
- Operator UX
- Safe-Tier Performance

The detailed ownership map lives in [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md).

## Collision Hotspots

These files need extra discipline:

### [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Current hotspot for:
- hero render
- chamber and light
- choreography

Rule:
- do not let multiple specialists edit this file in parallel unless ownership is explicitly split by method or zone for that pass

### [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)

Current hotspot for:
- renderer policy
- safe-tier behavior
- bloom and exposure

Rule:
- renderer policy should not be redefined by hero or chamber specialists

### [showDirection.ts](C:/dev/GitHub/visulive/src/scene/direction/showDirection.ts)

Current hotspot for:
- act selection
- palette-state logic
- temporal windows

Rule:
- no other lane should quietly redefine these semantics downstream

### [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)

Current hotspot for:
- conductor certainty
- beat, drop, section, and release logic

Rule:
- visual lanes can ask for stronger cues, but cue semantics still belong here

## What Makes A Good Specialist Brief

A good brief contains:
- one mission only
- owned files
- forbidden files
- what evidence to use
- what "done" means

It should not contain:
- multiple unrelated goals
- vague aesthetic language without acceptance criteria
- permission to edit half the repo "if needed"

Use:
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)

## Acceptance Rule

A specialist pass is only valid if it leaves behind:
- code or doc changes
- a clear explanation of what evidence justified them
- a way to judge success in the next test pass

## Current Integrator Recommendation

For the current repo state, the lead integrator should sequence work like this:

1. Evidence And Tuning
2. Operator UX
3. Governance correction only if fresh proof shows authority, overbright, or ring failures
4. Show Direction / Conductor only if fresh proof shows cue, silence, or diversity failures
5. Signature Moment proof-tuning now that the `PostSystem` vertical slice exists
6. Later visual capability work after proof and ownership are both real

Why this order:
- architecture progress is not enough to justify more creative work
- the active blocker is a valid Proof Mission lifecycle on the current authority/runtime backbone: armed setup, successful audio start, live journal, `Finish Proof Run`, final mission eligibility, and artifact integrity
- the invalid April 28 run is debugging evidence only, not current proof
- broad visual or capability work before proof risks optimizing from stale or invalid evidence; the current user-approved exception is the Mythic Signature Moment Engine vertical slice, which must now be proven before another capability swing

## Immediate Structural Upgrade

The best structural move after signature-moment proof holds is:
- preserve [FlagshipShowRuntime.ts](C:/dev/GitHub/visulive/src/scene/runtime/FlagshipShowRuntime.ts) as the explicit orchestrator
- tune [SignatureMomentGovernor.ts](C:/dev/GitHub/visulive/src/scene/governors/SignatureMomentGovernor.ts) and [PostSystem.ts](C:/dev/GitHub/visulive/src/scene/systems/post/PostSystem.ts) from fresh proof before adding new consequence families
- continue splitting compositor, memory, motion/event/camera, and remaining compatibility context out of [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Until then, use the operating model above as the control system for any specialist work.
