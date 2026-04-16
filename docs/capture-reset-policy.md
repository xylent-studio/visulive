# VisuLive Capture Reset Policy

Status: Active

This document defines how VisuLive retires old inbox batches without deleting history.

## Purpose

Capture resets exist so the team can start a new tuning cycle without dragging stale evidence forward.

The goal is not to erase history. The goal is to stop treating old inbox batches as current tuning truth.

## Capture Storage Model

VisuLive capture evidence has three useful states:
- inbox: active, disposable, current-cycle evidence
- canonical: curated, approved, reusable reference evidence
- archive: historical batches kept for record and comparison

## Fresh Cycle Rule

1. A new tuning cycle starts with a fresh inbox batch.
2. The fresh inbox batch becomes the only active evidence set for tuning.
3. Older inbox batches stop driving decisions unless they are explicitly promoted to canonical or explicitly reactivated for comparison.
4. Historical material remains available, but it is not the current target.

## How To Treat Stale Inbox Batches

Stale inbox batches must be handled as follows:
- keep them intact
- move them out of the active inbox path
- mark them as stale, retired, or superseded in the capture notes
- ignore them for current tuning unless a lead explicitly calls them back for a comparison question

Do not delete stale batches just because they are no longer useful for tuning.

## When To Archive

Archive a batch when:
- the next retune cycle has started
- the batch is no longer the current evidence target
- the batch still has historical value
- the batch may help explain a change later

Archive is the default retirement path for stale inbox batches.

## When To Promote To Canonical

Promote a batch to canonical only when:
- it clearly demonstrates a useful target state
- it is stable enough to compare against later work
- it has selection notes that explain why it matters
- it is better as a reference than as a transient inbox sample

Canonical batches are reference evidence, not active tuning evidence.

## When To Ignore Old Captures

Old captures must be ignored for tuning when:
- they belong to a previous retune cycle
- their capture conditions no longer match the current question
- they are overfit to a now-obsolete build or router
- they are being used to justify a decision that the latest fresh batch does not support

Ignoring a batch for tuning does not mean deleting it. It means removing it from the active decision loop.

## Reactivation Rule

A stale batch may be reactivated only when:
- the question is explicitly comparative
- the lead states why the old batch is relevant
- the comparison is written down so it does not become accidental drift

If a stale batch is reactivated, it must be marked as a comparison source, not as the current truth.

## Batch Boundary Rule

At the start of a new cycle:
1. declare the fresh batch
2. retire the previous inbox batch
3. archive or canonize the retired batch
4. reset tuning notes so the next pass reads from the new batch only

This keeps the history usable without letting old evidence control the next move.

## Naming And Annotation

Each batch should be annotated with:
- batch status: active, stale, archived, canonical
- capture source
- date or run label
- primary tuning question
- note about whether it is safe to use for current decisions

If the batch is stale, its annotation must make that obvious.

## Stop Condition

Stop using a batch as current evidence when:
- it has been superseded by a fresh capture cycle
- the current work has changed the visual contract
- the batch no longer helps answer the active tuning question

At that point, preserve it, archive it, and move on.

