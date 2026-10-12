#!/usr/bin/env bash
# PROTOTYPE: delivery encode per ADR-0010 (H.264 High, yuv420p, faststart, no audio), 2-pass at a target bitrate.
# Usage: tools/encode.sh <png-dir> <bitrate e.g. 5M> <out.mp4>
set -eu
export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links"
IN="$1"; BR="$2"; OUT="$3"
PASSLOG="$(mktemp -u)"
common=(-framerate 60 -i "$IN/frame_%06d.png" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v "$BR" -maxrate "$BR" -bufsize "$BR" -an)
ffmpeg -v error -y "${common[@]}" -pass 1 -passlogfile "$PASSLOG" -f mp4 NUL
ffmpeg -v error -y "${common[@]}" -pass 2 -passlogfile "$PASSLOG" -movflags +faststart "$OUT"
rm -f "$PASSLOG"*
