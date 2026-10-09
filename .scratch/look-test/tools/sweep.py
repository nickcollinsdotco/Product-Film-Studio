# PROTOTYPE: grain survival + banding + fidelity for master PNGs vs delivery encodes.
# Usage: python tools/sweep.py <out-dir> <variant>... (variant = master dir name under out/, encodes at out/enc/<variant>-<br>.mp4)
import os, subprocess, sys, glob
import numpy as np
from PIL import Image
FF = os.path.expandvars(r"$LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe")
out = sys.argv[1]; variants = sys.argv[2:]
FRAMES = [200, 290]  # mid-GOP: 200 = end of the move (t=3.32), 290 = settled on rail (t=4.82)
REG = {"void": (200, 950, 1400, 1180), "sky": (120, 80, 760, 200), "rail-type": (1040, 600, 1360, 660)}

def luma(a): return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
def blur(a, r=2):
    k = np.ones(2 * r + 1) / (2 * r + 1)
    for _ in range(3):
        a = np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 0, a)
        a = np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 1, a)
    return a
def hf(a): y = luma(a.astype(np.float64)); return float((y - blur(y))[4:-4, 4:-4].std())
def plateau(a):
    y = np.round(luma(a.astype(np.float64))).astype(np.int32)
    c = y[1:-1, 1:-1]; same = np.ones_like(c, bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            same &= y[1 + dy:y.shape[0] - 1 + dy, 1 + dx:y.shape[1] - 1 + dx] == c
    return float(same.mean())
def crop(a, r): x0, y0, x1, y1 = r; return a[y0:y1, x0:x1]
def frame_from_mp4(mp4, n):
    tmp = mp4 + f".f{n}.png"
    subprocess.run([FF, "-v", "error", "-y", "-i", mp4, "-vf", f"select=eq(n\\,{n - 1})", "-frames:v", "1", tmp], check=True)
    a = np.asarray(Image.open(tmp).convert("RGB")); os.remove(tmp); return a
def psnr(a, b):
    mse = ((a.astype(np.float64) - b.astype(np.float64)) ** 2).mean(); return 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)

rows = []
for v in variants:
    srcs = [("master", None)] + [(os.path.basename(p)[len(v) + 1:-4], p) for p in sorted(glob.glob(os.path.join(out, "enc", v + "-*.mp4")))]
    for n in FRAMES:
        m = np.asarray(Image.open(os.path.join(out, v, f"frame_{n:06d}.png")).convert("RGB"))
        for name, mp4 in srcs:
            a = m if mp4 is None else frame_from_mp4(mp4, n)
            size = "" if mp4 is None else f"{os.path.getsize(mp4) / 1e6:.2f}MB"
            r = {k: crop(a, reg) for k, reg in REG.items()}
            rows.append((v, name, n, size, hf(r["void"]), hf(r["sky"]), plateau(r["void"]), psnr(a, m), psnr(crop(a, REG["rail-type"]), crop(m, REG["rail-type"]))))
print(f"{'variant':16}{'enc':8}{'frame':>6}{'size':>8}{'hf void':>9}{'hf sky':>8}{'plateau':>9}{'PSNR':>7}{'PSNR type':>10}")
for v, name, n, size, hv, hs, pl, ps, pt in rows:
    print(f"{v:16}{name:8}{n:>6}{size:>8}{hv:>9.2f}{hs:>8.2f}{pl:>9.3f}{ps:>7.1f}{pt:>10.1f}")
