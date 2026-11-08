// Deterministic initials avatars for people without a photo, as SVG files.
import { initials, hash, esc } from "./format.mjs";

// Eight ink/paper pairs; all pass 4.5:1 for the initials.
const PAIRS = [
  ["#1F3A5F", "#DCE8F7"],
  ["#4A2C6A", "#EADFF5"],
  ["#2F5D3A", "#DDF0E0"],
  ["#7A3419", "#F9E0D4"],
  ["#5A4A12", "#F6EBC5"],
  ["#143F4D", "#D6EEF3"],
  ["#5E2340", "#F7DCE8"],
  ["#36393F", "#E5E7EB"],
];

export function avatarSvg(person) {
  const [ink, paper] = PAIRS[hash(person.handle) % PAIRS.length];
  const text = initials(person.name, person.handle);
  const size = [...text].length > 1 ? 160 : 190;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">` +
    `<rect width="400" height="400" fill="${paper}"/>` +
    `<text x="200" y="200" dy="0.36em" text-anchor="middle" font-family="Inter, Noto Sans JP, Helvetica, Arial, sans-serif" ` +
    `font-weight="700" font-size="${size}" fill="${ink}" letter-spacing="-0.02em">${esc(text)}</text>` +
    `</svg>\n`
  );
}
