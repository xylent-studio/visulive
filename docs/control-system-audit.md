# VisuLive Surface Doctrine

Date: 2026-04-29
Status: Active front-of-house and backstage doctrine

This file defines the current public surface truth.

Its job is not to defend old menus.
Its job is to keep the next-version surface coherent while code catches up.

## Core Rule

The show must be compelling before the user touches anything.

VisuLive is not a visual app that becomes good when the operator finds the right sliders.
It is an autonomous show system with optional steering.

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

- `Style`
- `Steer`
- `Backstage`

`Style` owns optional world / look / stance / pool curation.
`Steer` owns a very small set of semantic macro biases.
`Backstage` owns route repair, device selection, recalibration, capture, replay, build / lane / proof / system truth, and diagnostics.

## Public Content Model

The public creative vocabulary is:

- `Show Worlds`: scene grammar, authority tendencies, chamber/world behavior, object and rig families
- `Looks`: palette, material, residue, and post identities
- `Director Stances`: reusable autonomous behavior profiles

These are allowed even while the runtime still shares one flagship engine underneath, but they now belong behind `Advanced > Style`.

What remains disallowed:

- preset soup
- static mode sprawl
- an undisciplined public browser with no authored differentiation

## Public Control Rule

Public controls should be semantic director influences.

They may bias:

- authority
- motion
- color
- consequence
- character

Examples of correct advanced steering semantics:

- `World Takeover`
- `Motion Appetite`
- `Depth`
- `Contrast`
- `Palette Heat`
- `Saturation`
- `Impact Appetite`
- `Aftermath`

Examples of what public controls should not be:

- raw debug values
- one-property locks disguised as creativity
- repair controls
- analyzer knobs

No public control should simply mean:

- set one value and leave the scene there

It should mean:

- make the director more or less willing to behave a certain way when the music justifies it

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

When deciding whether something belongs on the public surface:

- if it should make the autonomous show better, improve the director
- if it is route choice needed before the browser can start listening, it belongs on the start surface
- if it is a semantic bias or optional curation, it may belong in `Advanced`
- if it is setup, repair, replay, capture, or diagnostics, it belongs in `Advanced > Backstage`
- if it is merely exposing implementation debt, it should not become public at all
