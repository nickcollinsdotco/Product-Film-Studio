# PROTOTYPE: per-step motion profile of a clip (mean abs luma diff between consecutive frames, downscaled to 320 wide).
# Usage: python tools/motion.py <video> [fps]
import subprocess, sys, numpy as np
src = sys.argv[1]
p = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate","-of","csv=p=0",src],capture_output=True,text=True).stdout.strip().split(",")
w, h = 320, round(320*int(p[1])/int(p[0])/2)*2
fps = eval(p[2])
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-vf",f"scale={w}:{h}:flags=area,format=gray","-f","rawvideo","-"],capture_output=True).stdout
f = np.frombuffer(raw,np.uint8).reshape(-1,h,w).astype(np.float32)
d = np.abs(np.diff(f,axis=0)).mean(axis=(1,2))
print(f"{len(f)} frames @ {fps:g}fps; step = mean |d luma| between frame i and i+1")
for i,v in enumerate(d):
    print(f"{(i+1)/fps:6.3f}s  {v:6.2f} {'#'*int(v*8)}")
