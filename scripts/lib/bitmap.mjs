// A 5x7 bitmap digit font, shared by templates that build the number out of cells.
export const DIGITS = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
export const ROWS = 7;
export const COLS = 5;
export const GAP_COLS = 1;

/** Lit cells of a number string as [col,row] pairs in reading order, digits one cell apart. */
export function cells(str) {
  const out = [];
  [...str].forEach((ch, d) => {
    const glyph = DIGITS[ch] ?? DIGITS[" "];
    const x0 = d * (COLS + GAP_COLS);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (glyph[r][c] === "1") out.push([x0 + c, r]);
  });
  return out;
}

export const gridCols = (digits) => digits * (COLS + GAP_COLS) - GAP_COLS;

/** Rows of a number string as a block of "█" and spaces, for text mediums. */
export function blockRows(str, on = "█", off = " ") {
  return Array.from({ length: ROWS }, (_, r) =>
    [...str].map((ch) => (DIGITS[ch] ?? DIGITS[" "])[r].replace(/1/g, on).replace(/0/g, off)).join(off),
  );
}

/**
 * Stable tile assignment across a sequence of values (157, 158, 159, 160): a tile keeps its cell while
 * the cell stays lit, freed tiles move to newly lit cells, and the pool grows only when it must.
 * Returns { pool, states: [{ tile -> [col,row] | null }] } with states[k][i] the cell of tile i.
 */
export function assign(values) {
  const key = ([c, r]) => c + "," + r;
  const states = [];
  let tileOf = new Map(); // cellKey -> tile index
  let pool = 0;
  for (const v of values) {
    const lit = cells(v);
    const litKeys = new Set(lit.map(key));
    const next = new Map();
    const free = [];
    for (const [k, t] of tileOf) if (litKeys.has(k)) next.set(k, t); else free.push(t);
    free.sort((a, b) => a - b);
    for (const cell of lit) {
      const k = key(cell);
      if (next.has(k)) continue;
      next.set(k, free.length ? free.shift() : pool++);
    }
    const state = [];
    for (const [k, t] of next) state[t] = k.split(",").map(Number);
    states.push(state);
    tileOf = next;
  }
  return { pool, states: states.map((s) => Array.from({ length: pool }, (_, i) => s[i] ?? null)) };
}
