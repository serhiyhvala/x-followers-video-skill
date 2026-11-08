      // Lines before TYPED_BEFORE are already on screen; the rest appear at TIMES, and the output scrolls
      // like a full terminal: the newest line always fits in the view.
      const TIMES = {{timesJson}};
      const BEFORE = {{typedBefore}};
      const VIEW_H = {{visibleH}};
      const outEl = document.getElementById("t-out");
      const lineEls = Array.from(outEl.children);
      const tops = lineEls.map((el) => el.offsetTop);
      const bottoms = lineEls.map((el) => el.offsetTop + el.offsetHeight);
      const scrollFor = (i) => -Math.max(0, bottoms[i] - VIEW_H);
      lineEls.forEach((el, i) => {
        if (i >= BEFORE) gsap.set(el, { autoAlpha: 0 });
        const cur = el.querySelector(".t-cursor");
        if (cur && i < lineEls.length - 1 && i < BEFORE) gsap.set(cur, { autoAlpha: 0 });
      });
      // A command's cursor disappears when its output starts.
      const cursorOff = (i, at) => {
        const cur = i > 0 && lineEls[i - 1].querySelector(".t-cursor");
        if (cur && i - 1 < lineEls.length - 1) tl.set(cur, { autoAlpha: 0 }, at);
      };
      gsap.set(outEl, { y: scrollFor(Math.max(0, BEFORE - 1)) });
      // A line that has scrolled out of the view is hidden, so nothing is sampled where nothing shows.
      const hidden = new Set();
      const hideScrolledOut = (i, at) => {
        const y = scrollFor(i);
        for (let j = 0; j < i; j++) {
          if (hidden.has(j) || bottoms[j] + y > 0) continue;
          hidden.add(j);
          if (at == null) gsap.set(lineEls[j], { autoAlpha: 0 });
          else tl.set(lineEls[j], { autoAlpha: 0 }, at + 0.08);
        }
      };
      hideScrolledOut(Math.max(0, BEFORE - 1), null);
      const typeLine = (i, at, dur) => {
        const cmd = lineEls[i].querySelector("[data-cmd]");
        const w = cmd.scrollWidth;
        const chars = (cmd.textContent || "").length;
        gsap.set(cmd, { width: 0 });
        tl.set(lineEls[i], { autoAlpha: 1 }, at);
        tl.to(cmd, { width: w, duration: dur, ease: `steps(${chars})` }, at);
      };
      Object.keys(TIMES)
        .map(Number)
        .sort((a, b) => TIMES[a] - TIMES[b])
        .forEach((i) => {
          const at = TIMES[i];
          if (lineEls[i].querySelector("[data-cmd]") && i >= BEFORE) return; // typed by the scene itself
          tl.set(lineEls[i], { autoAlpha: 1 }, at);
          cursorOff(i, at);
          tl.to(outEl, { y: scrollFor(i), duration: 0.08, ease: "power1.out" }, at);
          hideScrolledOut(i, at);
        });
