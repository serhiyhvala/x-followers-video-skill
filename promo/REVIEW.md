# Review: x-followers-video-skill launch film (1920x1080, 30 fps, 39 s, silent)

## Creative calls
- Storyline A from `STORYLINES.md` (the number leaves the page): the real x.com profile is the hook, a chat
  with the agent is the proof (you send one message; the agent installs, reads your X in your browser, builds
  and renders, showing each real command as a chip under its step), the wall render grows out of the agent's
  attachment card as the payoff, the install command is the end card. The first cut showed the commands in a
  bare terminal and read as "you type this"; the owner asked for the agent to be visibly doing the work.
  Not built: B (the result first, an endless zoom back to the profile) and C (type on colour fields).
- Music added on the second pass at the owner's request: "Smart Moves" by kissan4 from Pixabay (Pixabay Content License,
  no Content ID registration, so no YouTube claims). Picked over four other candidates for its structure: a clean intro
  for 23 s, then a lift exactly where the payoff cuts in (the track's second section at 23.8 s sits at 23.4 s in the film
  with a 0.4 s offset), 120 BPM so the zoom-through starts on a beat. No voice; every line is kinetic type or the
  product's own text, each held 0.5 s + 0.3 s a word.
- Real UI only: two screenshots of the owner's x.com (profile at 2x zoom, followers page) taken in the owner's
  browser; the four films were rendered from the owner's real data (223 followers, 60 newest, Nov 2–8 analytics).

## Data in the film (owner's account, 2026-11-08)
- 223 followers on the profile at capture time (the count rose from 221 to 223 during the session; the film and
  the four renders agree on 223).
- `data.json`, photos and renders live under `reference/x-data/` and `promo/assets/`, both gitignored.

## Measured
- `hyperframes check --json`: ok. Kept warnings: `film_silent` (by request); `line_unread` on the terminal's
  text inside the payoff scene (the chat's last state, carried over from the previous scene so the cut is
  invisible, then covered by the film); `nested_media_start_basis_ambiguous` on two
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
- The music was chosen from loudness envelopes, section analysis and tags, not by ear; the mix was measured
  (ffprobe, `hyperframes audio`), not heard. The film was not watched at full speed by a person yet.

## Weakest shot
- The "reading your X" step (13–17 s): the followers page is a static capture with a scanning highlight as the
  agent's tool result, not a live scroll; a screen recording of the real collector run would be stronger.

## Warnings kept on purpose
- The payoff-scene `line_unread` carry-over lines and the two nested-media-start warnings.
