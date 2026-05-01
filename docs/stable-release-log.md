# VisuLive Stable Release Log

Date: 2026-05-01
Status: Active release record

This log records deliberate moves of the stable public site:

- production hostname: [https://visulive.xylent.studio](https://visulive.xylent.studio)
- Netlify site: `visulive-xylent-studio`
- release policy: manual production deploys only

## 2026-05-01 - Override Deploy

- deploy status: published
- production deploy id: `69f53c39ecbd5fa2f4e12a5b`
- production URL: [https://visulive.xylent.studio](https://visulive.xylent.studio)
- deploy URL: [https://69f53c39ecbd5fa2f4e12a5b--visulive-xylent-studio.netlify.app](https://69f53c39ecbd5fa2f4e12a5b--visulive-xylent-studio.netlify.app)
- source branch: `codex/full-version-foundation`
- source commit: `67400cf5c2e3b5538c260904a57dfcaefb2b4f05`
- build lane: `stable`
- proof status embedded in build: `proof-pack`
- build command: `node ./scripts/run-with-build-info.mjs --lane stable --proof proof-pack -- npm run build`
- deploy command: `npx --yes netlify-cli deploy --site visulive-xylent-studio --dir dist --no-build --prod --json`

### Gate Status

This was an explicit owner-approved release-gate override.

Passed before deploy:

- `npm run check`
- `npm run proof-pack -- --limit 5` non-strict report generation
- `npm run benchmark:validate` without `--require-current`
- clean worktree
- source branch pushed to GitHub

Overridden blocker:

- `npm run release:verify` failed because no active/current-canonical primary benchmark is set in `captures/benchmark-manifest.json`.

### Artifact Identity

- `dist/index.html` SHA-256: `EC0634D8A5338FB88D1CB58C469D6BA29D1FD946443BD23469E03BD7CCF9BD9C`
- `dist/assets/index-CaxR0nj1.js` SHA-256: `4BAC6CA9B83EB85F1F4D5B1DC7216FF3F868D37B4EC6475C78BA510F5170366F`
- production `index-CaxR0nj1.js` hash matched local `dist/assets/index-CaxR0nj1.js`.

### Post-Deploy Verification

- `npm run prod:smoke:stable` passed.
- `https://visulive.xylent.studio/` returned HTTP 200 from Netlify over HTTPS.
- production HTML references `/assets/index-CaxR0nj1.js`.

### Follow-Up

The next stable release should remove the override by promoting a fresh current-canonical primary benchmark, rerunning `npm run release:verify`, and recording the canonical benchmark id in this log.
