# VisuLive Capture Reports

Date: 2026-04-07  
Status: Active developer review output

This folder is for generated analysis reports derived from saved replay captures.

Primary use:
- run `npm run analyze:captures`
- review the generated markdown report
- use the findings to target conductor, event, and scene retuning

These reports are not the canonical captures themselves.

They are the developer-facing read of:
- what the listening engine heard
- what state the conductor entered
- how strong the captured moment actually was
- where the next retuning pass should focus
