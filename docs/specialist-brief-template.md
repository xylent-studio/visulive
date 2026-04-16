# VisuLive Specialist Brief Template

Date: 2026-04-08  
Status: Active delegation template

Use this template whenever VisuLive work is delegated to a specialist subagent.

The goal is to keep specialist work:
- bounded
- comparable
- reviewable
- easy to integrate

## Why This Exists

VisuLive is now too deep for vague multi-goal briefs.

Bad delegation causes:
- overlapping edits
- hidden ownership collisions
- random taste drift
- "improved" work that cannot be judged against evidence

This template forces the brief to say exactly:
- what lane owns the work
- what files are in bounds
- what files are off limits
- what evidence should drive the pass
- how success will be judged

## Template

```md
# Specialist Brief: <Lane Name>

## Mission
- one sentence only

## In Scope
- specific goal 1
- specific goal 2
- specific goal 3

## Owned Files
- [absolute/path/to/file]
- [absolute/path/to/file]

## Forbidden Files
- [absolute/path/to/file]
- [absolute/path/to/file]

## Evidence To Use
- latest inbox captures
- latest capture-analysis report
- specific screenshots
- specific docs

## Constraints
- do not change public controls
- do not redefine renderer policy
- do not change cue semantics

## Acceptance
- concrete signal 1
- concrete signal 2
- concrete signal 3

## Deliverable
- code changes only
- code plus doc changes
- doc-only recommendation pass
```

## Standard Expectations

Every specialist brief should:
- name one lane only
- target one bottleneck only
- include owned files
- include forbidden files
- name the evidence source
- define what "better" means in observable terms

Every specialist brief should not:
- ask for multiple unrelated improvements
- leave ownership fuzzy
- say "edit whatever you need"
- mix rendering, cue semantics, and UX in one pass unless the integrator is doing the work locally

## Good Acceptance Language

Use acceptance criteria like:
- "quiet frames read darker with clearer edge separation"
- "similar drops converge on similar act and palette outcomes"
- "`safe` tier preserves color authority while lowering density"
- "the latest inbox report shows fewer `undercommittedDrop` flags"

Avoid acceptance criteria like:
- "looks cooler"
- "more awesome"
- "better vibes"

## Example Briefs

### Hero Render / Emissive Materials

Mission:
- make the hero read more like dark matter wrapped in emitted seams and rims

Owned Files:
- [C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Forbidden Files:
- [C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)
- [C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)

Evidence To Use:
- latest screenshots in [C:/dev/GitHub/visulive/captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- live inspection frames in [C:/dev/GitHub/visulive/captures/reports](C:/dev/GitHub/visulive/captures/reports)
- [C:/dev/GitHub/visulive/docs/show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)

Acceptance:
- hero no longer reads as a softly filled blob
- seam, rim, and fresnel structure stay legible in quiet and active frames
- active frames spend hotter emitted color without raising whole-frame wash

### Motion / Choreography / Camera

Mission:
- make between-beat movement slower, more intentional, and more structural

Owned Files:
- [C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Forbidden Files:
- [C:/dev/GitHub/visulive/src/scene/showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts)
- [C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)

Evidence To Use:
- latest inbox captures
- latest capture-analysis report
- current live screenshots

Acceptance:
- shell and world drift feel slower between beats
- bar and phrase turns create clearer before and after contrast
- beat strikes spend accents instead of constant full-scene motion

### Evidence / Capture / Analyzer

Mission:
- make the tuning loop stricter and more trustworthy

Owned Files:
- [C:/dev/GitHub/visulive/src/replay/session.ts](C:/dev/GitHub/visulive/src/replay/session.ts)
- [C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs)

Forbidden Files:
- [C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)
- [C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx)

Evidence To Use:
- latest inbox captures
- current report in [C:/dev/GitHub/visulive/captures/reports](C:/dev/GitHub/visulive/captures/reports)

Acceptance:
- each capture maps more cleanly to one musical idea
- corrupt or weak evidence is flagged instead of silently trusted
- the latest report is more actionable for the next retune
