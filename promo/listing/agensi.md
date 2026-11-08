# Agensi listing: x-followers-video-skill

Paste-ready fields for https://www.agensi.io/dashboard/submit, in the order the form asks for them.
Agensi's rules at the time of writing (2026-11-08): ZIP up to 50 MB with `SKILL.md` at the root; logo square,
512×512; name up to 60 characters; summary up to 300; description in Markdown; up to 3 of the 32 categories;
up to 6 screenshots at 10 MB each; demo video on YouTube or Loom only.

## Files to upload

| Field | File |
| --- | --- |
| ZIP | `dist/x-followers-video-skill.zip` (67 files, 2.8 MB; `SKILL.md` at the root, no `promo/`, no real data) |
| Logo | `docs/logo.png` (512×512, transparent corners) or `docs/logo.svg` |
| Screenshots | `docs/wall-16x9.jpg`, `docs/mosaic-16x9.jpg`, `docs/receipt-16x9.jpg`, `docs/terminal-16x9.jpg`, `docs/all-9x16.jpg`, `docs/wall-9x16.jpg` |
| Demo video | upload `renders/x-followers-video-skill-promo.mp4` (39 s, 1920×1080, music) to YouTube, paste the URL |
| Docs link | https://github.com/serhiyhvala/x-followers-video-skill |

Rebuild the ZIP after any change to the skill:

```bash
git ls-files | grep -v -e '^promo/' -e '^docs/logo' -e '^\.gitignore$' | zip -X dist/x-followers-video-skill.zip -@
```

## Name

```
x-followers-video-skill
```

## Summary (274 characters)

```
Turns your X (Twitter) follower milestone into a short, silent, polished MP4. Four templates (wall, mosaic, receipt, terminal) in 16:9 and 9:16, built from one data.json and rendered with HyperFrames. No paid X API: your browser, a pasted snippet, a CSV, or just the number.
```

## Description (Markdown)

```markdown
You crossed 100, 1,000 or 10,000 followers on X. Instead of a text post, your agent makes a 15 s video: the counter rolls to your number, your newest followers appear with their photos and names, your last 7 days of impressions and follows show as a chart, and the film ends on a thank-you. Four looks, each in 16:9 for X and 9:16 for Reels, Shorts and TikTok.

**What it does**

- **wall**: white social-app cards of your newest followers slide into a wall; the number is ringed by their photos at the end.
- **mosaic**: the follower photos themselves assemble into the digits of your milestone.
- **receipt**: a thermal receipt prints every follower as a line item and stamps the total.
- **terminal**: a developer log streams the follows and the number lands in block digits.

Every number on screen comes from one `data.json`. The only required field is `milestone`. The video never states how many followers were used; the caption is "The people who hit follow."

**How it works**

1. `doctor` checks Node 22+, FFmpeg and the renderer, and names a fallback for every gap.
2. Your data is collected by the first tier that applies: the agent reads your profile, followers page and Analytics in your own logged-in browser; or you paste one console snippet on those three pages; or you type the numbers from the X Analytics CSV; or you give just the number. No paid X API, no third-party service, nothing leaves your machine.
3. `build.mjs` turns the data and a template into a HyperFrames project.
4. The agent runs `hyperframes check`, reads the review sheets (text fit, overlap, the counter landing), and renders a delivery-quality H.264 MP4 through `npx hyperframes@0.9.23`.

Less data still works: no analytics drops the stats scene; no photos draws initials; no followers leaves the counter and the thank-you.

**Where it stops**

- Silent by design. Add your own music when you post.
- Shows at most the 60 newest followers and 7 days of analytics.
- Needs a machine with Node.js 22+ and FFmpeg; Chrome is downloaded by HyperFrames on first use. Without them: play the built project in any browser and screen-record it, render in Docker, or run the included GitHub Actions workflow.
- The collector reads x.com's page markup, which X changes from time to time. The selectors sit in one object at the top of one file, with a test against a fixture.

MIT licensed. Source: https://github.com/serhiyhvala/x-followers-video-skill
```

## See it in action

### The request

```
I just hit 1,000 followers on X. Make me a short video to thank them: the wall look, 16:9 for an X post. I'm logged into x.com in the browser, my handle is @ada_example.
```

### The result

```markdown
Rendered: `out/wall-16x9/renders/wall-16x9.mp4`

| | |
| --- | --- |
| Length | 16.4 s, 1920×1080, 30 fps, H.264, silent |
| Size | 6.9 MB |
| Milestone | 1,000 (the counter rolls 997 → 1000) |
| People | your 60 newest followers, 60 photos |
| Stats | Nov 2–8: impressions, follows, unfollows, week-over-week change |

Everything was read from your own logged-in x.com tab (profile, followers page, Analytics with 7D selected). Nothing left your machine, and the video never says how many followers were used; the caption is "The people who hit follow."

| Step | Result |
| --- | --- |
| doctor | Node v24, FFmpeg 9.0, Chrome cached by HyperFrames: ready |
| data | `data.json` written: milestone, @ada_example, 60 followers, 7 days; photos downloaded to `pfp/` |
| build | wall · 16:9 · 16.4 s · scenes: intro@0 (the wall), stats@7 (chart), finale@11.4 (counter, rings) |
| check | ok. Two expected warnings only: `film_silent`, `composition_file_too_large` on the 60-card intro |
| snapshot | review sheets read: every name fits, no overlap, the counter lands on 1,000 |
| render | 22 s at delivery quality; ffprobe: one video stream, no audio |

Next steps

1. Post the MP4 on X. For Reels, Shorts or TikTok say `9:16` and I build the vertical cut from the same data (about 15 s).
2. Want another look? `mosaic` builds the digits 1000 out of the photos; `receipt` and `terminal` are the text styles. One build each.
3. `data.json`, `pfp/` and `out/` are gitignored. Delete them when you are done if this is a shared machine.
```

## Compatibility note

```
Works with any agent that reads SKILL.md: Claude Code, Codex CLI, Cursor, Gemini CLI, Windsurf, Cline, GitHub Copilot. Install with `npx skills add serhiyhvala/x-followers-video-skill` or clone the repo; the skill is a file tree (scripts import ./lib, templates include partials), so the files must be on disk with their paths kept. Needs Node.js 22+, npx and FFmpeg on macOS, Linux or Windows. Chrome (about 150 MB) is downloaded by HyperFrames on first use. Without Chrome or FFmpeg: play the built project in any browser and screen-record, render in Docker, or use the included GitHub Actions workflow. Data collection in the browser needs an agent with a browser tool (T3 Code, Claude in Chrome, Playwright) or you paste one console snippet yourself.
```

## Pricing

Free. The source is public under MIT and the README already carries the install command; a paid listing of the same thing would be refused as a repackaged free skill and would not sell.

## Categories (up to 3; the first picks the category page)

1. Image & Video
2. Social Media
3. Marketing & SEO

## Tags

```
x, twitter, followers, milestone, thank-you video, mp4, hyperframes, motion graphics, social media, reels, shorts, tiktok, 9:16, 16:9, creator, x analytics, no api
```

## Use cases

```
- Thank your followers when you cross 100, 500, 1,000 or 10,000 on X with a 15 s video instead of a text post
- Turn your newest followers and 7-day X analytics into a clip for Reels, Shorts or TikTok (9:16)
- Give a creator, founder or community account a repeatable milestone post in one of four looks
- Make the video with nothing but the number when no analytics or photos are available
- Render on GitHub Actions or in Docker when the laptop has no Chrome or FFmpeg
```

## Permissions

Agensi detects these from the ZIP; this is what to confirm in the review step.

### Required tools and software

```
- Node.js 22 or newer, with npx
- FFmpeg and ffprobe (brew install ffmpeg / apt install ffmpeg / choco install ffmpeg)
- Chrome for Testing, downloaded automatically by HyperFrames on first render (no manual install)
- Optional: a browser the agent can drive, for the automatic data collection
- Optional: Docker, or a GitHub account for the Actions fallback
```

### Tools used

```
- Shell: node, npx hyperframes@0.9.23 (check, snapshot, render), ffprobe
- File read and write inside the working directory
- Browser tool (optional): opens x.com in the user's own logged-in session and runs scripts/collect-x.js on three pages
```

### Needs access to

```
- Network: registry.npmjs.org (hyperframes@0.9.23 and its dependencies, once per npx cache); storage.googleapis.com (the Chrome for Testing download, once); cdn.jsdelivr.net (GSAP 3.15, loaded by the built project at render time); pbs.twimg.com (profile photos, only when fetch-avatars.mjs runs)
- x.com: only through the user's own browser session, read-only, page DOM only. The skill makes no requests to x.com itself and uses no X API
- No account, no API key, no telemetry; nothing is uploaded anywhere
```

### File scopes

```
- Reads: data.json, pfp/ (profile photos), the skill's own scripts/ and templates/
- Writes: out/<template>-<aspect>/ (the HyperFrames project, player/index.html, renders/*.mp4), pfp/ when photos are fetched
- Caches outside the project, created by the tools: ~/.cache/hyperframes (Chrome), the npx cache
- Never commits anything; .gitignore in the skill excludes data.json, pfp/, out/ and renders/
```

### Notes

```
Real follower data is personal. The skill keeps it in gitignored files, never prints the follower list into chat beyond what the user asks for, and never puts the follower count used on screen. The sample in examples/data.json is invented.
```

## Known limitations

```
- Silent by design: the MP4 has no audio track. Add music when posting.
- At most the 60 newest followers and the last 7 days of analytics are shown.
- The browser collector depends on x.com's current markup. When X changes it, the selectors (one object at the top of scripts/collect-x.js) need an update; the other data tiers keep working.
- Rendering runs locally and needs Chrome and FFmpeg. First render downloads Chrome (about 150 MB). A 16 s film renders in about 20–60 s on a laptop.
- The renderer is pinned to hyperframes@0.9.23 for reproducible output; a newer HyperFrames may add new check warnings.
- Templates are fixed looks. Colours, timing and layout changes mean editing the template HTML, which the agent can do but the skill does not script.
- Very long names, emoji and CJK names shrink and then ellipsize; the review sheets should be read before posting.
- The skill is a file tree with relative imports. Agents that only read the skill text through a connector must write the files to disk with their paths kept (or run `npx skills add serhiyhvala/x-followers-video-skill`) before running anything.
- Only X (Twitter) is supported. No Instagram, Threads or Bluesky collectors.
```

## FAQ

```
Q: Does it need the X API or a paid plan?
A: No. The data comes from pages you already see while logged in, from a console snippet you paste, from the X Analytics CSV, or from the number you type. No API key, no third-party service.

Q: What exactly is read from my account?
A: Your display name, handle and photo; the names, handles and photo URLs of your newest followers (up to 60); and the daily impressions, follows and unfollows for the last 7 days from your own Analytics page. Nothing else, and nothing is sent anywhere.

Q: Will the video show how many followers were used, or reveal my analytics to viewers?
A: The counter shows your milestone. The stats scene shows the 7-day chart only if analytics are present, and you can leave analytics out. The video never says how many followers were used; the caption reads "The people who hit follow."

Q: I only have the number. Does it still work?
A: Yes. With only `milestone` you get the counter rolling to your number and a thank-you. Add followers or analytics later and rebuild.

Q: Which agents can run it?
A: Any agent that reads SKILL.md and can run shell commands: Claude Code, Codex CLI, Cursor, Gemini CLI, Windsurf, Cline, Copilot. Automatic data collection needs an agent with a browser tool; otherwise you paste the snippet yourself.

Q: I cannot install Chrome or FFmpeg on this machine.
A: Build anyway, then either open out/<build>/player/index.html in a browser and screen-record it, run `npm run render:docker`, or push a private copy with your data.json and run the included GitHub Actions workflow; the MP4 comes back as an artifact.

Q: Can I change colours, fonts or timing?
A: The four templates are HTML, CSS and GSAP. Ask your agent to edit the template and rebuild; `hyperframes check` and the review sheets catch overlaps and text that no longer fits.

Q: Can I add music?
A: Yes, after the render: mux any track with FFmpeg, or ask the agent to add an `<audio>` clip to the built project and re-render. The skill ships silent so you own the music choice and the license.

Q: Is the output deterministic?
A: Yes. The renderer is pinned, the avatars with no photo are drawn from a hash of the name and handle, and the same data.json gives the same MP4.

Q: Is it open source?
A: MIT, at https://github.com/serhiyhvala/x-followers-video-skill. HyperFrames (Apache-2.0) is fetched through npx and not redistributed; GSAP 3 is free for this use.
```

## Screenshots (captions)

```
1. wall-16x9.jpg: the wall template, 16:9. Cards of the newest followers around the milestone.
2. mosaic-16x9.jpg: the mosaic template. The follower photos form the digits.
3. receipt-16x9.jpg: the receipt template. Every follower is a line item; the total is the milestone.
4. terminal-16x9.jpg: the terminal template. A dev log of follows, block digits at the end.
5. all-9x16.jpg: the four templates in 9:16 for Reels, Shorts and TikTok.
6. wall-9x16.jpg: the wall in 9:16.
All stills are rendered from examples/data.json, which is invented (initials instead of photos).
```

## Demo video

The launch film is `renders/x-followers-video-skill-promo.mp4` (39 s, 1920×1080, with music). Agensi accepts YouTube or Loom links only, so upload it first.

Suggested YouTube title and description:

```
x-followers-video-skill: a 15 s video for your X follower milestone, made by your agent

You hit a follower milestone on X. Your agent reads your profile, followers and Analytics in your own browser, builds the video and renders it. Four templates, 16:9 and 9:16, no paid X API, MIT.

Install: npx skills add serhiyhvala/x-followers-video-skill
Source: https://github.com/serhiyhvala/x-followers-video-skill
Music: "Smart Moves" by kissan4, Pixabay Content License
```
