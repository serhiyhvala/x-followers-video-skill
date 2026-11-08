#!/usr/bin/env bash
# Writes the README stills and GIF from the renders of a verify-all run (default: out/verify/data).
#   scripts/test/stills.sh [out/verify/data]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${1:-$ROOT/out/verify/data}"
mkdir -p "$ROOT/docs"
# One still per template at the frame that shows its medium best.
at() { case "$1" in wall) echo 4.2;; mosaic) echo 3.2;; receipt) echo 8.6;; terminal) echo 13.4;; esac; }
for t in wall mosaic receipt terminal; do
  for a in 16x9 9x16; do
    mp4="$SRC/$t-$a/renders/$t-$a.mp4"
    [ -f "$mp4" ] || { echo "missing $mp4"; continue; }
    ffmpeg -v error -y -ss "$(at $t)" -i "$mp4" -frames:v 1 -q:v 3 "$ROOT/docs/$t-$a.jpg"
  done
done
# A small looping GIF of the wall (16:9), 15 fps, 640 px wide, two-pass palette.
mp4="$SRC/wall-16x9/renders/wall-16x9.mp4"
if [ -f "$mp4" ]; then
  ffmpeg -v error -y -i "$mp4" -vf "fps=15,scale=640:-1:flags=lanczos,palettegen=max_colors=128" "$ROOT/out/palette.png"
  ffmpeg -v error -y -i "$mp4" -i "$ROOT/out/palette.png" -lavfi "fps=15,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4" "$ROOT/docs/wall-16x9.gif"
fi
# A contact sheet of all four templates in 9:16 for the templates reference.
if ls "$ROOT"/docs/*-9x16.jpg >/dev/null 2>&1; then
  ffmpeg -v error -y -i "$ROOT/docs/wall-9x16.jpg" -i "$ROOT/docs/mosaic-9x16.jpg" -i "$ROOT/docs/receipt-9x16.jpg" -i "$ROOT/docs/terminal-9x16.jpg" \
    -filter_complex "[0][1][2][3]hstack=inputs=4,scale=1600:-1" -q:v 3 "$ROOT/docs/all-9x16.jpg"
fi
ls -la "$ROOT/docs"
