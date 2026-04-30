# VisuLive Surface Doctrine

Date: 2026-04-29
Status: Active front-of-house and backstage doctrine

This file defines the current public surface truth.

Its job is not to defend old menus.
Its job is to keep the next-version surface coherent while code catches up.

## Core Rule

The show must be compelling before the user touches anything.

VisuLive is not a visual app that becomes good when the operator finds the right sliders.
It is an autonomous show system. Normal operators should not tune the show into quality; the director should earn quality from the music.

## Surface Model

The canonical surface is:

- `Start Surface`
- `Live Surface`
- `Advanced`

### `Start Surface`

This is the front door.

It should show:

- one primary CTA: `Start Show`
- one required operational choice: `PC Audio`, `Microphone`, or `Combo`
- one small `Advanced` entry

It should not show:

- world browsing
- look browsing
- stance browsing
- pool curation
- steering controls

### `Live Surface`

This is the running-show view.

It should remain canvas-first and minimal.

It may show:

- running state
- active route
- health or trust state
- route recommendation if materially useful
- one `Advanced` entry

### `Advanced`

This is the only optional control layer.

Its internal tabs are:

- `Director`
- `Backstage`

`Director` is read-only during normal operation. It explains current autonomous intent: active scene, image class, motif, palette chapter, ring posture, hero role/form, signature moment, scene age, transition reason, proof state, and why the director made the choice.
`Backstage` owns route repair, device selection, recalibration, capture, replay, build / lane / proof / system truth, and diagnostics.

## Public Content Model

The public creative vocabulary is:

- `Show Worlds`: scene grammar, authority tendencies, chamber/world behavior, object and rig families
- `Looks`: palette, material, residue, and post identities
- `Director Stances`: reusable autonomous behavior profiles

These remain valid internal repertoire definitions. They should not appear as normal-use lockable controls. Hidden development labs may force them for previews and exploratory receipts, but those runs cannot satisfy serious proof.

What remains disallowed:

- preset soup
- static mode sprawl
- an undisciplined public browser with no authored differentiation

## Control Rule

Normal-use controls should not steer the creative show.

The director may still use internal repertoire signals for:

- authority
- motion
- color
- consequence
- character
- world, look, stance, and anchor posture

But these are now internal director vocabulary, not normal operator knobs. If the system needs a semantic bias to become good, improve the autonomous director or add a hidden lab/proof fixture. Do not restore a public tuning desk.

Examples of valid internal director semantics:

- `World Takeover`
- `Motion Appetite`
- `Depth`
- `Contrast`
- `Palette Heat`
- `Saturation`
- `Impact Appetite`
- `Aftermath`

Examples of what must not return as normal-use UI:

- raw debug values
- Style sliders
- Steer sliders
- pool locks
- saved stance pickers
- one-property locks disguised as creativity
- repair controls mixed with creative controls
- analyzer knobs

Hidden localhost/dev labs may force these values for deterministic previews and exploratory receipts. Those receipts are useful development evidence, but they are never serious proof.

## Compatibility Rule

The current code path must not expose:

- quick starts
- legacy preset labels
- older slider labels such as `Wake`, `Intensity`, `Show Scale`, or `World Activity`
- older `Explore` / `Director Deck` / `Backstage` naming
- one broad settings surface instead of the new single `Advanced` drawer

The old `ActivationOverlay`, `SettingsPanel`, quick-dock, and top-chrome surfaces have been removed from source.
`npm run legacy:audit` is the regression guard for this rule.

Old quick-start and preset concepts may remain as internal compatibility data or migration helpers.
They should not reappear as mounted public UI.

## Decision Standard

When deciding whether something belongs on the normal surface:

- if it should make the autonomous show better, improve the director
- if it is route choice needed before the browser can start listening, it belongs on the start surface
- if it explains what the director is doing, it belongs in read-only `Advanced > Director`
- if it is setup, repair, replay, capture, or diagnostics, it belongs in `Advanced > Backstage`
- if it is semantic bias, forced preview, curation, or fixture generation, it belongs in a hidden dev-only lab and must mark the run exploratory
- if it is merely exposing implementation debt, it should not become public at all
