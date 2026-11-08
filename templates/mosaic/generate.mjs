// Mosaic: follower photos are the pixels of a 5x7 bitmap of the milestone; the last digit re-flows as it rolls.
import { assign, gridCols, ROWS } from "../../scripts/lib/bitmap.mjs";

const GAP = 8;
const BAR_ROWS = 6;

export default function generate(ctx) {
  const { followers, v, W, H, analytics, milestone, from, digits, fmt } = ctx;
  const { esc, hash } = fmt;
  const n = followers.length;
  const hasStats = analytics != null;
  const hasGrowth = analytics?.follows != null;
  const dropped = [];
  if (!n) dropped.push("photos in the tiles (no followers in data.json): tiles are flat ink");
  if (!hasStats) dropped.push("stats scene (no analytics in data.json)");
  else if (!hasGrowth) dropped.push("new-followers beat (analytics has no follows)");

  // Grid geometry from the digit count: the mosaic fills 84% of the width, pitch capped so faces stay faces.
  const values = [];
  for (let x = from; x <= milestone; x++) values.push(String(x).padStart(digits, " "));
  const gcols = gridCols(digits);
  const maxW = v ? 1000 : 1640;
  const pitch = Math.min(v ? 120 : 110, Math.floor((maxW + GAP) / gcols));
  const tile = pitch - GAP;
  const gridW = gcols * pitch - GAP;
  const gridH = ROWS * pitch - GAP;
  const gx = Math.round((W - gridW) / 2);
  const gy = v ? Math.round(820 - gridH / 2) : Math.round(560 - gridH / 2);
  const { pool, states } = assign(values);

  const kickerTop = gy - (v ? 150 : 120);
  // Scatter positions stay below the kicker line so frame 0 reads.
  const tileMarkup = (idPrefix, scatterSpread) =>
    Array.from({ length: pool }, (_, i) => {
      const p = n ? followers[i % n] : null;
      const sx = (hash(`${idPrefix}x${i}`) % (W - tile)) - gx;
      const sy = kickerTop + 90 + (hash(`${idPrefix}y${i}`) % (H - tile - kickerTop - 90)) - gy;
      const rot = (hash(`r${i}`) % 41) - 20;
      const s = states.map((st) => (st[i] ? `${st[i][0] * pitch},${st[i][1] * pitch}` : "-")).join("|");
      const inner = p ? `<img src="${p.src}" alt="" />` : "";
      const scx = Math.round(gridW / 2 + (sx - gridW / 2) * scatterSpread);
      const scy = Math.round(gridH / 2 + (sy - gridH / 2) * scatterSpread);
      return `      <div class="mo-tile${p ? "" : " mo-flat"}" id="${idPrefix}-${i}" data-sc="${scx},${scy},${rot}" data-s="${s}">${inner}</div>`;
    }).join("\n");

  // Stats bars: 7 columns of up to BAR_ROWS tiles each.
  const barPitch = v ? 100 : 92;
  const barTile = barPitch - 10;
  const heights = (series) => {
    const max = Math.max(...series, 1);
    return series.map((x) => (x > 0 ? Math.max(1, Math.round((x / max) * BAR_ROWS)) : 0));
  };
  const hA = hasStats ? heights(analytics.impressions) : [];
  const hB = hasGrowth ? heights(analytics.follows) : hA;
  const peakA = hasStats ? analytics.impressions.indexOf(Math.max(...analytics.impressions)) : -1;
  const peakB = hasGrowth ? analytics.follows.indexOf(Math.max(...analytics.follows)) : -1;
  const barsMarkup = hasStats
    ? analytics.days
        .map(
          (day, i) =>
            `        <div class="bar" id="bar-${i}"><div class="bar-stack">` +
            Array.from({ length: BAR_ROWS }, (_, j) => `<div class="bt" id="bt-${i}-${j}"></div>`).join("") +
            `</div><span class="bar-day">${esc(day)}</span></div>`,
        )
        .join("\n")
    : "";

  const scenes = [
    { id: "form", file: "form.html", duration: 4.6 },
    hasStats && { id: "stats", file: "stats.html", duration: hasGrowth ? 4.4 : 2.4 },
    { id: "finale", file: "finale.html", duration: 4.4 },
  ].filter(Boolean);

  return {
    scenes,
    dropped,
    rootVariables: [
      { id: "color-ground", type: "color", label: "Background", default: "#FFD43B" },
      { id: "color-ink", type: "color", label: "Text and flat tiles", default: "#111111" },
      { id: "color-paper", type: "color", label: "Highlight tiles", default: "#FFFFFF" },
    ],
    vars: {
      hasGrowth,
      pitch,
      tile,
      tileRadius: Math.max(6, Math.round(tile * 0.12)),
      gridW,
      gridH,
      gx,
      gy,
      kickerTop,
      unitTop: gy + gridH + (v ? 70 : 54),
      formTiles: tileMarkup("mo-t", 1),
      finaleTiles: tileMarkup("fi-t", 1.6),
      stepCount: values.length,
      barsMarkup,
      barPitch,
      barTile,
      barTileRadius: Math.max(5, Math.round(barTile * 0.12)),
      barsW: 7 * barPitch - 10,
      barsH: BAR_ROWS * barPitch - 10,
      barsJson: JSON.stringify({ a: hA, b: hB, peakA, peakB }),
      analyticsJson: JSON.stringify(analytics),
      sourceLine: analytics ? `Source: X Analytics · ${esc(analytics.range)}` : "",
    },
  };
}
