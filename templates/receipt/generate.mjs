// Receipt: a thermal printer feeds a paper strip line by line; every follower is a line item,
// the milestone is the total (a mechanical counter that ticks as the last three items print),
// analytics print as totals, and the strip ends on THANK YOU, a barcode and a tear.
const LINE = 44; // px per body line at 30 px Space Mono

export default function generate(ctx) {
  const { followers, v, W, analytics, milestone, from, digits, reels, ticks, me, collectedAt, fmt } = ctx;
  const { esc, pad2, shortK, sum, hash, withCommas } = fmt;
  const n = followers.length;
  const hasStats = analytics != null;
  const hasGrowth = analytics?.follows != null;
  const dropped = [];
  if (!n) dropped.push("line items (no followers in data.json): only the three newest print as numbered lines");
  if (!hasStats) dropped.push("totals scene (no analytics in data.json)");

  const paperW = v ? 860 : 720;
  const pad = 48;
  const numFont = v ? 170 : 150;
  const slotW = Math.round(numFont * 0.66);
  const slotH = Math.round(numFont * 1.12);
  const numBlockH = slotH + 70;

  // ---- The strip, in print order ---------------------------------------------------------------
  const lines = [];
  const push = (kind, html, h = LINE) => lines.push({ kind, html, h });
  const text = (s, cls = "") => push("text", `<span class="${cls}">${s}</span>`);
  const row = (left, right, cls = "") => push("row", `<span class="rl-l ${cls}">${left}</span><span class="rl-dots"></span><span class="rl-r ${cls}">${right}</span>`);
  const divider = () => push("divider", "", 34);
  const blank = (h = 22) => push("blank", "", h);

  const date = collectedAt ? new Date(collectedAt) : null;
  const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  text(esc(me ? me.name.toUpperCase() : "FOLLOWERS"), "rl-center rl-bold");
  if (me) text(esc(`x.com/${me.handle}`), "rl-center rl-muted");
  text(`${dateText ? esc(dateText) + "  ·  " : ""}FOLLOWER MILESTONE`, "rl-center rl-muted");
  divider();
  row("QTY  DESCRIPTION", "", "rl-muted");

  // Items print oldest first, numbered up to the milestone; the newest three print one tick each.
  const firstIndex = milestone - n + 1;
  const items = followers.slice().reverse(); // oldest of the list first
  const shown = Math.min(3, Math.max(0, milestone - from), n || 3);
  const itemRow = (p, num) => row(`<span class="rl-num">#${withCommas(num)}</span> ${p ? esc(p.name) : "NEW FOLLOWER"}`, p ? `@${esc(p.handle)}` : "+1");
  items.slice(0, Math.max(0, items.length - shown)).forEach((p, k) => itemRow(p, firstIndex + k));
  const itemStart = 5;
  const itemEnd = lines.length; // exclusive: the burst of older items

  divider();
  const reelsMarkup = reels
    .map((strip, pos) => `<span class="dg"><span class="dg-strip" id="rdg-${pos}">${strip.map((g) => `<span>${g === " " ? "&nbsp;" : g}</span>`).join("")}</span></span>`)
    .join("");
  push("number", `<span class="rl-total-label">TOTAL FOLLOWERS</span><span class="rl-total" id="rl-total">${reelsMarkup}</span>`, numBlockH);
  const numberIndex = lines.length - 1;
  // The newest three print after the total and tick it up, one line each.
  const newest = n ? items.slice(items.length - shown) : Array(shown).fill(null);
  newest.forEach((p, k) => itemRow(p, milestone - shown + 1 + k));
  blank(18);
  const printEnd = lines.length;

  // Totals (analytics)
  let totalsEnd = printEnd;
  if (hasStats) {
    divider();
    const imp = sum(analytics.impressions);
    row("IMPRESSIONS  7 DAYS", shortK(imp), "rl-bold");
    if (analytics.impressionsChangePct != null) row("  vs the week before", `${analytics.impressionsChangePct >= 0 ? "+" : "−"}${Math.abs(analytics.impressionsChangePct)}%`, "rl-muted");
    const peak = analytics.impressions.indexOf(Math.max(...analytics.impressions));
    row("  best day", `${esc(analytics.days[peak])}  ${shortK(analytics.impressions[peak])}`, "rl-muted");
    if (hasGrowth) {
      const f = sum(analytics.follows), u = sum(analytics.unfollows);
      row("NEW FOLLOWS", `+${f}`, "rl-bold");
      if (u) row("UNFOLLOWS", `−${u}`, "rl-muted");
      row("NET THIS WEEK", `${f - u >= 0 ? "+" : "−"}${Math.abs(f - u)}`, "rl-bold");
    }
    blank(18);
    totalsEnd = lines.length;
  }

  // Finale
  divider();
  push("thanks", `<span>THANK</span> <span>YOU</span> <span>FOR</span> <span>ALL.</span>`, 96);
  const bars = [...String(milestone)].flatMap((d, i) => {
    const bits = hash(`bar${d}${i}`);
    return Array.from({ length: 9 }, (_, k) => ((bits >> k) & 1 ? 4 : 2));
  });
  let x = 0;
  const barSvg = bars
    .map((w, i) => {
      const r = `<rect x="${x}" y="0" width="${w}" height="70" />`;
      x += w + (i % 2 ? 3 : 2);
      return r;
    })
    .join("");
  push("barcode", `<svg viewBox="0 0 ${x} 70" width="${Math.min(x * 2, paperW - 2 * pad)}" height="70" aria-hidden="true">${barSvg}</svg><span class="rl-code">${withCommas(milestone)}</span>`, 130);
  blank(30);
  push("tear", "", 24);
  const finaleEnd = lines.length;

  const linesMarkup = lines
    .map((l, i) => `          <div class="rl rl-${l.kind}" id="rl-${i}" style="height:${l.h}px">${l.html}</div>`)
    .join("\n");

  // ---- Timing: each scene prints its slice; itemStep keeps the item burst near 5 s whatever N is,
  // never faster than 0.07 s a line so a viewer can catch their own name going past.
  const burst = itemEnd - itemStart;
  const itemStep = burst ? Math.min(0.16, Math.max(0.07, 5 / burst)) : 0;
  const times = {};
  let t = 0.25;
  for (let i = itemStart; i < itemEnd; i++) times[i] = t += itemStep;
  t += 0.25;
  times[itemEnd] = t += 0.12; // divider
  const numberAt = (times[numberIndex] = t += 0.3);
  const tickTimes = [];
  for (let i = numberIndex + 1; i < printEnd - 1; i++) {
    times[i] = t += 0.45;
    tickTimes.push(times[i] + 0.1);
  }
  times[printEnd - 1] = t + 0.2;
  const printDur = Math.round((t + 1.6) * 10) / 10;

  const sceneTimes = (startIdx, endIdx, lead, step) => {
    const out = {};
    let tt = lead;
    for (let i = startIdx; i < endIdx; i++) out[i] = tt += lines[i].kind === "divider" || lines[i].kind === "blank" ? step * 0.5 : step;
    return out;
  };
  const printTimes = {};
  for (const [i, x] of Object.entries(times)) printTimes[i] = Math.round(x * 1000) / 1000;

  const totalsTimes = hasStats ? sceneTimes(printEnd, totalsEnd, 0.2, 0.36) : {};
  const totalsDur = hasStats ? Math.round((Object.values(totalsTimes).at(-1) + 1.4) * 10) / 10 : 0;
  const finaleTimes = sceneTimes(totalsEnd, finaleEnd, 0.15, 0.34);
  const tearAt = Object.values(finaleTimes).at(-1) + 0.5;

  const scenes = [
    // The header is already printed at frame 0, so the thumbnail shows who this is.
    { id: "print", file: "print.html", duration: printDur, vars: { timesJson: JSON.stringify(printTimes), printedBefore: itemStart, reelsSettled: false } },
    hasStats && { id: "totals", file: "totals.html", duration: totalsDur, vars: { timesJson: JSON.stringify(totalsTimes), printedBefore: printEnd, reelsSettled: true } },
    { id: "finale", file: "finale.html", duration: Math.round((tearAt + 2.8) * 10) / 10, vars: { timesJson: JSON.stringify(finaleTimes), printedBefore: totalsEnd, reelsSettled: true, tearAt: Math.round(tearAt * 100) / 100 } },
  ].filter(Boolean);

  return {
    scenes,
    dropped,
    rootVariables: [
      { id: "color-ground", type: "color", label: "Counter top", default: "#3E5C50" },
      { id: "color-paper", type: "color", label: "Receipt paper", default: "#FBFAF6" },
      { id: "color-ink", type: "color", label: "Thermal ink", default: "#1F1F1F" },
      { id: "color-accent", type: "color", label: "Stamp", default: "#D7263D" },
    ],
    vars: {
      paperW,
      paperLeft: Math.round((W - paperW) / 2),
      bodyH: v ? 470 : 160,
      bodyW: paperW + 100,
      bodyLeft: Math.round((W - paperW - 100) / 2),
      linesMarkup,
      heightsJson: JSON.stringify(lines.map((l) => l.h)),
      numFont,
      slotW,
      slotH,
      stripsJson: JSON.stringify(reels),
      ticksJson: JSON.stringify(ticks),
      tickTimesJson: JSON.stringify(tickTimes.map((x) => Math.round(x * 1000) / 1000)),
      numberAt: Math.round(numberAt * 1000) / 1000,
    },
  };
}
