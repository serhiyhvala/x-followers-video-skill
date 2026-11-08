GOAL:    a follower watches it muted and feels part of the number: faces like theirs, the numbers, a thank-you.
OUTPUT:  HyperFrames, 1920x1080 and 1080x1920, 30 fps, silent by design.
TIME:    16.4 s (intro 7, stats 4.4, finale 5); 12.0 without analytics; 8.2 with the counter only.
LOOK:    ground #FFFFFF flat; ink #0B0B0C; muted #6E6E73; hairline rgba(0,0,0,.06); one accent #FF5A1F (the landed
         number, the chart peak, the best day). Inter 900 for numbers (no negative tracking, line-height 1), 700/500 body.
         Medium: real social-app UI. Cards white with layered shadows, radius 32 = 24 inset + 8; photos 1px rgba(0,0,0,.1) outline.
OBJECTS: follower card (84 px photo, name 32/700, @handle 28/500, "Follows you" 28/600); digit slot reels (slot 0.71em x 1.05em);
         7-day line with area and points; follows/unfollows bars on one scale; two rings of 68/64 px photos.
MOTION:  enter expo.out / power4.out 0.45-0.7 s; carry power3.inOut 0.7 s; exits power3.in 0.25-0.3 s; reel tick power3.out 0.32 s;
         springs back.out(1.6) on scale only; stagger words 0.07 s, cards 0.08 s per column, ring photos 0.008 s.
SHOTS:   0.0-2.4 hook (me row, "We just hit", N-3 ticks to N, accent flood + 1.06 punch); 2.3-3.4 carry into the panel;
         2.5-6.7 wall scrolls (runs up/down/up at up to 1100 px); 6.7 whip left. 7.0-9.1 impressions; 9.2-11.1 new followers;
         11.1 drop into depth. 11.4-16.4 rings spiral out, number lands 11.7, "Thank you for all." word by word, hold.
BANNED:  dark void; glow/neon/orbs/particles; purple-blue gradients; glass cards; serif + cream; mono caps labels; pill chips;
         "01/02" labels; KPI grid; everything fading and sliding up; titles drifting after landing; corner labels; logos; sound.
QA:      t=0 (N-3 and copy on screen), 1.3 (accent number), 3.5 (panel + wall), 7.8 and 9.8 (stats built), 13.9 (rings + thanks).
