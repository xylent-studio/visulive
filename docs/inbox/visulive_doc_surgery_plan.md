# VisuLive Doc Surgery Plan

Date: 2026-04-08  
Status: Proposed documentation upgrade plan before the next heavy Codex round

---

## Verdict

Yes.
The project should absolutely give Codex more than it currently has.

But the answer is **not** “more docs” in the generic sense.
The answer is:

- sharper docs
- more specific docs
- fewer vague abstractions
- better reference mapping
- harder acceptance criteria
- clearer separation between canonical truth, aspiration, experimentation, and implementation tasks

The current docs are real and materially better than thread-memory chaos.
But they still leave some high-leverage gaps.

---

## What the current docs already do well

Keep these strengths:

- they frame the project as a performance system, not just a visualizer
- they preserve implementation truth and current phase reality
- they establish an operating model for lead agent plus specialists
- they name the scene monolith as a real structural problem
- they clearly value evidence capture over pure taste arguments

Do **not** throw that away.

---

## What is still missing

### 1. The docs still do not define “incredible” concretely enough

There is strong language around cinematic, authored, spectacle, neon, electric, consequence.
That is good.

But the docs still need more explicit answers to:

- what should a viewer feel at distance?
- what counts as real visual authority?
- what should happen before, during, and after major events?
- what would make the show impressive on a TV at a party, not just interesting on a monitor?

### 2. References are still too shallowly weaponized

The current reference docs name useful tools, but they do not yet translate those tools into enough **stealable principles**.

The project needs reference mapping by:

- composition
- cue logic
- post-processing grammar
- motion language
- screen-space tricks
- staging
- silhouette authority
- darkness / reveal discipline

### 3. The show language is still stronger on tone than on consequences

The docs describe mood and identity well.
They still need a stronger mapping from musical situation to **class of visual event**.

### 4. The current canon still under-specifies image-space layers

The repo is still too centered on scene logic and hero tuning.
The docs should more explicitly elevate:

- event composites
- residue
- screen-space consequence
- chamber-first moments
- whole-frame authority

### 5. The docs do not yet give Codex enough “creative guardrails with engineering handles”

Codex works best when it is handed:

- explicit owned systems
- exact problems to solve
- anti-goals
- concrete acceptance tests
- references by principle

The docs are moving there, but they are not fully there.

---

## Recommended documentation changes

### Keep as canonical backbone

- `current-program.md`
- `project-status.md`
- `agent-operating-model.md`
- `agent-workstreams.md`

These are working and should remain the repo backbone.

### Rewrite / expand significantly

#### `show-language.md`

Keep the spirit, but strengthen it with:

- viewer-distance criteria
- image authority rules
- event classes
- residue rules
- specific anti-goals
- composition laws for large screens

#### `reference-systems.md`

Expand into a real reference atlas with sections for:

- browser/shader-native systems
- live-show systems
- game VFX / boss-fight staging
- music-authored experiences
- concert lighting and laser composition

Each reference should answer:

- what is this good for?
- what principle do we steal?
- what should we avoid stealing?

#### `vision-ledger.md`

Keep it, but make it more disciplined.
Every entry should be tagged as one of:

- `promote soon`
- `test first`
- `open question`
- `rejected risk`

That will stop it from becoming a vague creative graveyard.

### Add new docs

#### 1. `north-star-show-bible.md`

This should become the strongest creative alignment file in the repo.

It should define:

- what VisuLive is truly trying to become
- what it should feel like emotionally
- what “big-screen authority” means
- anti-goals
- viewing-distance rules
- screen-stage philosophy

#### 2. `cue-taxonomy.md`

This should separate:

- detected musical facts
- inferred musical situations
- visual event classes
- allowed consequences
- forbidden spends

This is the missing bridge between conductor and spectacle.

#### 3. `reference-atlas.md`

A practical reference guide that maps outside systems to concrete project lessons.

#### 4. `scene-extraction-plan.md`

A structural file that says exactly how the monolithic scene will be split and why.

#### 5. `acceptance-gates.md`

A simple file with pass/fail gates for:

- big-screen readability
- cue consequence
- dark-value discipline
- whole-frame participation
- consistency across similar moments

---

## A better doc hierarchy

Use this hierarchy:

### 1. Identity / target

- `north-star-show-bible.md`
- `show-language.md`

### 2. Current truth

- `current-program.md`
- `project-status.md`

### 3. Action / execution

- `agent-operating-model.md`
- `agent-workstreams.md`
- `scene-extraction-plan.md`
- `cue-taxonomy.md`

### 4. Learning / calibration

- `reference-atlas.md`
- `vision-ledger.md`
- `acceptance-gates.md`

This gives Codex a much cleaner stack:

- who are we?
- what is true now?
- what system should be built next?
- how will we judge whether it worked?

---

## What should be said more directly in canon

The canon should say these things even more explicitly than it currently does:

### A. The hero cannot remain the whole show

The hero is allowed to stay iconic.
It is not allowed to monopolize authorship.

### B. Reactivity is not the same as consequence

The system should not be praised for firing if the result is emotionally flat.

### C. More tuning is not always progress

If the architecture is boxing the show in, the answer is not more knob work.

### D. The screen is the real canvas

Not the model.
Not the object.
The screen.

### E. Darkness is expensive and should stay valuable

Black is not emptiness.
Black is stored authority.

### F. Residue matters

What remains after a moment is part of the moment.

---

## What to hand Codex next

The next manager prompt should include, in this order:

1. `north-star-show-bible.md`
2. `current-program.md`
3. `project-status.md`
4. `cue-taxonomy.md` or equivalent brief
5. `scene-extraction-plan.md` or equivalent brief
6. `reference-atlas.md`
7. the current lead-agent brief

That order matters.
It gives identity before implementation.

---

## Bottom line

Yes — we should give Codex more.

But specifically we should give it:

- a stronger north star
- a stronger reference atlas
- a sharper cue/consequence grammar
- better acceptance gates
- and cleaner structural docs

That is the difference between “an AI that can code a lot” and “an AI-led engineering pass that actually helps build the thing we want.”
