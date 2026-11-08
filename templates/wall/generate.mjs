// Wall: numbers and markup for intro (counter + card wall), stats (line + bars) and finale (rings).
const CARD_H = 290; // measured card height at the sizes in intro.html
const CARD_GAP = 24;

const icon =
  '<svg class="fc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 19c0-2.8-2.7-5-6-5s-6 2.2-6 5" /><circle cx="9" cy="8" r="3.5" /><path d="M19 8v6M16 11h6" /></svg>';

function card(p, esc) {
  return (
    `            <article class="fc" id="fc-${p.i + 1}">\n` +
    `              <img class="fc-pfp" src="${p.src}" alt="" />\n` +
    `              <p class="fc-name">${esc(p.name)}</p>\n` +
    `              <p class="fc-handle">@${esc(p.handle)}</p>\n` +
    `              <p class="fc-meta">${icon}<span>Follows you</span></p>\n` +
    `            </article>`
  );
}

function ring(list, count, r, offset, from, cls) {
  return Array.from({ length: count }, (_, k) => {
    const a = (k / count) * Math.PI * 2 - Math.PI / 2 + offset;
    const x = Math.round(Math.cos(a) * r);
    const y = Math.round(Math.sin(a) * r);
    const p = list[from + k];
    return `      <div class="fa ${cls}" id="fa-${from + k + 1}" style="left:${x}px;top:${y}px" data-x="${x}" data-y="${y}"><img src="${p.src}" alt="" /></div>`;
  }).join("\n");
}

export default function generate(ctx) {
  const { followers, v, W, H, analytics, me, reels, ticks, digits, fmt } = ctx;
  const { esc } = fmt;
  const hasWall = followers.length > 0;
  const hasStats = analytics != null;
  const hasGrowth = analytics?.follows != null;
  const dropped = [];
  if (!hasWall) dropped.push("follower wall and rings (no followers in data.json)");
  if (!hasStats) dropped.push("stats scene (no analytics in data.json)");
  else if (!hasGrowth) dropped.push("new-followers beat (analytics has no follows)");

  // Counter: slots wider and taller than the glyph so nothing clips; the size follows the digit count.
  const avail = v ? 960 : 1500;
  const font = Math.min(380, Math.floor((avail + 14 * (digits - 1)) / digits / 0.71));
  const slotW = Math.round(font * 0.71);
  const slotH = Math.round(font * 1.05);
  const numW = digits * slotW - 14 * (digits - 1);
  const numLeft = Math.round((W - numW) / 2);
  const numTop = v ? Math.round(760 - slotH / 2) : Math.round(546 - slotH / 2);
  const kickerTop = numTop - 80;
  const unitTop = numTop + slotH + 26;
  const meTop = kickerTop - 116;
  const carry = v ? { x: 80 - numLeft, y: 200 - numTop } : { x: 140 - numLeft, y: 250 - numTop };
  const headTop = v ? 200 + slotH / 2 + 30 : 250 + slotH / 2 + 36;
  const subTop = headTop + (v ? 190 : 204);
  const reelsMarkup = reels
    .map((strip, pos) => `        <span class="dg"><span class="dg-strip" id="dg-${pos}">${strip.map((g) => `<span>${g === " " ? "&nbsp;" : g}</span>`).join("")}</span></span>`)
    .join("\n");

  // Wall: three columns; runs scroll as far as they can, up to 1100 px.
  const cols = [0, 1, 2].map((c) => followers.filter((p) => p.i % 3 === c));
  const wallH = v ? 1260 : 1080;
  const scroll = Math.max(
    0,
    Math.min(1100, Math.max(...cols.map((col) => col.length * CARD_H + (col.length - 1) * CARD_GAP)) - (wallH + 220)),
  );
  const wallMarkup = cols
    .map(
      (col, c) =>
        `        <div class="wall-col" id="wall-col-${c + 1}">\n          <div class="wall-run" id="wall-run-${c + 1}">\n${col.map((p) => card(p, esc)).join("\n")}\n          </div>\n        </div>`,
    )
    .join("\n");

  // Finale: two rings sized from the count so the pitch between faces stays about 84 px.
  const n = followers.length;
  const inner = Math.min(24, Math.ceil(n * 0.4));
  const outer = Math.min(36, n - inner);
  const rIn = Math.max(v ? 250 : 262, Math.round((84 * inner) / (2 * Math.PI)));
  const rOut = rIn + 118;
  const finFont = Math.min(210, Math.floor(((rIn - 40) * 2) / (digits * 0.62)));

  const scenes = [
    { id: "intro", file: "intro.html", duration: hasWall ? 7 : 3.2 },
    hasStats && { id: "stats", file: "stats.html", duration: hasGrowth ? 4.4 : 2.4 },
    { id: "finale", file: "finale.html", duration: 5 },
  ].filter(Boolean);

  return {
    scenes,
    dropped,
    rootVariables: [
      { id: "color-ground", type: "color", label: "Background", default: "#FFFFFF" },
      { id: "color-ink", type: "color", label: "Text", default: "#0B0B0C" },
      { id: "color-muted", type: "color", label: "Muted text", default: "#6E6E73" },
      { id: "color-accent", type: "color", label: "Accent", default: "#FF5A1F" },
    ],
    vars: {
      hasWall,
      hasGrowth,
      meRow: me
        ? `<div id="intro-me"><img src="${me.src}" alt="" /><b>${esc(me.name)}</b><span>@${esc(me.handle)}</span></div>`
        : `<div id="intro-me" hidden></div>`,
      subLine: me ? `Newest first, from x.com/${esc(me.handle)}` : "Newest first.",
      font,
      slotW,
      slotH,
      numLeft,
      numTop,
      kickerTop,
      unitTop,
      meTop,
      carryX: Math.round(carry.x),
      carryY: Math.round(carry.y),
      headTop: Math.round(headTop),
      subTop: Math.round(subTop),
      reelsMarkup,
      stripsJson: JSON.stringify(reels),
      ticksJson: JSON.stringify(ticks),
      wallMarkup,
      scroll,
      ringIn: hasWall ? ring(followers, inner, rIn, 0, 0, "fa-in") : "",
      ringOut: hasWall && outer > 0 ? ring(followers, outer, rOut, Math.PI / Math.max(outer, 1), inner, "fa-out") : "",
      finFont,
      analyticsJson: JSON.stringify(analytics),
      sourceLine: analytics ? `Source: X Analytics · ${esc(analytics.range)}` : "",
    },
  };
}
