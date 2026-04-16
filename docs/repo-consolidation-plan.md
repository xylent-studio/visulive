# VisuLive Repo Consolidation Plan

Date: 2026-04-07  
Status: Strategic repo-structure reference

This document records the consolidation analysis that led to the current documentation stack. For the active operating brief, use [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md) and [documentation-operations.md](C:/dev/GitHub/visulive/docs/documentation-operations.md).

## Purpose

This document is the repo-level map of what we have, what it means, what is stale, and what needs to become canonical so the project can move forward like a real product instead of a thread of evolving ideas.

The goal is not to erase past thinking.
The goal is to put each artifact in the right place and give the repo one clear operating model.

## The Actual Project History We Need To Consolidate

The repo has gone through five real phases:

### 1. Flagship ambient object phase

Core idea:
- dark luxury
- one flagship scene
- premium ambient listening object
- dignity over spectacle

Canonical artifact:
- [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)

Value:
- still essential
- contains the taste standard
- contains the anti-cheapness rules
- contains the original product thesis

Problem:
- it underrepresents the later big-screen showpiece shift

### 2. Proof-of-spine / room-instrument phase

Core idea:
- make the mic path honest
- prove silence stability
- prove semantic listening
- prove the renderer contract

Canonical artifacts:
- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)

Value:
- still important as implementation truth
- still important as acceptance history
- still important for honest audio behavior

Problem:
- these are now historical foundation docs, not the whole active roadmap
- the names still suggest “phase 0” even though the project has moved materially beyond that

### 3. Room-instrument semantic control phase

Core idea:
- semantic listening frame
- hidden state system
- curated user controls
- runtime truth surface

Where it lives:
- mostly in code
- partially described in [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)

Value:
- active in implementation

Problem:
- not cleanly represented by one current canonical doc

### 4. Big-screen generative showpiece phase

Core idea:
- full-frame participation
- scene-family logic
- macro events
- stage-scale behavior
- showpiece emotional range

Where it lives:
- mainly in code
- partially in thread history
- partially in [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)

Value:
- this is the current product direction

Problem:
- there is no single canonical doc yet that fully replaces the older room-instrument posture with the current “performance system” posture

### 5. Control-truth / consolidation phase

Core idea:
- audit controls honestly
- stop adding random breadth
- simplify control language
- build a director-level tuning workflow

Canonical artifacts:
- [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
- [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)

Value:
- these are the most important current strategic docs

Problem:
- they are decision docs, not yet the full active roadmap

## What We Currently Have

### Direction / vision docs
- [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
- [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)

### Implementation / system docs
- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)

### Evaluation docs
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)

### Control/UX system docs
- [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)

### Operator entrypoint
- [README.md](C:/dev/GitHub/visulive/README.md)

## What Is Canonical Right Now

If I had to name the canonical truth set right now, it would be:

### Product north star
- [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)

### Current strategic decision
- [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)

### Current control truth
- [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)

### Current code truth
- the actual implementation under [src](C:/dev/GitHub/visulive/src)

### Historical but still valuable foundation
- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)

## What Is Out Of Date Or Misleading

### 1. README language

[README.md](C:/dev/GitHub/visulive/README.md) is usable, but it is already partly behind the strategic direction.

Why:
- it still frames the system mainly as a room-first listening instrument
- it does not describe the current control strategy clearly enough
- it does not reflect the show-direction consolidation posture

### 2. Phase-0 naming

[phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md) and [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md) still matter, but their names imply they are the active roadmap.

They are no longer the whole roadmap.
They are now:
- historical implementation baseline
- historical acceptance baseline

### 3. Product charter scope

[product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md) is still valuable, but it is still more “dark luxury flagship ambient object” than “big-screen visual performance system.”

That does not make it wrong.
It means it now needs a follow-on doc above implementation and below thread history.

## What Is Missing

These are the missing canonical artifacts.

### 1. A single active roadmap / program brief

We do not yet have one current doc that says:
- what the product is now
- what phase we are in now
- what we are not doing now
- what the next sequence is now

This is the most important missing doc.

Recommended filename:
- `docs/current-program.md`

### 2. A true show-language brief

We have a product charter and a next-move decision doc, but we do not yet have the final bridging artifact that defines:
- visual grammar
- motion grammar
- emotional arc grammar
- signature moments
- scene-family intent
- anti-goals for the big-screen system

Recommended filename:
- `docs/show-language.md`

### 3. A tuning workflow / replay plan

We know we need deterministic tuning, but we do not yet have a working-plan doc for:
- capture format
- replay format
- scenario pack
- evaluation loop

Recommended filename:
- `docs/tuning-workflow.md`

### 4. A docs index

The repo needs one short map of:
- what each doc is for
- which docs are active
- which docs are historical

Recommended filename:
- `docs/README.md`

## What The Repo Should Look Like Conceptually

The repo should be organized by responsibility, not chronology.

### 1. North star
- product identity
- taste
- non-goals

### 2. Current program
- what phase we are in
- what we are building now
- what the next sequence is

### 3. System truth
- implementation architecture
- audio/render contract
- runtime control model

### 4. Evaluation
- review rubric
- scenario pack
- tuning workflow

### 5. Historical artifacts
- early implementation baseline
- earlier phase-specific docs

## Recommended Consolidation Structure

### Keep and treat as canonical
- [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
- [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
- [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)

### Keep but demote to historical baseline
- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)

### Create next
- `docs/current-program.md`
- `docs/show-language.md`
- `docs/tuning-workflow.md`
- `docs/README.md`

### Update next
- [README.md](C:/dev/GitHub/visulive/README.md)

## Best Working Repo Plan From Here

If I were treating this like a real internal repo and wanted it clean before major new implementation, I would do the following:

### Pass 1: Documentation consolidation

Create:
- `docs/current-program.md`
- `docs/show-language.md`
- `docs/tuning-workflow.md`
- `docs/README.md`

Update:
- [README.md](C:/dev/GitHub/visulive/README.md)

Purpose:
- one active roadmap
- one active artistic language doc
- one active tuning/evaluation doc
- one doc index

### Pass 2: Control-system consolidation

Implement what [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md) recommends:
- rename controls into human language
- regroup them properly
- remove dead abstractions
- add `World Activity`
- add `Color Bias`

Purpose:
- make the product steerable like a real instrument

### Pass 3: Tuning workflow infrastructure

Implement:
- replay capture format
- replay runner
- scenario storage
- documented comparison workflow

Purpose:
- stop tuning by memory

### Pass 4: Director polish pass

Only after the above:
- retune pacing
- retune event spending
- retune macro contrast
- retune background participation
- retune silence and room-tone beauty

Purpose:
- actual quality leap, not random change accumulation

## The Real Best Organizational Move

The best move is **not** to keep accumulating intent in thread history.

The best move is to convert what is now scattered across:
- older product goals
- phase-0 proof docs
- big-screen showpiece direction
- control audit
- next-best-move decision

into one clean working document stack.

That stack should be:

1. product charter
2. current program
3. show language
4. control system audit
5. tuning workflow
6. review rubric
7. README

Everything else becomes either:
- implementation truth in code
- or historical context

## Bottom Line

What we need to consolidate is not just files.
We need to consolidate phases of thought.

The repo currently contains:
- the original flagship object thesis
- the room-instrument proof-of-spine thesis
- the big-screen showpiece thesis
- the control-system truth pass
- the strategic decision about what to do next

All of those matter.
But they should not all compete as if they are the current roadmap.

The correct next organizational move is:

1. preserve them
2. classify them
3. create one active canonical program stack
4. use that stack to govern the next implementation pass

That is how we get back on track with a usable repo, usable docs, and a real plan.
