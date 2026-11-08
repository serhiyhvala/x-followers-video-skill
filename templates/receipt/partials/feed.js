      // The strip rises out of the slot: the paper is pulled up by the height of every line printed so far,
      // and a line's ink is revealed from the bottom as it passes the print head.
      const HEIGHTS = {{heightsJson}};
      const TIMES = {{timesJson}};
      const BEFORE = {{printedBefore}};
      const STRIPS = {{stripsJson}};
      const paper = document.getElementById("rc-paper");
      // "emerged" is the paper length past the slot: the 60 px top pad plus every printed line.
      const emergedBefore = 60 + HEIGHTS.slice(0, BEFORE).reduce((a, b) => a + b, 0);
      gsap.set(paper, { y: -emergedBefore });
      HEIGHTS.forEach((h, i) => {
        if (i >= BEFORE) gsap.set("#rl-" + i, { clipPath: "inset(100% 0 0 0)", autoAlpha: 0 });
      });
      if ({{reelsSettled}}) {
        STRIPS.forEach((s, pos) => {
          const strip = document.getElementById("rdg-" + pos);
          gsap.set(strip, { yPercent: -(100 * (s.length - 1)) / s.length });
          gsap.set(Array.from(strip.children).slice(0, -1), { autoAlpha: 0 }); // glyphs that rolled out of the slot
        });
      }
      // Lines that have risen above the frame are hidden, so nothing is sampled where nothing shows.
      const viewH = {{viewH}}; // never read layout here: HyperFrames mounts the scene before it is laid out
      const tops = [];
      HEIGHTS.reduce((acc, h, i) => ((tops[i] = acc), acc + h), 60);
      const hidden = new Set();
      const hideRisen = (emergedNow, at) => {
        HEIGHTS.forEach((h, j) => {
          if (hidden.has(j) || viewH - emergedNow + tops[j] + h > 200) return;
          hidden.add(j);
          if (at == null) gsap.set("#rl-" + j, { autoAlpha: 0 });
          else tl.set("#rl-" + j, { autoAlpha: 0 }, at + 0.2);
        });
      };
      hideRisen(emergedBefore, null);
      const order = Object.keys(TIMES).map(Number).sort((a, b) => TIMES[a] - TIMES[b]);
      let emerged = emergedBefore;
      order.forEach((i) => {
        const h = HEIGHTS[i];
        const at = TIMES[i];
        const dur = Math.min(0.16, Math.max(0.05, h / 500));
        emerged += h;
        tl.to(paper, { y: -emerged, duration: dur, ease: "power1.out" }, at);
        tl.set("#rl-" + i, { autoAlpha: 1 }, at);
        tl.to("#rl-" + i, { clipPath: "inset(0% 0 0 0)", duration: dur, ease: "none" }, at);
        tl.fromTo("#rc-led", { backgroundColor: "#43d17a" }, { backgroundColor: "#ffb020", duration: 0.05, yoyo: true, repeat: 1 }, at);
        hideRisen(emerged, at);
      });
