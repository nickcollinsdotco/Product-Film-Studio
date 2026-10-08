#!/usr/bin/env bash
# Compare out/edit-retimed.mp4 against out/edit-baseline.mp4.
# For each Shot: sample clip-relative times c; expected Shot-local time is
# playbackStart + c (internal timeline cut/held, not scaled). Report PSNR of the
# retimed frame vs the baseline frame at that local time ("cut" model) and vs
# the local time a scaled timeline would show ("scale" model, local*5/dur).
set -u
export PATH="/c/Users/nfbco/AppData/Local/Microsoft/WinGet/Links:$PATH"
OUT=/c/Users/nfbco/Documents/GITHUB/Product-Film-Studio/.scratch/q1-renderer-spike/out
cd "$OUT"; mkdir -p frames/cmp
grab() { ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 "$3"; }
psnr() { ffmpeg -i "$1" -i "$2" -lavfi psnr -f null - 2>&1 | grep -o "average:[^ ]*" | cut -d: -f2; }
# shot variant newStart newDur playbackStart baselineStart
SHOTS="1:a-state:1:4:0:0 2:b-native:6:4:0:5 3:b3-helpers:11:4:0:10 4:b2-inline:16:4:1:15 5:c-hybrid:21:4:0:20 6:b2-inline:25:7:0:25"
printf "%-6s %-11s %5s %7s %9s %9s %9s\n" shot variant c local cutPSNR scaledLoc scalePSNR
for s in $SHOTS; do
  IFS=: read -r n v ns nd pb bs <<< "$s"
  for c in 0.5 1.75 3.0 3.9 5.5 6.5; do
    if awk "BEGIN{exit !($c < $nd)}"; then :; else continue; fi
    g=$(awk "BEGIN{print $ns+$c}")
    loc=$(awk "BEGIN{print $pb+$c}")
    bl=$(awk "BEGIN{l=$pb+$c; if (l>4.95) l=4.95; print $bs+l}")
    sloc=$(awk "BEGIN{l=($pb+$c)*5/$nd; if (l>4.95) l=4.95; print l}")
    sbl=$(awk "BEGIN{print $bs+$sloc}")
    grab edit-retimed.mp4 "$g" "frames/cmp/r-$n-$c.png"
    grab edit-baseline.mp4 "$bl" "frames/cmp/b-$n-$c.png"
    grab edit-baseline.mp4 "$sbl" "frames/cmp/s-$n-$c.png"
    printf "%-6s %-11s %5s %7s %9s %9s %9s\n" "shot-$n" "$v" "$c" "$loc" "$(psnr frames/cmp/r-$n-$c.png frames/cmp/b-$n-$c.png)" "$sloc" "$(psnr frames/cmp/r-$n-$c.png frames/cmp/s-$n-$c.png)"
  done
done
# Gaps left by the moves should be empty (no Shot visible).
for g in 0.5 5.5 10.5 15.5; do
  grab edit-retimed.mp4 "$g" "frames/cmp/gap-$g.png"
  echo "gap t=$g mean luma: $(ffmpeg -i frames/cmp/gap-$g.png -vf signalstats,metadata=print:key=lavfi.signalstats.YAVG -f null - 2>&1 | grep -o 'YAVG=[0-9.]*')"
done
