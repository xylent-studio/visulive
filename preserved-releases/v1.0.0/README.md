# VisuLive v1.0.0 Preservation Folder

This folder is the preservation home for the first public VisuLive edition.

Current state:

- intended version: `v1.0.0`
- intended maintenance branch: `release/v1`
- intended legacy host: [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)
- intended Netlify site: `visulive-v1-xylent-studio`
- exact source commit: `6f45b8a`
- exact live deploy id: `69e191a1e164309b55b6ff01`
- live legacy site: [https://visulive-v1.xylent.studio](https://visulive-v1.xylent.studio)
- provisional Netlify URL: [https://visulive-v1-xylent-studio.netlify.app](https://visulive-v1-xylent-studio.netlify.app)
- current record status: `ready`

The exact currently deployed stable commit has been resolved and tagged, and the final custom domain
is now live on the dedicated legacy Netlify site.

That means this folder is not finished until all of the following are true:

1. the exact runnable artifact and live deploy metadata are preserved
2. the annotated tag `v1.0.0` exists on the exact source commit
3. the branch `release/v1` exists on that exact source commit
4. the dedicated legacy site remains deployed and recoverable
5. the final custom hostname is bound and verified
6. the GitHub Release is published with the preserved assets

Use:

- [docs/preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)
- [docs/deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
- `npm run release:preserve -- --version v1.0.0 ...`
