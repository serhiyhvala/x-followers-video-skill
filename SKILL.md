---
name: x-followers-video-skill
description: Turns an X (Twitter) follower milestone (100, 160, 1,000...) into a short, silent, polished MP4 from a data.json, with four visual templates (wall, mosaic, receipt, terminal) in 16:9 and 9:16, rendered by the pinned HyperFrames CLI through npx. Use when someone wants a follower-milestone video, a "thank you for N followers" clip, or a video of their newest followers and 7-day X analytics. No paid X API; works with a browser, a pasted console snippet, a CSV, or just the number.
---

# X followers video

The agent never writes HyperFrames code. It fills `data.json`, runs `build.mjs`, and renders the project
the build wrote. Every number on screen comes from `data.json`; the only required field is `milestone`.

## Steps

1. **Doctor.** `node scripts/doctor.mjs` (add `--render` for a 1 s probe). It names what is missing and the
   fallback for each gap. Do not install anything for the person; tell them the `fix:` line.
2. **Data.** Produce `data.json` by the first tier that applies (see Data tiers). Shape: [reference/data.md](reference/data.md).
   Photos given as URLs: `node scripts/fetch-avatars.mjs data.json` downloads them next to it.
3. **Template.** Ask which template, or pick: `wall` (white social-app cards), `mosaic` (photos form the
   digits), `receipt` (thermal receipt), `terminal` (dev log). `--aspect 16x9` for X posts, `9x16` for
   Reels, Shorts, TikTok. Details and stills: [reference/templates.md](reference/templates.md).
4. **Build.** `node scripts/build.mjs --data data.json --template wall --aspect 16x9 --out out/wall-16x9`.
   It prints the duration, the scenes, and what it dropped for missing data.
5. **Check and look.** In the project: `npx --yes hyperframes@0.9.23 check --json` (expected warnings below),
   then `npx --yes hyperframes@0.9.23 snapshot --review` and read the sheets before rendering.
6. **Render.** `npm run render` in the project (delivery quality, MP4, no audio). Probe with
   `ffprobe`: one video stream, no audio, the size and duration from `BUILD.json`.
7. **Deliver.** Hand over the MP4 path. Offer the Studio preview (`npx --yes hyperframes@0.9.23 preview`)
   for edits.

## Data tiers (use the first that applies)

1. **Agent has a browser** (T3 Code preview, Claude in Chrome, Playwright, the person logged in on x.com):
   inject `scripts/collect-x.js` on the profile page, the `/followers` page and `x.com/i/account_analytics`
   (7D selected), calling `xmv.collect()` on each, then `xmv.export()` is the `data.json`.
2. **Person pastes a snippet**: send them [reference/collecting.md](reference/collecting.md) (it explains what
   the snippet reads and the risk of pasting code into DevTools). They paste `scripts/collect-x.js` on the
   same three pages; the last run copies `data.json` to their clipboard.
3. **X Analytics CSV**: the person downloads the daily CSV from X Analytics; map the last 7 rows into
   `analytics` by hand ([reference/data.md](reference/data.md) shows the columns).
4. **Manual**: the person types `milestone`, optionally their name and handle, drops photos in `pfp/`, and
   lists a few followers. Anything not given is left out.

## What happens with less data

| Missing | Result |
| --- | --- |
| `analytics` | The stats scene is dropped; the video is 3 to 5 s shorter. |
| `followers` | Wall and rings, mosaic photos, receipt items and the terminal stream are dropped or go flat; counter and thank-you stay. |
| Photos (`avatar: null`) | Deterministic initials avatars are drawn from the name and handle. |
| `me` | The name row and "from x.com/handle" lines are omitted. |
| Only `milestone` | Counter rolls from N-3 to N, then "Thank you for all." |

## Failure modes

- **`doctor` says Chrome or FFmpeg is missing and the person cannot install them**: build anyway, then
  (a) open `<project>/player/index.html` in any browser (needs internet for GSAP) and screen-record, or
  (b) `npm run render:docker` with Docker running, or (c) push a private copy of this repo with their
  `data.json` and run the GitHub Actions workflow "Render followers video"; the MP4 is an artifact.
- **The collector returns empty fields**: X changed its DOM. The selectors are one object at the top of
  `scripts/collect-x.js`; fix them there, re-run `node scripts/test/collect-test.mjs`.
- **Names do not fit**: cards shrink then ellipsize, receipt and terminal lines ellipsize; nothing wraps
  mid-word. Check the review sheets anyway for emoji or CJK names.
- **Studio preview crashes (React error #185)** when files change under it: reload the page.
- **`check` warnings to keep**: `film_silent` (silent by design), `line_unread` on streaming follower
  lines in `receipt` and `terminal` (a log scrolls; the three newest and the number hold),
  `composition_file_too_large` on the wall's intro (60 static cards). Anything else is a regression:
  `node scripts/test/verify-all.mjs` prints the expected set per template.

## Privacy

`data.json`, `pfp/`, `out/` and `renders/` are gitignored. Never commit a real person's follower list.
The sample in `examples/data.json` is invented.
