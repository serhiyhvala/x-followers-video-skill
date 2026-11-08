      // The strip rises out of the slot: the paper is pulled up by the height of every line printed so far,
      // and a line's ink is revealed from the bottom as it passes the print head.
      const HEIGHTS = {{heightsJson}};
      const TIMES = {{timesJson}};
      const BEFORE = {{printedBefore}};
      const STRIPS = {{stripsJson}};
      const paper = document.getElementById("rc-paper");
      const emergedBefore = HEIGHTS.slice(0, BEFORE).reduce((a, b) => a + b, 0);
      gsap.set(paper, { y: -emergedBefore });
      HEIGHTS.forEach((h, i) => {
        if (i >= BEFORE) gsap.set("#rl-" + i, { clipPath: "inset(100% 0 0 0)" });
      });
      if ({{reelsSettled}}) STRIPS.forEach((s, pos) => gsap.set("#rdg-" + pos, { yPercent: -(100 * (s.length - 1)) / s.length }));
      const order = Object.keys(TIMES).map(Number).sort((a, b) => TIMES[a] - TIMES[b]);
      let emerged = emergedBefore;
      order.forEach((i) => {
        const h = HEIGHTS[i];
        const at = TIMES[i];
        const dur = Math.min(0.16, Math.max(0.05, h / 500));
        emerged += h;
        tl.to(paper, { y: -emerged, duration: dur, ease: "power1.out" }, at);
        tl.to("#rl-" + i, { clipPath: "inset(0% 0 0 0)", duration: dur, ease: "none" }, at);
        tl.fromTo("#rc-led", { backgroundColor: "#43d17a" }, { backgroundColor: "#ffb020", duration: 0.05, yoyo: true, repeat: 1 }, at);
      });
