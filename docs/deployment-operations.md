# VisuLive Deployment Operations

Date: 2026-04-16
Status: Active maintainer reference

This document defines how VisuLive is hosted, how releases should be performed, and what must stay true when the production site changes.

Its purpose is simple:
- keep the live site recoverable without thread history
- preserve intentional manual releases instead of accidental auto-deploy
- make Netlify, Cloudflare, and GitHub ownership legible to future maintainers and agents

## Current Hosting Model

The live site is:
- [https://visulive.xylent.studio](https://visulive.xylent.studio)

The current production stack is:
- GitHub repo: `xylent-studio/visulive`
- static host: Netlify
- Netlify account: `Xylent Studios`
- Netlify account slug: `jjdog711`
- Netlify site name: `visulive-xylent-studio`
- Netlify default hostname: `visulive-xylent-studio.netlify.app`
- DNS provider: Cloudflare
- Cloudflare zone: `xylent.studio`
- public production hostname: `visulive.xylent.studio`

## Release Philosophy

The production release model is intentionally manual.

That means:
- a GitHub push does not automatically mean a production deploy
- we do not force a build on every GitHub push by default
- the live site should only move when someone deliberately performs a release
- release validation should happen before the production deploy, not after the damage

Do not treat missing GitHub-to-Netlify auto deploy as a broken setup.
It is the intended operating model unless the owner explicitly changes that decision.

## Canonical Release Workflow

Use this path for normal production updates.

1. Confirm you are in the VisuLive repo and on the intended commit.
2. Push the code to GitHub first so the release has a durable source commit.
3. Run:

```bash
npm run check
```

4. Stop if tests or the production build fail.
5. Ensure Netlify auth is available on the machine.
6. Build a release artifact if needed:

```bash
npm run build
```

7. Deploy the existing `dist` output to the production Netlify site:

```bash
npx --yes netlify-cli deploy --site visulive-xylent-studio --dir dist --no-build --prod
```

8. Prefer passing `--json` when you need machine-readable deploy metadata.
9. Verify both DNS and the live site after deploy.

## Verification Workflow

After a production release, verify all of the following:

1. DNS resolves:

```powershell
Resolve-DnsName visulive.xylent.studio
```

2. HTTP responds:

```bash
curl -I http://visulive.xylent.studio
```

3. HTTPS responds:

```bash
curl -I https://visulive.xylent.studio
```

4. Netlify is the responding edge.
5. The deployed app matches the intended commit and behavior.

If HTTPS fails immediately after a domain change, wait briefly for TLS issuance before declaring the release broken.

## Netlify Auth Notes

On this Windows machine, Netlify CLI auth may look inconsistent:
- a ticket check can succeed
- `netlify status` can still claim you are not logged in
- the token may still already exist in `%APPDATA%\\Netlify\\Config\\config.json`

If the CLI session state is flaky but the token exists:
- prefer passing `--auth` explicitly to `netlify-cli`
- or use direct Netlify REST calls with `Authorization: Bearer <token>`

Never commit auth tokens, copy them into repo docs, or print them in a user-facing summary unless the user explicitly asks for the raw token.

## Domain And DNS Workflow

Netlify owns the production site.
Cloudflare owns DNS for `xylent.studio`.

The normal production record shape is:
- `visulive.xylent.studio` -> CNAME -> `visulive-xylent-studio.netlify.app`
- Cloudflare proxying: off by default for this hostname

Keep the hostname DNS-only in Cloudflare unless there is a deliberate reason to change the proxy posture.

### First Attach Or Domain Repair

If the custom domain must be attached or repaired:

1. Add or confirm the Netlify custom domain on the site.
2. If Netlify requires verification, create the TXT record it asks for:
   - name pattern: `netlify-challenge.visulive.xylent.studio`
   - content: use the current Netlify-provided value, not an old saved value
3. Create or repair the CNAME:
   - `visulive.xylent.studio` -> `visulive-xylent-studio.netlify.app`
4. Wait for DNS propagation and TLS issuance.
5. Verify strict HTTPS successfully returns `200`.

## Maintenance Rules

Keep these rules stable unless there is a deliberate infrastructure decision:
- do not enable GitHub-triggered auto deploy just because it is available
- do not switch to a different host as part of routine release work
- do not commit `dist/`, `.netlify/`, auth material, or generated local logs
- keep [netlify.toml](C:/dev/GitHub/visulive/netlify.toml) and [public/_redirects](C:/dev/GitHub/visulive/public/_redirects) aligned with the intended host behavior
- update this document when the hosting stack, domain workflow, or release policy changes materially

## When To Update Other Docs

If hosting or release workflow changes materially:
- update [README.md](C:/dev/GitHub/visulive/README.md) if the public URL or maintainer entry path changed
- update [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md) if shipped readiness or deployment state changed
- update [docs/README.md](C:/dev/GitHub/visulive/docs/README.md) if doc routing changed
- update this file first when the release workflow itself changes

## Troubleshooting Shortlist

If a release is not healthy, check in this order:

1. `npm run check`
2. Netlify auth validity
3. Netlify site target
4. custom domain attachment on the Netlify site
5. Cloudflare TXT challenge record if domain verification is pending
6. Cloudflare CNAME target and proxy state
7. HTTP and HTTPS headers from the live hostname
8. Netlify deploy logs

Do not change multiple infrastructure variables at once unless the current state is already irrecoverable.
