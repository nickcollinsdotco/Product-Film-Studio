// A synthetic page "scrolled" behind a fixed header, a fixed footer and a scrollbar, for the stitch tests.
export const W = 1000, H = 600, PAGE = 5000, HEAD = 60, FOOT = 40, BAR = 15;

// Seeded page: paragraphs of dark "text lines" (a steady line pitch inside a paragraph, as on real pages, ragged
// line ends, word gaps) and blocks of colour, with a blank stretch in the middle.
export function page([blankFrom, blankTo]) {
  const data = new Uint8ClampedArray(W * PAGE * 4).fill(255);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const fill = (x, y, w, h, c) => {
    x = Math.round(x); w = Math.round(w); y = Math.round(y); h = Math.round(h);
    for (let r = Math.max(0, y); r < Math.min(PAGE, y + h); r++)
      for (let q = Math.max(0, x); q < Math.min(W, x + w); q++) data.set(c, (r * W + q) * 4);
  };
  for (let y = 20; y < PAGE; ) {
    if (y > blankFrom && y < blankTo) { y = blankTo; continue; }
    if (rnd() < 0.2) { // a block of colour: a card or an image
      const h = 60 + rnd() * 160;
      fill(40 + rnd() * 300, y, 200 + rnd() * 500, h, [rnd() * 255, rnd() * 255, rnd() * 255, 255]);
      y += h + 24 + rnd() * 30;
      continue;
    }
    const lines = 2 + Math.floor(rnd() * 6), pitch = 22 + Math.floor(rnd() * 10), size = 10 + Math.floor(rnd() * 5), left = 40 + rnd() * 60;
    const ink = 20 + rnd() * 60;
    for (let i = 0; i < lines; i++) {
      let x = left;
      const end = left + 400 + rnd() * 500;
      while (x < end) { const w = 20 + rnd() * 70; fill(x, y + i * pitch, Math.min(w, end - x), size, [ink, ink, ink + 10, 255]); x += w + 6 + rnd() * 6; }
    }
    y += lines * pitch + 18 + rnd() * 30;
  }
  return data;
}

export let source = page([2300, 2550]); // shorter than a frame's content: always something to match on

// One frame of the page at `scroll`, behind the fixed header, footer and scrollbar. Options, as on real sites:
// a floating dock fixed above the bottom edge, content fading in over the bottom quarter of the view,
// and a block in the page (rows 1000-1100) that animates every frame.
let tick = 0;
export function frame(scroll, { dock = false, reveal = false, anim = false } = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  data.set(source.subarray(scroll * W * 4, (scroll + H) * W * 4));
  const fill = (x, y, w, h, c) => { for (let r = Math.max(0, y); r < Math.min(H, y + h); r++) for (let q = x; q < x + w; q++) data.set(c, (r * W + q) * 4); };
  tick++;
  if (anim) for (let r = 1000 - scroll; r < 1100 - scroll; r++) if (r >= 0 && r < H) for (let q = 100; q < 300; q++) data.set([(q * 7 + tick * 40) % 255, (r * 3 + tick * 90) % 255, 80, 255], (r * W + q) * 4);
  if (reveal) for (let r = Math.floor(H * 0.75); r < H; r++) for (let o = r * W * 4; o < (r + 1) * W * 4; o += 4) { data[o] = 128 + data[o] / 2; data[o + 1] = 128 + data[o + 1] / 2; data[o + 2] = 128 + data[o + 2] / 2; }
  fill(0, 0, W, HEAD, [16, 24, 48, 255]);                   // fixed header
  fill(0, H - FOOT, W, FOOT, [240, 200, 40, 255]);           // fixed footer
  if (dock) { fill(380, H - 130, 240, 70, [60, 60, 66, 255]); for (let i = 0; i < 5; i++) fill(392 + i * 46, H - 118, 38, 46, [200, 90 + i * 30, 40, 255]); }
  fill(W - BAR, 0, BAR, H, [230, 230, 230, 255]);            // scrollbar track
  const thumb = Math.round((scroll / (PAGE - H)) * (H - 80));
  fill(W - BAR + 3, thumb, BAR - 6, 80, [120, 120, 120, 255]); // and thumb
  return { width: W, height: H, data };
}

export const useSource = (next) => { const was = source; source = next; return was; };

// Rows of the stitched page that differ from the source page (header rows excluded: the header hides them in every frame).
export function mismatchedRows(out, { from = HEAD, to = out.height, skip = [] } = {}) {
  let bad = 0;
  for (let r = from; r < to; r++) {
    if (skip.some(([a, b]) => r >= a && r < b)) continue;
    for (let x = 0; x < out.width; x += 3) {
      const a = (r * out.width + x) * 4, b = (r * W + x) * 4;
      if (Math.abs(out.data[a] - source[b]) + Math.abs(out.data[a + 1] - source[b + 1]) + Math.abs(out.data[a + 2] - source[b + 2]) > 6) { bad++; break; }
    }
  }
  return bad;
}

