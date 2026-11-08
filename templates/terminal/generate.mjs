// Terminal: a build-in-public session. `followers --milestone N` streams the newest followers like a log,
// `analytics --7d` prints a table with sparklines, `milestone` draws the number in block glyphs that
// redraw from N-3 to N, and a comment line says thank you.
import { blockRows } from "../../scripts/lib/bitmap.mjs";

const CH = 0.6; // JetBrains Mono advance width in em

export default function generate(ctx) {
  const { followers, v, W, H, analytics, milestone, from, digits, me, fmt } = ctx;
  const { esc, shortK, sum } = fmt;
  const n = followers.length;
  const hasStats = analytics != null;
  const hasGrowth = analytics?.follows != null;
  const dropped = [];
  if (!n) dropped.push("follower stream (no followers in data.json)");
  if (!hasStats) dropped.push("analytics scene (no analytics in data.json)");

  // Window geometry
  const win = v ? { left: 40, top: 200, width: 1000, height: 1130 } : { left: 120, top: 70, width: 1680, height: 940 };
  const bar = 56, pad = 40, line = 44, font = 30;
  const innerW = win.width - 2 * pad;
  const cols = Math.floor(innerW / (font * CH));
  const visibleRows = Math.floor((win.height - bar - 2 * pad) / line);

  const handle = me ? me.handle : "you";
  const prompt = `<span class="t-dim">~/x</span> <span class="t-green">$</span> `;
  const lines = []; // { html, kind, step }
  const out = (html, kind = "out") => lines.push({ html, kind });
  const cmd = (text) => lines.push({ html: `${prompt}<span class="t-cmd" data-cmd>${esc(text)}</span><span class="t-cursor"></span>`, kind: "cmd", text });

  // Scene 1: the stream
  cmd(`followers --milestone ${milestone}`);
  out(`<span class="t-dim">→ reading x.com/${esc(handle)}</span> <span class="t-green">ok</span>`);
  out(`<span class="t-dim">→ newest followers, newest last</span>`);
  const streamStart = lines.length;
  const nameW = Math.max(8, cols - 20);
  const stream = followers.slice().reverse();
  stream.forEach((p) => {
    const name = [...p.name].length > nameW ? [...p.name].slice(0, nameW - 1).join("") + "…" : p.name;
    out(`<span class="t-green">+</span> <span class="t-blue">@${esc(p.handle.padEnd(15))}</span> ${esc(name)}`, "item");
  });
  const streamEnd = lines.length;
  out(`<span class="t-green">✔</span> milestone <span class="t-yellow">${milestone}</span> reached`, "done");
  const scene1End = lines.length;

  // Scene 2: analytics table
  let scene2End = scene1End;
  if (hasStats) {
    const spark = (series) => {
      const max = Math.max(...series, 1);
      const glyphs = "▁▂▃▄▅▆▇█";
      return series.map((x) => glyphs[Math.min(7, Math.round((x / max) * 7))]).join("");
    };
    cmd("analytics --7d");
    out(`<span class="t-dim">→ ${esc(analytics.range)}</span>`);
    const imp = sum(analytics.impressions);
    const pct = analytics.impressionsChangePct;
    out(`impressions ${shortK(imp).padStart(8)}  ${pct == null ? "" : `<span class="${pct >= 0 ? "t-green" : "t-red"}">${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%</span>`.padEnd(6)}  <span class="t-yellow">${spark(analytics.impressions)}</span>`, "row");
    if (hasGrowth) {
      const f = sum(analytics.follows), u = sum(analytics.unfollows);
      out(`follows     ${("+" + f).padStart(8)}          <span class="t-yellow">${spark(analytics.follows)}</span>`, "row");
      if (u) out(`unfollows   ${("−" + u).padStart(8)}`, "row");
      out(`net         <span class="t-green">${(f - u >= 0 ? "+" : "−") + Math.abs(f - u)}</span>`.padStart(8), "row");
    }
    scene2End = lines.length;
  }

  // Scene 3: block digits that redraw from `from` to `milestone`, then the thank-you comment.
  cmd("milestone");
  const values = [];
  for (let x = from; x <= milestone; x++) values.push(String(x).padStart(digits, " "));
  const blockChars = digits * 10 + (digits - 1) * 2;
  const blockFont = Math.min(v ? 30 : 48, Math.floor(innerW / (blockChars * CH)));
  const blockLine = Math.round(blockFont * 1.0);
  const layers = values
    .map((val, k) => {
      const rows = blockRows(val, "██", "  ").map((r) => r.replace(/ /g, "&nbsp;"));
      return `<span class="t-layer" data-state="${k}">${rows.map((r) => `<span class="t-brow">${r}</span>`).join("")}</span>`;
    })
    .join("");
  lines.push({ html: `<span class="t-block" id="t-block">${layers}</span>`, kind: "block", height: blockLine * 7 + 20 });
  out(`<span class="t-dim"># thank you for all.</span>`, "comment");
  out(`${prompt}<span class="t-cursor"></span>`, "prompt");
  const scene3End = lines.length;

  const heights = lines.map((l) => l.height ?? line);
  const markup = (upTo) =>
    lines
      .slice(0, upTo)
      .map((l, i) => `          <div class="t-line t-${l.kind}" id="tl-${i}"${l.height ? ` style="height:${l.height}px"` : ""}>${l.html}</div>`)
      .join("\n");

  // Timing
  const step = n ? Math.min(0.1, Math.max(0.045, 3.4 / n)) : 0;
  const typeDur = (text) => Math.max(0.3, text.length * 0.04);
  const t1 = {};
  let t = 0.5; // the command is already typed at frame 0; Enter at 0.5
  t1[1] = t;
  t1[2] = t += 0.3;
  for (let i = streamStart; i < streamEnd; i++) t1[i] = t += step;
  t1[streamEnd] = t += 0.4;
  const scene1Dur = Math.round((t + 1.3) * 10) / 10;

  const t2 = {};
  let typed2 = 0;
  if (hasStats) {
    t = 0.15;
    typed2 = typeDur("analytics --7d");
    t2[scene1End] = t; // typing starts
    t += typed2 + 0.25;
    for (let i = scene1End + 1; i < scene2End; i++) t2[i] = t += 0.36;
  }
  const scene2Dur = hasStats ? Math.round((t + 1.4) * 10) / 10 : 0;

  const t3 = {};
  t = 0.15;
  const typed3 = typeDur("milestone");
  t3[scene2End] = t;
  t += typed3 + 0.25;
  const blockAt = t;
  const redrawT = values.slice(1).map((_, k) => blockAt + 0.9 + k * 0.4);
  const landedAt = redrawT.length ? redrawT[redrawT.length - 1] + 0.35 : blockAt + 0.9;
  t3[scene2End + 2] = landedAt + 0.3; // comment
  t3[scene2End + 3] = landedAt + 0.3 + typeDur("# thank you for all.") + 0.2; // prompt
  const scene3Dur = Math.round((t3[scene2End + 3] + 2.2) * 10) / 10;

  const scenes = [
    { id: "stream", file: "stream.html", duration: scene1Dur, vars: { linesMarkup: markup(scene1End), timesJson: JSON.stringify(t1), typedBefore: 1, streamStart, streamEnd } },
    hasStats && { id: "stats", file: "stats.html", duration: scene2Dur, vars: { linesMarkup: markup(scene2End), timesJson: JSON.stringify(t2), typedBefore: scene1End, typedLine: scene1End, typedDur: typed2 } },
    { id: "finale", file: "finale.html", duration: scene3Dur, vars: { linesMarkup: markup(scene3End), timesJson: JSON.stringify(t3), typedBefore: scene2End, typedLine: scene2End, typedDur: typed3, blockAt, redrawJson: JSON.stringify(redrawT), landedAt, blockIndex: scene2End + 1, commentIndex: scene2End + 2 } },
  ].filter(Boolean);

  return {
    scenes,
    dropped,
    rootVariables: [
      { id: "color-ground", type: "color", label: "Desktop", default: "#D9DDE3" },
      { id: "color-term", type: "color", label: "Terminal background", default: "#14171C" },
      { id: "color-fg", type: "color", label: "Terminal text", default: "#E6EDF3" },
      { id: "color-accent", type: "color", label: "Number", default: "#E3B341" },
    ],
    vars: {
      winLeft: win.left,
      winTop: win.top,
      winW: win.width,
      winH: win.height,
      bar,
      pad,
      line,
      font,
      blockFont,
      blockLine,
      visibleH: visibleRows * line,
      heightsJson: JSON.stringify(heights),
      title: `followers — ${cols}×${visibleRows}`,
    },
  };
}
