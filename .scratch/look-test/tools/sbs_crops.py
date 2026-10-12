# PROTOTYPE: paused-frame type crops from the side-by-side (same display height), 2x nearest. Left control, right Version 2.
# Usage: python tools/sbs_crops.py   reads out/sbs/sbs-{title,rail}.png, writes sheets/sbs-control02-vs-v2-type-2x.png
from PIL import Image, ImageDraw, ImageFont
f = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 22)
rows = [  # (frame, label, control box, v2 box) in side-by-side px
  ("sbs-title.png", "settled on title, t=1.13s", (410, 250, 850, 510), (1570, 269, 2010, 529)),
  ("sbs-rail.png",  "end on rail, t=5.97s (V2 holding its 5.00s frame)", (150, 280, 590, 480), (1560, 330, 2000, 530)),
]
tiles = []
for fn, lbl, cb, vb in rows:
  im = Image.open(f"out/sbs/{fn}").convert("RGB")
  a, b = [im.crop(x).resize(((x[2]-x[0])*2, (x[3]-x[1])*2), Image.NEAREST) for x in (cb, vb)]
  row = Image.new("RGB", (a.width + b.width + 8, a.height + 40), (32, 32, 32))
  row.paste(a, (0, 40)); row.paste(b, (a.width + 8, 40))
  d = ImageDraw.Draw(row)
  d.text((10, 9), f"control-free-02  |  {lbl}", font=f, fill="white")
  d.text((a.width + 18, 9), "Version 2 tuned 5M", font=f, fill="white")
  tiles.append(row)
out = Image.new("RGB", (max(t.width for t in tiles), sum(t.height + 8 for t in tiles)), (32, 32, 32))
y = 0
for t in tiles: out.paste(t, (0, y)); y += t.height + 8
out.save("sheets/sbs-control02-vs-v2-type-2x.png")
print(out.size)
