# PROTOTYPE: temporal shimmer in the in-focus rail type during the settled, slowly drifting hold.
# Mean |f(n+1) - 2 f(n) + f(n-1)| on luma: smooth sub-pixel motion stays low; aliasing/shimmer spikes it.
# Usage: python tools/shimmer.py <master-dir>...
import sys, os
import numpy as np
from PIL import Image
REG = (1000, 560, 1500, 700)
def lum(p):
    a = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
    x0, y0, x1, y1 = REG; a = a[y0:y1, x0:x1]
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
for d in sys.argv[1:]:
    fr = [lum(os.path.join(d, f"frame_{n:06d}.png")) for n in range(230, 301)]
    acc = [np.abs(fr[i + 1] - 2 * fr[i] + fr[i - 1]).mean() for i in range(1, len(fr) - 1)]
    print(f"{os.path.basename(d):24} 2nd-diff mean {np.mean(acc):.3f}  p95 {np.percentile(acc, 95):.3f}")
