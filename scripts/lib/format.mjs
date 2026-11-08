// Number and text helpers shared by every template generator.

/** X shows impressions floored to 0.1K and drops ".0": 120,094 -> "120K", 46,641 -> "46.6K". */
export function shortK(n) {
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

export const sum = (a) => a.reduce((x, y) => x + y, 0);

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const attr = (v) => JSON.stringify(v).replace(/'/g, "&#39;");

export const pad2 = (n) => String(n).padStart(2, "0");

export const withCommas = (n) => Math.round(n).toLocaleString("en-US");

/** Grapheme-aware initials: "Ada Lovelace" -> "AL", "奥利芙" -> "奥", "sari" -> "S". */
export function initials(name, handle) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const first = (w) => {
    const g = seg ? [...seg.segment(w)][0]?.segment : w[0];
    return g && /\p{L}|\p{N}/u.test(g) ? g.toUpperCase() : "";
  };
  let out = words.slice(0, 2).map(first).join("");
  if (!out) out = first(handle.replace(/^_+/, "")) || "X";
  return out;
}

/** Deterministic 32-bit hash for picking colours per handle. */
export function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Digit reels for a counter that rolls `from` -> `to` (to = milestone, from = milestone - 3).
 * Returns one strip per digit position: the glyphs it shows in order, so a strip of length 1 never moves.
 */
export function reels(from, to) {
  const width = String(to).length;
  const values = [];
  for (let v = from; v <= to; v++) values.push(String(v).padStart(width, " "));
  return Array.from({ length: width }, (_, pos) => {
    const strip = [];
    for (const s of values) {
      const g = s[pos];
      if (strip[strip.length - 1] !== g) strip.push(g);
    }
    return strip;
  });
}

/** Reel step times: which tick (0..n-1 of n ticks) each strip advances on. */
export function reelSchedule(from, to) {
  const width = String(to).length;
  const ticks = [];
  for (let v = from + 1, k = 0; v <= to; v++, k++) {
    const prev = String(v - 1).padStart(width, " ");
    const next = String(v).padStart(width, " ");
    for (let pos = 0; pos < width; pos++) if (prev[pos] !== next[pos]) ticks.push({ pos, tick: k });
  }
  return ticks;
}
