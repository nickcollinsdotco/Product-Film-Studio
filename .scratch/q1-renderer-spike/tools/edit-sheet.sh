#!/usr/bin/env bash
# Grid for an edit/ render: one row per Shot clip, frames at clip-local
# 0.5 / 2.25 / 4.5 s. Usage: edit-sheet.sh <name> "<shot1Start> <shot2Start> ..."
set -u
export PATH="/c/Users/nfbco/AppData/Local/Microsoft/WinGet/Links:$PATH"
OUT=/c/Users/nfbco/Documents/GITHUB/Product-Film-Studio/.scratch/q1-renderer-spike/out
cd "$OUT"; mkdir -p frames
name=$1; starts=$2; offsets="${3:-0.5 2.25 4.5}"
rows=(); r=0
for s in $starts; do
  r=$((r+1)); ins=(); n=0
  for o in $offsets; do
    t=$(awk "BEGIN{print $s+$o}")
    f="frames/$name-shot$r-$t.png"
    ffmpeg -v error -y -ss "$t" -i "$name.mp4" -frames:v 1 \
      -vf "scale=640:360,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='shot-$r  t=$t (local $o)':x=10:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" "$f"
    ins+=(-i "$f"); n=$((n+1))
  done
  ffmpeg -v error -y "${ins[@]}" -filter_complex "hstack=inputs=$n" "frames/$name-row$r.png"
  rows+=(-i "frames/$name-row$r.png")
done
ffmpeg -v error -y "${rows[@]}" -filter_complex "vstack=inputs=$r" "sheet-$name.png"
echo "sheet-$name.png"
