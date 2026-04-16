# VisuLive: The Real Best Next Move

Date: 2026-04-07  
Status: Strategic decision reference

This document records the strategic decision that led to the current consolidation direction. For the active operating brief, use [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md).

## Purpose

This document answers one question:

What is the best thing to do next if the goal is not just "more features" or "more sliders," but a materially better showpiece?

This is the decision pass after:
- the premium-object phase
- the room-instrument phase
- the big-screen showpiece phase
- the control audit

The answer is not "keep adding." The answer is to tighten the system at the right level.

## Where We Actually Are

The project is no longer a raw prototype.

It already has:
- a real browser audio path
- a semantic listening interpreter
- show-state logic
- macro event logic
- a full-frame scene
- a meaningful control surface
- input selection and audio shaping
- diagnostics and guardrails

That is good.

But the quality bottleneck has moved.

The bottleneck is now **authorship and clarity**, not missing capability.

### Current strengths

- The system can already do interesting things.
- The visual world has tone.
- The full-frame show language is starting to exist.
- Several controls are real and useful.
- The scene is no longer just a polite center-object study.

### Current weaknesses

- The control model is still too prototype-like.
- Some exposed controls overlap or read as implementation language.
- Some runtime abstractions are dead or weak.
- The scene is still one big weighted super-scene rather than a truly authored performance system.
- We are still tuning too much by feel and memory instead of repeatable evidence.
- The system is rich enough now that random improvement will start making it worse.

This is the point where undisciplined iteration becomes dangerous.

## The Real Diagnosis

The project does **not** mainly need:
- more sliders
- more scene families on paper
- more macro events on paper
- more tiny visual details
- more "reactivity"

The project **does** mainly need:
- a stronger artistic control model
- a cleaner public control system
- a better tuning workflow
- more deliberate authorship at the director level

That is the actual leverage.

## The Real Best Next Move

The best next move is a **Show Direction Consolidation Pass**.

That means:

1. stop adding broad new behavior for one pass
2. simplify and rename the control system into human language
3. remove dead or weak abstractions
4. add only the two strongest missing artistic levers
5. build a repeatable tuning workflow so future changes are judged, not guessed

This is the move that will make the next output better than a generic "keep improving it" cycle.

## What This Pass Should Do

### 1. Reduce the control system to the levers that actually matter

The current system is partially good but still too many semi-overlapping controls.

The public-facing control model should become:

### Quick controls
- `Preset`
- `Wake`
- `Intensity`
- `Composition`
- `Show Scale`

### Full menu: Show
- `Structure`
- `Glow`
- `Rhythm`
- `Event Rate`
- `Atmosphere`
- `World Activity`
- `Color Bias`
- `Accent Bias`

### Full menu: Audio
- `Microphone`
- `Input Trim`
- `Low Bias`
- `Mid Bias`
- `High Bias`
- `Recalibrate`

### Full menu: System
- `Fullscreen`
- `Quality Tier`
- `Diagnostics`
- `Reset`

This is enough.

### 2. Remove or fix dead runtime concepts

Right now these are not earning their keep:
- `musicFocus`
- `glow`

They exist in the tuning model, but they are not first-class meaningful controls in the shipped behavior.

Decision:
- either wire them into real logic
- or remove them

Best choice:
- remove them now unless there is a strong artistic reason to make them real

The system should not carry decorative abstractions.

### 3. Add the two strongest missing artistic levers

Do **not** expose ten more controls.

Add these two:

#### `World Activity`

What it should do:
- control how much the environment/chamber/background participates versus the hero object

Why it matters:
- this is one of the most important visual distinctions in the whole product
- it directly answers the "too much center blob / not enough whole-screen participation" problem

#### `Color Bias`

What it should do:
- bias the world toward warm gold / cool teal / spectral violet emphasis

Why it matters:
- color personality is one of the highest-value aesthetic levers
- it gives meaningful experimentation without cheapening the system

These two are better additions than most other ideas currently on the table.

### 4. Build a replay-based tuning workflow

This is the part most people skip and then regret.

The current system is driven by room audio.
That means tuning by memory is unreliable.

We need a deterministic tuning loop:

- record normalized listening frames or feature streams
- save scenario captures
- replay them into the renderer without live mic
- compare changes against the same material

At minimum, create canonical replay scenarios for:
- silence
- room tone
- HVAC
- speech
- taps
- clinks
- low room music
- medium room music

Why this is the best next move:
- it lets us tune show behavior on purpose
- it prevents "felt better yesterday" nonsense
- it makes artistic decisions testable
- it allows composition and pacing work without needing a live room every time

This is one of the highest-leverage improvements we can make.

### 5. Add a real director layer bias, not more scene sprawl

The next artistic improvement should not be "invent five more scenes."

It should be a stronger director-level policy over the existing system.

Add a small set of top-level authored biases such as:
- `macroContrast`
- `worldActivity`
- `idleTension`
- `sceneBias`

Even if some remain internal at first, this is the correct direction.

Because the real problem now is not raw capability.
It is that the system needs to choose more intentionally.

## What We Should Not Do Next

Do **not** do these next:

- add a dozen more controls
- add more scene families before clarifying the current ones
- add more random macro events
- add more post-effects just to make it feel richer
- keep tuning only by live room trial and error
- keep carrying internal names into the public UI

All of those are plausible.
None of them are the best next move.

## The Core Reframe

The right way to think now is:

This is no longer a graphics prototype that needs more capability.

It is a performance instrument that now needs:
- editing
- authorship
- repeatability
- clearer operator language

That is a very different phase of work.

## The Actual Highest-Leverage Sequence

If we want the best possible outcome, the next sequence should be:

### Step 1: Control simplification pass

- rename public controls into human language
- regroup them into quick / show / audio / system
- remove or hide weak/dead abstractions
- keep the number of public levers disciplined

### Step 2: Add `World Activity` and `Color Bias`

- these are the highest-value new artistic controls
- they solve real visual problems
- they improve experimentation without increasing chaos too much

### Step 3: Build replay harness / scenario capture

- make the system tunable against repeatable material
- stop relying on memory and ad hoc room conditions

### Step 4: Director polish pass

With the control system cleaned up and replay working:
- tune macro contrast
- tune event spending
- tune hush / atmosphere / surge / aftermath pacing
- tune background participation
- tune composition across the scenario pack

That is how we make it materially better.

## What "Better" Means From Here

Not:
- more animated
- more complicated
- more parameterized

Better means:
- clearer from across the room
- more distinct in its emotional states
- more controlled under silence
- more satisfying under music
- easier to steer without confusion
- easier to tune without guesswork

## Final Decision

The best next move is:

**Stop broad expansion and do a show-direction consolidation pass.**

That pass should:
- simplify and rename the control system
- add `World Activity` and `Color Bias`
- remove dead control abstractions
- create a replay-based tuning workflow
- then retune the show with repeatable evidence

That is the move most likely to produce a genuinely better result, not just a busier one.
