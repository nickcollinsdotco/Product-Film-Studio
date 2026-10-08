#!/usr/bin/env bash
# Contact sheets (frames at 0.5 1.5 2.25 3.0 4.5s) per variant + one combined
# grid, plus PSNR of each variant against b2-inline (the literal-tween reference).
set -u
export PATH="/c/Users/nfbco/AppData/Local/Microsoft/WinGet/Links:$PATH"
OUT=/c/Users/nfbco/Documents/GITHUB/Product-Film-Studio/.scratch/q1-renderer-spike/out
cd "$OUT"
VARIANTS="${*:-a-state b-native b3-helpers b2-inline c-hybrid}"
TIMES="0.5 1.5 2.25 3.0 4.5"
mkdir -p frames
for v in $VARIANTS; do
  inputs=(); i=0
  for t in $TIMES; do
    f="frames/$v-$t.png"
    ffmpeg -v error -y -ss "$t" -i "$v.mp4" -frames:v 1 \
      -vf "scale=768:432,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$v  t=$t':x=12:y=12:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.6" "$f"
    inputs+=(-i "$f"); i=$((i+1))
  done
  ffmpeg -v error -y "${inputs[@]}" -filter_complex "hstack=inputs=$i" "sheet-$v.png"
  echo "sheet-$v.png"
done
# Combined grid: one row per variant.
rows=()
for v in $VARIANTS; do rows+=(-i "sheet-$v.png"); done
n=$(echo $VARIANTS | wc -w)
ffmpeg -v error -y "${rows[@]}" -filter_complex "vstack=inputs=$n,scale=1920:-2" sheet-all.png
echo "sheet-all.png"
md5sum *.mp4
for v in $VARIANTS; do
  [ "$v" = b2-inline ] && continue
  p=$(ffmpeg -i "$v.mp4" -i b2-inline.mp4 -lavfi psnr -f null - 2>&1 | grep -o "average:[^ ]*")
  echo "PSNR $v vs b2-inline: $p"
done
