# VisuLive v1.0.0 - First Public Edition

Status: source and artifact captured; legacy archive is live at the final hostname

This preserved edition represents the first public VisuLive release that lived at:

- [https://visulive.xylent.studio](https://visulive.xylent.studio)

It is currently preserved at:

- legacy site: [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)
- provisional Netlify URL: [https://visulive-v1-xylent-studio.netlify.app](https://visulive-v1-xylent-studio.netlify.app)

It should be preserved as:

- a frozen public legacy edition
- a nostalgia/reference build
- a runnable historical snapshot
- not an actively evolving third product lane

## What V1 Was

V1 was the first public VisuLive show machine:

- dark-backed
- neon/emissive
- music-reactive
- one flagship public experience
- still early relative to the anthology-engine rewrite

It matters because it was the first real public form of the product, and it should remain available
to revisit even while the deeper rewrite continues.

## Preservation Intent

The preservation target for `v1.0.0` is:

- exact deployed stable source commit
- exact runnable artifact
- exact proof/evidence bundle available at preservation time
- exact notes for how that edition should be run and remembered

## Captured Release Identity

- source commit: `6f45b8a` (`Improve room mic capture adaptation`)
- maintenance branch: `release/v1`
- annotated tag: `v1.0.0`
- live production deploy id: `69e191a1e164309b55b6ff01`
- preserved legacy deploy id: `69e9a7961c83ffcde4674862`
- live production published at: `2026-04-17T01:49:23.999Z`

## Source Verification Notes

The live production deploy was not git-linked in Netlify, so source provenance was recovered by
matching the preserved live artifact back to local source history.

The deciding evidence was:

- the production deploy timestamp landed within seconds of commit `6f45b8a`
- a clean rebuild of `6f45b8a` on Windows matched the live worker logic exactly after normalizing
  Windows `CRLF` output against Netlify's `LF` output
- the remaining entry-bundle filename difference follows from the worker chunk hash difference, not
  from a source mismatch

## Remaining Follow-Through

Before calling the preserved edition fully complete, finish:

- historical proof-pack and screenshot recovery if those April 2026 assets are found later

## What Changed After V1

After V1, the project moved toward:

- a simpler public `Start Show` surface
- an optional `Advanced` layer
- a deeper anthology-engine ambition
- runtime extraction away from the scene monolith
- stronger proof, graduation, and continuation systems

That later work should not overwrite this edition.
