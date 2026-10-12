#!/usr/bin/env bash
# PROTOTYPE: control-free-02 (left) against Version 2 tuned 5 Mbps (right), same display height (720), real time, 60fps.
# Both are delivery encodes. Control is native 1280x720 (no resampling); Version 2 is 1600x1200 scaled to 960x720.
# Version 2 is 5.00s, the control 5.97s: Version 2 holds its last frame after 5.00s (labelled).
# Usage: tools/sbs.sh   writes sheets/sbs-control02-vs-v2.mp4
set -eu
export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links"
cd "$(dirname "$0")/.."
C=../../references/ultramock/control-free-02.mp4
V=sheets/v2-1600-tuned-5M.mp4
F="fontfile='C\:/Windows/Fonts/consola.ttf'"
LBL="fontcolor=white:fontsize=22:x=14:y=12"
CLK="fontcolor=0xffd400:fontsize=22:y=12"
cat > out/sbs/graph.txt <<G
[0:v]fps=60,setsar=1,pad=1280:764:0:44:color=0x202020,
 drawtext=$F:$LBL:text='Ultramock free  control-free-02  1280x720 30fps native',
 drawtext=$F:$CLK:x=w-tw-14:text='%{pts\:hms}'[c];
[1:v]scale=960:720:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration=0.9667,pad=960:764:0:44:color=0x202020,
 drawtext=$F:$LBL:text='Version 2  Three.js  1600x1200 60fps 5M',
 drawtext=$F:fontcolor=0xff6060:fontsize=22:x=w-tw-14:y=12:text='ended 5.00s  holding':enable='gte(t\,5)'[v];
[c][v]hstack=inputs=2,trim=duration=5.9667[o]
G
ffmpeg -v error -y -i "$C" -i "$V" -/filter_complex out/sbs/graph.txt -map "[o]" -r 60 \
  -c:v libx264 -preset slow -crf 10 -pix_fmt yuv420p -movflags +faststart -an sheets/sbs-control02-vs-v2.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames:format=duration,size -of compact=p=0 sheets/sbs-control02-vs-v2.mp4
