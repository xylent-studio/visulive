# VisuLive Preserved Editions

Date: 2026-04-23  
Status: Active preserved-edition ledger

This document records intentionally frozen public editions of VisuLive.

Use it when you need to know:

- what legacy public edition exists
- where it lives
- what tag and branch define it
- whether it is fully captured yet
- how it differs from active `stable` and `frontier`

This is not a third active development lane.

The rule is:

- `legacy` = frozen public archive
- `stable` = current trusted product
- `frontier` = optional future staging lane once separately provisioned, not a current host requirement

## Preservation Rules

- every preserved edition must have an annotated Git tag
- every preserved edition must have a maintenance branch
- every preserved edition must have a GitHub Release with exact assets
- every preserved edition must have an explicit public hostname if it remains runnable
- preserved editions are read-only by default
- legacy fixes only happen from the edition's maintenance branch

Allowed legacy changes:

- hosting repair
- domain repair
- critical compatibility repair when the app no longer opens

Not allowed by default:

- feature work
- UI modernization
- silent backports from current `stable`
- anthology-engine retrofits

## Preserved Editions

| Version | Status | Tag | Branch | Public URL | Netlify Site | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `v1.0.0` | `live` | `v1.0.0` | `release/v1` | [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio) | `visulive-v1-xylent-studio` | First public preserved edition. Exact source commit resolved to `6f45b8a`, exact live artifact captured from deploy `69e191a1e164309b55b6ff01`, and the preserved archive is live at [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio). Record: [release-record.json](C:/dev/GitHub/visulive/preserved-releases/v1.0.0/release-record.json) |

## Active Preservation Workflow

For the current V1 preservation pass:

1. keep `release/v1` and tag `v1.0.0` anchored to source commit `6f45b8a`
2. keep the exact live artifact preserved from deploy `69e191a1e164309b55b6ff01`
3. keep the dedicated legacy Netlify site deployed from that artifact
4. publish or refresh the GitHub Release assets
5. bind and verify [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)

Use:

- [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
- [preserved-releases/v1.0.0/README.md](C:/dev/GitHub/visulive/preserved-releases/v1.0.0/README.md)
- `npm run release:preserve -- --version v1.0.0 ...`
- `.\scripts\upsert-cloudflare-dns-record.ps1 -ZoneName xylent.studio -RecordName visulive-v1 -Type CNAME -Content visulive-v1-xylent-studio.netlify.app`
- `.\scripts\set-netlify-custom-domain.ps1 -SiteId 7f3ed811-1292-4c0a-8262-2841ca43325e -CustomDomain visulive-v1.xylent.studio`
