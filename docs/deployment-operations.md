# VisuLive Deployment Operations

Date: 2026-04-23
Status: Active maintainer reference

This document defines how VisuLive is hosted, released, and verified.

Its job is simple:

- keep the live hosts recoverable without thread history
- preserve intentional manual releases
- separate trusted public truth from future staging work when staging is actually warranted
- make verification repeatable instead of memory-based

## Release Lane Model

VisuLive currently has one active public release lane:

- `stable`: the trusted public lane, promoted only from proof-backed milestones

It may later have one optional staging lane:

- `frontier`: a future staging lane for rewrite and frontier work, to be provisioned only when the full new version is ready for real external testing on a separate host

It also now has one preserved public archive target:

- `legacy`: a frozen public edition kept runnable for history, reference, and fun

One lane must never masquerade as the other.
Do not reuse the `stable` site as a frontier sandbox.
Do not pretend the frontier host exists before it is intentionally provisioned.
Do not treat `legacy` as a third active product line.

Important distinction:

- `frontier` in anthology or graduation docs is still a valid capability maturity state
- `frontier` as a hosted lane is optional future infrastructure, not current operational truth

## Current Hosting Model

The current live stable site is:

- [https://visulive.xylent.studio](https://visulive.xylent.studio)

The current stable stack is:

- GitHub repo: `xylent-studio/visulive`
- static host: Netlify
- Netlify site name: `visulive-xylent-studio`
- DNS provider: Cloudflare
- public hostname: `visulive.xylent.studio`

The canonical future frontier target shape is:

- public hostname: `visulive-frontier.xylent.studio`
- separate Netlify site: `visulive-frontier-xylent-studio`
- separate Cloudflare DNS record for the frontier hostname

The canonical legacy preserved-edition target shape is:

- public hostname: `visulive-v1.xylent.studio`
- separate Netlify site: `visulive-v1-xylent-studio`
- annotated release tag: `v1.0.0`
- maintenance branch: `release/v1`

Current V1 preservation truth:

- exact source commit: `6f45b8a`
- exact live production deploy: `69e191a1e164309b55b6ff01`
- public legacy site: [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)
- provisional Netlify URL: [https://visulive-v1-xylent-studio.netlify.app](https://visulive-v1-xylent-studio.netlify.app)
- legacy deploy is locked after publication
- GitHub release assets exist for `v1.0.0`
- Netlify-managed TLS is issued for `visulive-v1.xylent.studio`

If the frontier site is not provisioned yet, do not substitute the stable site.
That is not a defect right now.
Provision the second site only when the rewrite is truly ready for real staging use.

If the legacy site is not provisioned yet, do not reuse a moving branch deploy as the preserved archive.
Create the dedicated site and publish an exact preserved artifact.

## Release Philosophy

All production-facing releases remain intentionally manual.

That means:

- GitHub push does not equal deploy
- the active public lane moves only when someone deliberately releases it
- verification should happen before and after deploy
- `stable` promotes from proof-backed milestones only
- `frontier`, when it exists, may move faster, but it still needs explicit verification and visible build identity
- `legacy` is preserved intentionally and should only change for hosting, domain, or critical compatibility repair

Do not treat missing GitHub-to-Netlify auto deploy as a defect unless the owner explicitly changes policy.

## Promotion Gates

Every milestone should be judged against:

- `architecture`
- `truth`
- `hierarchy`
- `coverage`
- `taste`
- `operator trust`

`frontier`, when staging is intentionally active, can ship with declared debt against these gates.
`stable` should only promote when the milestone clears them convincingly.

## Release Identity Rule

Every shipped build should expose:

- lane
- branch
- commit
- build date
- proof-pack status

The app already exposes build identity today.
Lane and proof-pack identity are part of the active rewrite target and should become part of the shipped release surface as that code lands.

Until then, record the lane and proof-pack status in the release note for every deploy.

For preserved editions, also record:

- release tag
- maintenance branch
- public archive hostname
- deploy artifact checksum
- release asset list

## Release Prerequisites

Before a release:

1. Use the repo Node version in [.nvmrc](C:/dev/GitHub/visulive/.nvmrc).
2. Confirm you are on the intended commit and intended lane.
3. Push code to GitHub first.
4. Run:

```bash
npm run release:verify
```

`release:verify` defaults to the stable lane and wraps the build with `VISULIVE_RELEASE_LANE=stable` plus `VISULIVE_PROOF_STATUS=proof-pack`. Use `npm run release:verify:frontier` only after a frontier host is intentionally provisioned.

This currently covers:

- strict current-canonical benchmark manifest validation
- tests
- production build
- strict proof-pack generation; any failed proof gate makes the command fail

Stop if it fails.

Before a `stable` promotion, also confirm the intended proof packs, recommendation artifact, and promotion note are current. A historical baseline-only manifest is valid for context, but it is not valid for release verification.

Before a preserved-edition release:

1. Capture the exact live stable artifact from the real deployed site or hosting API.
2. Confirm the exact source commit to preserve.
3. Create the annotated tag and maintenance branch from that exact commit.
4. Package the exact artifact, proof bundle, manifest, and stills.
5. Record the release in [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md) and [preserved-releases](C:/dev/GitHub/visulive/preserved-releases/README.md).

## Deploy Commands

### Stable deploy

After `npm run release:verify` passes:

1. Use the `dist` output produced by `npm run release:verify`, or rebuild with the same stable proof identity if needed:

```bash
node ./scripts/run-with-build-info.mjs --lane stable --proof proof-pack -- npm run build
```

2. Deploy the existing `dist` output to the stable Netlify production site:

```bash
npx --yes netlify-cli deploy --site visulive-xylent-studio --dir dist --no-build --prod
```

### Frontier deploy

Only use this after the frontier site is intentionally provisioned and `npm run release:verify` passes:

```bash
npx --yes netlify-cli deploy --site visulive-frontier-xylent-studio --dir dist --no-build --prod
```

Do not point this at the stable site.

### Legacy preserved-edition deploy

Legacy deploys should use the exact preserved artifact, not a fresh rebuild unless preserving the exact original artifact is impossible.

Preferred workflow:

1. Capture the live production artifact exactly:

```bash
npm run release:capture-live -- --site-id <stable-site-id> --deploy-id <stable-deploy-id> --output-dir preserved-releases/v1.0.0
```

2. Package the preserved edition:

```bash
npm run release:preserve -- --version v1.0.0 --commit <exact-sha> --built-at <exact-build-iso> --dist-dir preserved-releases/v1.0.0/site-dist --notes-file preserved-releases/v1.0.0/release-notes.md
```

3. Deploy the exact preserved `dist` output or downloaded preserved artifact to the dedicated legacy site:

```bash
npx --yes netlify-cli deploy --site visulive-v1-xylent-studio --dir preserved-releases/v1.0.0/site-dist --no-build --prod
```

4. Lock the published deploy in Netlify so later deploy activity cannot silently replace it.

Do not use a branch deploy as the long-term legacy archive.

## Verification Workflow

After deploy, run the smoke check against the intended lane hostname.

Stable:

```bash
npm run prod:smoke -- --url https://visulive.xylent.studio --include-http
```

Frontier, once provisioned:

```bash
npm run prod:smoke -- --url https://visulive-frontier.xylent.studio
```

Legacy:

```bash
npm run prod:smoke -- --lane legacy
```

Then verify in the app itself:

- open the menu
- check the `System` section
- confirm the build label and branch match the intended release
- confirm the lane and proof-pack note match the release record

That build identity is part of the shipped app now and should be used instead of guesswork.

## DNS And Domain

Stable record shape:

- `visulive.xylent.studio` -> CNAME -> `visulive-xylent-studio.netlify.app`

Frontier record shape, once provisioned:

- `visulive-frontier.xylent.studio` -> CNAME -> `visulive-frontier-xylent-studio.netlify.app`

Legacy record shape:

- `visulive-v1.xylent.studio` -> CNAME -> `visulive-v1-xylent-studio.netlify.app`

Cloudflare proxying should stay off by default unless there is a deliberate reason to change proxy posture.

Use the repo helper for Cloudflare DNS writes:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token-with-zone-read-and-dns-write>"
.\scripts\upsert-cloudflare-dns-record.ps1 `
  -ZoneName xylent.studio `
  -RecordName visulive-v1 `
  -Type CNAME `
  -Content visulive-v1-xylent-studio.netlify.app `
  -Proxied:$false
```

After the CNAME exists, bind the Netlify custom domain:

```powershell
.\scripts\set-netlify-custom-domain.ps1 `
  -SiteId 7f3ed811-1292-4c0a-8262-2841ca43325e `
  -CustomDomain visulive-v1.xylent.studio
```

Then verify:

```powershell
npm run prod:smoke -- --url https://visulive-v1.xylent.studio --include-http
```

## Netlify Auth Notes

Netlify CLI auth on this Windows machine may behave inconsistently.

If auth is flaky:

- prefer explicit auth usage for CLI commands
- or use direct Netlify REST calls when appropriate

Never commit tokens or print them in user-facing summaries unless explicitly asked.

## Cloudflare Auth Notes

Cloudflare DNS write access is separate from the read-only Wrangler OAuth currently present on this
Windows machine.

Known limitation:

- `wrangler whoami` may show valid account access while DNS writes still fail
- the current Wrangler OAuth scopes here include `zone:read` but not DNS write permissions
- Cloudflare MCP may also show `Auth required` until the connector is explicitly reauthorized

For DNS changes, use one of these:

- reconnect the Cloudflare connector with DNS write access
- or set `CLOUDFLARE_API_TOKEN` with at least `Zone Read` and `DNS Write` on `xylent.studio`
- or save `email`, `globalApiKey`, and optional `apiToken` in `%USERPROFILE%\.cloudflare\codex-cloudflare-credentials.json`

Do not assume Wrangler OAuth alone is enough for DNS operations.

Supported local private credential file shape:

```json
{
  "email": "you@example.com",
  "globalApiKey": "cfk_...",
  "tokenFactory": "cfut_...",
  "apiToken": "cfut_optional_scoped_token"
}
```

The repo DNS helper will use `CLOUDFLARE_API_TOKEN` first, then fall back to
`CLOUDFLARE_API_EMAIL` + `CLOUDFLARE_GLOBAL_API_KEY`, then finally the local private credential file.

## Maintenance Rules

- do not enable auto deploys as part of routine release work
- do not collapse `stable` and `frontier` onto the same site
- do not treat a missing frontier host as a release defect before staging is intentionally enabled
- do not blur `legacy` into either active lane
- do not commit `dist/`, `.netlify/`, auth material, or local logs
- keep [netlify.toml](C:/dev/GitHub/visulive/netlify.toml) and [public/_redirects](C:/dev/GitHub/visulive/public/_redirects) aligned with host behavior
- update this file when lane provisioning, verification, rollback, preserved-edition policy, or release identity changes materially

## Preserved Edition Checklist

Use this checklist when minting `v1.0.0` or any future preserved edition:

1. capture the exact deployed build identity
2. create the annotated tag
3. create the maintenance branch
4. package exact artifact, proof bundle, and stills
5. create the GitHub Release
6. deploy the preserved artifact to the dedicated legacy site
7. lock the published deploy
8. verify HTTPS and smoke checks
9. update [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)

If custom-domain DNS access is not available from the current environment, stop after the dedicated
legacy Netlify site is live, record the DNS blocker explicitly, and leave the final hostname binding
for the next operator with domain-write access.
