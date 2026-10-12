#!/usr/bin/env bash
# PROTOTYPE: side-by-side crops at one frame: void (contrast x6, banding) and in-focus type (2x).
# Usage: tools/crops.sh <frame-number> <variant>...   writes out/res/sweep-void-<n>.png, sweep-type-<n>.png
set -eu
export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links"
N="$1"; shift; cd "$(dirname "$0")/../out"; mkdir -p res/tmp
VOID="crop=600:220:500:960,lutyuv=y='clip((val-16)*6+16,16,235)'"
TYPE="crop=300:110:1050:580,scale=600:220:flags=neighbor"
V=(); T=()
for v in "$@"; do
  for src in master 4M 5M; do
    if [ $src = master ]; then in="$v/frame_$(printf %06d "$N").png"; sel=""; else in="enc/$v-$src.mp4"; sel="select=eq(n\,$((N-1))),"; fi
    ffmpeg -v error -y -i "$in" -vf "${sel}${VOID}" -frames:v 1 "res/tmp/v-$v-$src.png"
    ffmpeg -v error -y -i "$in" -vf "${sel}${TYPE}" -frames:v 1 "res/tmp/t-$v-$src.png"
    V+=(-i "res/tmp/v-$v-$src.png"); T+=(-i "res/tmp/t-$v-$src.png")
  done
done
n=$(( ${#V[@]} / 2 ))
ffmpeg -v error -y "${V[@]}" -filter_complex "xstack=inputs=$n:layout=$(python -c "print('|'.join(f'{(i%3)*600}_{(i//3)*220}' for i in range($n)))")" "res/sweep-void-$N.png"
ffmpeg -v error -y "${T[@]}" -filter_complex "xstack=inputs=$n:layout=$(python -c "print('|'.join(f'{(i%3)*600}_{(i//3)*220}' for i in range($n)))")" "res/sweep-type-$N.png"
echo "rows: $* ; cols: master 4M 5M"
