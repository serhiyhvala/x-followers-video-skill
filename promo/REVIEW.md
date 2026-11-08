# Review: x-followers-video-skill launch film (1920x1080, 30 fps, 39 s, silent)

## Creative calls
- Storyline A from `STORYLINES.md` (the number leaves the page): the real x.com profile is the hook, the real
  install and build commands are the proof, the four real renders are the payoff, the install command is the
  end card. Not built: B (the result first, an endless zoom back to the profile) and C (type on colour fields).
- Silent by request; every line is kinetic type or the product's own text, each held 0.5 s + 0.3 s a word.
- Real UI only: two screenshots of the owner's x.com (profile at 2x zoom, followers page) taken in the owner's
  browser; the four films were rendered from the owner's real data (223 followers, 60 newest, Nov 2–8 analytics).

## Data in the film (owner's account, 2026-11-08)
- 223 followers on the profile at capture time (the count rose from 221 to 223 during the session; the film and
  the four renders agree on 223).
- `data.json`, photos and renders live under `reference/x-data/` and `promo/assets/`, both gitignored.

## Measured
- `hyperframes check --json`: ok. Kept warnings: `film_silent` (by request); `line_unread` on the terminal's
  lines inside the payoff scene (they are the same lines the viewer has watched for 10 s in the previous scene,
  carried over so the cut is invisible, then covered by the film); `nested_media_start_basis_ambiguous` on two
  clips with a nonzero `data-start` inside the trio scene (verified by snapshot that each plays its intended
  stretch).
- Review sheets read (beats, six seams, phone); fixes applied after the first pass: the profile strip stayed in
  frame after the whip (page now leaves by 2700 px), the claim line overflowed at 128 px on one line (now two
  lines at 136 px), the mosaic cut landed on scattered tiles (media start moved to 10.15 s so the number is
  formed), the data.json panel was small (700 px wide, 38 px mono).
- The MP4 was probed with ffprobe (video only, no audio stream, 1920x1080, 30 fps) and ten decoded frames were
  read: hook push, title, install output, collect, the zoom-through mid-flight, the rings, receipt stamp,
  terminal block digits, end card.

## Not checked
- No sound by design, so nothing was heard. The film was not watched at full speed by a person yet.

## Weakest shot
- The collect beat (13–18 s): the followers page is a static capture with a scanning highlight, not a live
  scroll; a screen recording of the real collector run would be stronger.

## Warnings kept on purpose
- `film_silent`, the payoff-scene `line_unread` carry-over lines, the two nested-media-start warnings.
