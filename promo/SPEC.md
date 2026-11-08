GOAL:    a builder on X sees a real result in the first ten seconds and copies the install command at the end.
OUTPUT:  HyperFrames, 1920x1080, 30 fps, silent by request (no <audio>); type and motion carry it.
TIME:    38.0 s x 30 = 1140 frames. No music, so cuts land on motion.
LOOK:    home ground #FFFFFF flat; ink #0B0B0C; muted #6E6E73; one accent #FF5A1F (the follower count, one word per claim,
         the end-card command). Display Inter 900 at 7-12% of the frame height, tracking -0.03em, tabular numbers; body Inter 600.
         Worlds: (1) the real x.com profile as a screenshot on white, pushed to 1.6x; (2) a chat with the agent: desktop #D9DDE3,
         white window radius 24, Inter 30-32, ink bubble, accent avatar, commands as JetBrains Mono 26 chips, green #3FB950 checks;
         (3) the four rendered films themselves, full frame; (4) the end card on white. Cursor 80 px, black, enters from off-screen.
OBJECTS: the real profile page (screenshot, real "222 Followers"); a data.json panel (mono, real values); the terminal window with
         real commands and real output lines; four real MP4s rendered from the owner's data; the install command as a copyable line.
MOTION:  arrivals expo.out 0.5-0.7 s; camera pushes power2.inOut 0.6 s; exits power3.in 0.25 s; typing steps(n) at 0.04 s/char;
         titles per word blur(6px)->0 in 0.13 s, 0.07 s apart, then dead still; one number count-up 1.2 s; zoom-through 0.45 s
         power3.in; stagger of the four films 0.12 s. Render-time motion blur on; the screenshot world opts out.
SHOTS:
  1  0.0-3.0   HOOK: the real profile fills the frame at 1.15x; the camera pushes to "222 Followers" (1.6x) over 0.8 s; an accent
               underline draws under the count at 0.9 s. Title lands per word at 1.3: "222 people hit follow." Hold.
  2  3.0-6.0   TENSION: profile blurs 10 px and dims; on white, two lines, one at a time: "A post says thanks." / "This shows them."
  3  6.0-8.8   REVEAL: "x-followers-video-skill" lands as a wordmark (Inter 900, 110 px) with "an agent skill" under it; the
               number 222 drops from the title into a data.json panel: { "milestone": 222, "followers": 60, "analytics": "7d" }.
  4  8.8-10.6  ASK: a chat with the agent; one message types in the composer ("Make a video for my 223 followers, wall
               template, 16:9"), the cursor clicks send, the bubble pops into the thread.
  5  10.6-21.0 THE AGENT WORKS: four steps stream in its reply, each with a spinner that becomes a check and the real
               command it ran under it: install (npx skills add …), read your X in your browser (the real followers page
               as a tool result, a scan bar reading rows), build (node scripts/build.mjs …), render (progress bar).
  6  21.0-23.4 THE FILE: wall-16x9.mp4 lands as an attachment card with a poster frame; "Done. Every one of them is in it.";
               the cursor clicks the card.
  7  23.4-29.4 PAYOFF: the wall film zooms out of that card to full frame (0.5 s, power3.in) and plays its finale (rings around 223).
  8  29.0-33.0 THE OTHER THREE: hard cut on the ring punch to mosaic, then receipt, then terminal, 1.3 s each, each on its own
               strongest moment, with a one-word label in the corner band of the ground ("mosaic", "receipt", "terminal").
  9  33.0-35.0 CLAIM: on white, "Every follower sees themselves." lands per word; "Four templates · 16:9 and 9:16 · silent" under it.
 10  35.0-38.0 END CARD: the install command as a line in a soft panel, the cursor enters and clicks it, it flashes accent;
               the repo URL under it. Holds 2.4 s.
BANNED:  dark void; glow/neon/particles; purple-blue gradients; glass cards; three cards in a row; a feature list; an invented
         dashboard; UI tilted in 3D; a title over a dimmed screenshot held as a slide; every scene fading and sliding up; titles
         that drift after landing; a logo docked in a corner; a typing opener; sound.
QA:      t=0 (profile pushing, count visible), 1.6 (title + underline), 4.5 (line two), 7.5 (wordmark + data panel), 12 (install
         output), 17 (data filled), 22.5 (render line), 26 (rings around 222), 30-33 (three cuts), 34 (claim), 37.5 (end card).
