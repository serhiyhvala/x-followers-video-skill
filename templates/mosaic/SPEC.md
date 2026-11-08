GOAL:    your face is one pixel of the number.
OUTPUT:  HyperFrames, 1920x1080 and 1080x1920, 30 fps, silent.
TIME:    13.4 s (form 4.6, stats 4.4, finale 4.4); 9.0 without analytics.
LOOK:    ground #FFD43B flat; ink #111111; highlight tiles #FFFFFF. Archivo Black for every line, Inter 600/700 for labels under 46 px.
         Medium: a printed poster of square photo tiles, radius 12% of the tile, shadow 0 6px 14px -6px rgba(0,0,0,.35).
OBJECTS: tile grid 5x7 per digit, one empty column between digits, pitch <= 110 px (16:9) / 120 px (9:16), tile = pitch - 8;
         7 stat columns of up to 6 tiles; copy lines 64-72 px.
MOTION:  tiles fly in expo.out 0.9 s, stagger 12 ms; digit re-flow power3.inOut 0.32 s (moves), power3.in 0.2 s (leaves),
         back.out(1.6) 0.32 s (arrives); grid punch 1.04 then back.out(1.6); exits power3.in 0.3 s upward; next scene rises from below.
SHOTS:   0.0 tiles scattered below "We just hit"; 0.3-1.2 they form N-3; 1.55/1.95/2.35 re-flow to N; 2.75 punch, "followers on X";
         4.3 whip up. 4.6 stats copy rises, columns stack (impressions, peak in white); 6.8 restack to new followers; 8.7 whip up.
         9.0 tiles converge into N from the edges; 10.2 "Thank you for all."; hold.
BANNED:  as wall, plus: tiles drifting after landing; a gradient ground; photos with coloured borders.
QA:      t=0, 1.2, 2.3, 2.9, 6.5, 8.3, 10.5, 13.3.
