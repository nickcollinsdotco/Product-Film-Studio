// Full-page stitch from a shared tab: frames of the page as someone scrolls it, joined into one tall Screen.
// Each frame is matched to the last placed frame by its pixels (no access to the page itself), so it
// works on any site, logged-in apps included. Idea from React Bits' Center Stage; this code is our own.
//
// - Frames are compared as row signatures: luma averaged over column bands, every row kept, so a shift
//   is found to the pixel.
// - Only cells with detail are compared: blank background matches any shift.
// - The shift is the one most cells agree on net of those that disagree, so fixed overlays (headers, docks,
//   chat buttons) and running animations are outvoted while they cover less of the frame than the page does.
// - Fixed overlays near the top and bottom set the frame's usable band; nothing outside it is kept.
// - A page row keeps the last frame that showed it, so reveal animations and lazy images have settled.
// A browser module (Quick Loop's app page and worker) and a Node one (its tests): frames are RGBA { width, height, data }.

const BANDS = 48;          // columns of the row signature
const STILL = 2;           // luma difference under which a cell has not changed
const EDGE = 6;            // luma step to the row below that gives a cell detail
const AGREE = 4;           // luma difference within which a cell agrees with a shift
const QUIET = 0.9;         // this share of detailed cells unchanged: the page didn't scroll (an animation, a cursor)
const FIXED = 0.25;        // a row is under a fixed overlay when this share of its detailed cells stayed put...
const FIXED_MIN = 3;       // ...and at least this many
const BAND = 0.35;         // fixed overlays are looked for in this fraction of the frame at the top and at the bottom
const OVERLAP = 0.15;      // the least overlap, as a fraction of the frame, a shift is tried on
const CELLS = 40;          // fewer detailed cells than this in a frame: it's blank, any match is a guess
const VOTES = 12;          // the fewest cells a shift is judged on (one edge of a block of colour is about 18)
const TRUST = 0.45;        // the share of compared cells that must agree, or the frame is lost (scrolled too far); content
                           // fading in at the bottom of the last frame disagrees with itself settled, so not much more
const PEAK = 3;            // or the best shift scores this many times the best other one (more than 3 px away)
const MARGIN = 3;          // rows kept clear of an overlay's edge
const KEY = 0.5;           // a keyframe every this fraction of the band scrolled
const SEAM = 0.4;          // keyframes join within the top this fraction of their overlap
const HOLD = 6;            // moves an overlay's band edge is held for
const BAR = 0.025;         // a scrollbar is at most this fraction of the width
const CHUNK = 512;         // page rows per buffer

// Each row's mean luma in BANDS column bands, rightmost `skip` px left out (a scrollbar).
function signature({ width, height, data }, skip = 0) {
  const usable = width - skip, out = new Float32Array(BANDS * height), edges = [];
  for (let b = 0; b <= BANDS; b++) edges.push(Math.round((usable * b) / BANDS));
  for (let y = 0; y < height; y++)
    for (let b = 0; b < BANDS; b++) {
      let sum = 0;
      for (let x = edges[b], o = (y * width + x) * 4; x < edges[b + 1]; x++, o += 4) sum += data[o] * 77 + data[o + 1] * 150 + data[o + 2] * 29;
      out[y * BANDS + b] = sum / 256 / (edges[b + 1] - edges[b]);
    }
  return out;
}

// A cell and the one below it (its step) unchanged: a value alone stays put over any patch of the same colour.
const stayedPut = (prev, cur, o) => Math.abs(prev[o] - cur[o]) < STILL && Math.abs(prev[o + BANDS] - cur[o + BANDS]) < STILL;

// Once the shift s is known: a cell pinned to the screen, as an overlay is. It stayed put (value and step) while
// the page moved on: the page that was there is now s rows up (or, near the top, came from s rows down) and
// differs from it. A value staying put alone means nothing: white over white stays put anywhere.
function pinned(prev, cur, o, s, height) {
  if (!stayedPut(prev, cur, o)) return false;
  const d = s * BANDS, y = Math.floor(o / BANDS);
  const moved = (a, b) => Math.abs(a[0] - b[0]) >= AGREE || Math.abs(a[1] - b[1]) >= AGREE;
  if (y - s >= 0 && y - s < height - 1) return moved([prev[o], prev[o + BANDS]], [cur[o - d], cur[o - d + BANDS]]);
  if (y + s >= 0 && y + s < height - 1) return moved([prev[o + d], prev[o + d + BANDS]], [cur[o], cur[o + BANDS]]);
  return false;
}

// The detailed cells (a step to the row below) to match on, as a list of indices; and whether the page held still
// or is blank. Fixed overlays would vote against the move, so cells that stayed put through the last two moves are
// left out, and so are the rows of the last known bands: an overlay's edge never stays put, its step is the page.
function compare(prev, cur, height, still, band) {
  const cells = [], lo = band.top ? (band.top + 2) * BANDS : 0, hi = (band.bottom - 2) * BANDS;
  let stayed = 0;
  for (let o = lo; o < Math.min(hi, BANDS * (height - 1)); o++) {
    if (Math.abs(cur[o] - cur[o + BANDS]) <= EDGE || still[o] >= 2) continue;
    cells.push(o);
    if (stayedPut(prev, cur, o)) stayed++;
  }
  return { cells, quiet: cells.length > 0 && stayed >= cells.length * QUIET, blank: cells.length < CELLS };
}

// Agreeing and compared cells for shift s: cur's row r shows prev's row r + s. A detailed cell agrees when
// both it and the cell below (its step) match: a cell's value alone matches any row of the same colour.
// Only cells that land inside prev's band count: below it is prev's footer, not the page.
// Every `step`th cell; `wide` also accepts a match at s + 1, for a pass that tries every other shift.
function agreement(prev, cur, cells, band, s, step, wide = false) {
  const at = (a, b) => Math.abs(prev[a] - cur[b]) < AGREE && Math.abs(prev[a + BANDS] - cur[b + BANDS]) < AGREE;
  const start = band.top * BANDS, end = BANDS * (band.bottom - 1 - (wide ? 1 : 0)), d = s * BANDS;
  let agree = 0, count = 0;
  for (let i = 0; i < cells.length; i += step) {
    const b = cells[i], a = b + d;
    if (a < start || a >= end) continue;
    count++;
    if (at(a, b) || (wide && at(a + BANDS, b))) agree++;
  }
  return { agree, count };
}

// The shift with the most agreeing cells, weighted by the share that agree (raw agreement would favour any shift
// with more overlap): a sparse pass over every other shift, then every shift and cell near the best few.
const net = ({ agree, count }) => (count < VOTES ? -Infinity : (agree * agree) / count);
function bestShift(prev, cur, cells, band, near) {
  const min = Math.floor((band.bottom - band.top) * OVERLAP), span = band.bottom - band.top - min;
  const [lo, hi] = near ?? [-span, span];
  const step = Math.max(1, Math.floor(cells.length / 1500));
  const rough = [];
  for (let s = lo; s <= hi; s += 2) rough.push({ s, ...agreement(prev, cur, cells, band, s, step, true) });
  rough.sort((a, b) => net(b) - net(a));
  const exact = [];
  for (const c of rough.slice(0, 4))
    for (let s = c.s - 1; s <= c.s + 2; s++) if (s >= lo && s <= hi) exact.push({ s, ...agreement(prev, cur, cells, band, s, 1) });
  exact.forEach((m) => (m.net = net(m)));
  exact.sort((a, b) => b.net - a.net);
  const best = exact[0] || { s: 0, agree: 0, count: 0, net: -Infinity };
  // the best shift more than a few px away: how far the winner stands out
  best.rival = exact.find((m) => Math.abs(m.s - best.s) > 3)?.net ?? 0;
  return best;
}

// Fixed overlays near the top and bottom, from what stayed put through the last `need` moves (one move isn't
// enough: page content can look still after a scroll, in a list with a regular pitch, but not after two):
// - whole rows that stayed put, in a run from the frame's edge: a solid header or footer bar;
// - rows where enough detailed cells stayed put: a floating dock, a chat button, a nav pill.
// Rows [top, bottom) are the band between them, the page a frame adds; rows [barTop, barBottom) are inside the bars
// alone, where frames are matched (partial overlays are left out of the match cell by cell already; a sticky
// heading partway down shouldn't cost the match all the rows above it).
function overlays(still, rowStill, cur, height, need) {
  const head = Math.floor(height * BAND), foot = height - head;
  let top = 0, bottom = height;
  while (top < head && rowStill[top] >= need) top++;
  while (height - bottom < head && rowStill[bottom - 1] >= need) bottom--;
  // a run of still rows ends at the last edge inside it: a solid bar's own edge, not blank page still around it
  const edgeAt = (y) => { let n = 0; for (let k = 0; k < BANDS; k++) if (Math.abs(cur[y * BANDS + k] - cur[(y + 1) * BANDS + k]) > EDGE) n++; return n >= BANDS * 0.25; };
  while (top > 0 && !edgeAt(top - 1)) top--;
  while (bottom < height && !edgeAt(bottom - 1)) bottom++;
  const barTop = top, barBottom = bottom;
  for (let y = 0; y < height - 1; y++) {
    if (y >= head && y < foot) continue;
    let detailed = 0, fixed = 0;
    for (let k = 0, o = y * BANDS; k < BANDS; k++, o++) {
      if (Math.abs(cur[o] - cur[o + BANDS]) <= EDGE) continue;
      detailed++;
      if (still[o] >= need) fixed++;
    }
    if (fixed < FIXED_MIN || fixed < detailed * FIXED) continue;
    if (y < head) top = Math.max(top, y + 1);
    else bottom = Math.min(bottom, y);
  }
  // a real header meets the page at an edge; a run of still rows from blank page above a blank stretch doesn't
  let edge = 0;
  if (top > 0 && top < height) for (let k = 0; k < BANDS; k++) if (Math.abs(cur[(top - 1) * BANDS + k] - cur[top * BANDS + k]) > EDGE) edge++;
  return { top, bottom, barTop, barBottom, edged: edge >= BANDS * 0.25 };
}

// Trailing columns that still differ once the frames are aligned (the scrollbar's thumb moved), plus
// the plain track either side of the thumb: columns all the rightmost column's colour.
function scrollbar(prev, cur, s, top, bottom) {
  const { width } = cur, max = Math.ceil(width * BAR);
  const r0 = Math.max(top, top - s), r1 = Math.min(bottom, bottom - s);
  if (r1 - r0 < 8) return 0;
  const col = (x) => {
    let sum = 0;
    for (let r = r0; r < r1; r++) {
      const a = ((r + s) * width + x) * 4, b = (r * width + x) * 4;
      sum += Math.abs(prev.data[a] - cur.data[b]) + Math.abs(prev.data[a + 1] - cur.data[b + 1]) + Math.abs(prev.data[a + 2] - cur.data[b + 2]);
    }
    return sum / (r1 - r0) / 3;
  };
  const content = col(width - max - 2);
  let bar = 0;
  for (let x = width - 1; x >= width - max; x--) if (col(x) > Math.max(STILL * 3, content * 3)) bar = width - x;
  const track = (r0 * width + width - 1) * 4;
  const isTrack = (x) => {
    for (let r = r0; r < r1; r += 4) {
      const o = (r * width + x) * 4;
      if (Math.abs(cur.data[o] - cur.data[track]) + Math.abs(cur.data[o + 1] - cur.data[track + 1]) + Math.abs(cur.data[o + 2] - cur.data[track + 2]) > 6) return false;
    }
    return true;
  };
  if (bar) while (bar < max && isTrack(width - bar - 1)) bar++;
  return bar;
}

// `maxPixels` bounds the page buffer (4 bytes each), and so how tall a page can get.
export function createStitcher({ maxHeight = 24000, maxPixels = 60e6 } = {}) {
  let prev = null, prevSig = null, still = null, rowStill = null, moves = 0, limit = maxHeight, band = null;
  let pos = 0, height = 0, crop = 0, lost = false, width = 0, frameHeight = 0, wheel = 0, last = null; // last: the last shift
  // Placed frames wait for the next move before they're written: only then are their fixed overlays known.
  let pending = [], held = [];
  const tops = new Map(); // how many moves found each top band (in 4-row buckets)
  const chunks = [];
  let filled = new Uint8Array(1024); // which page rows have been written

  // frame rows [from, to) to page rows [at + from, at + to), over whatever an earlier frame put there
  const write = ({ frame, at }, from, to) => {
    const end = Math.min(to, limit - at), row = width * 4;
    for (let r = Math.max(0, from); r < end; r++) {
      const y = at + r, c = Math.floor(y / CHUNK);
      chunks[c] ??= new Uint8ClampedArray(CHUNK * row);
      chunks[c].set(frame.data.subarray(r * row, (r + 1) * row), (y % CHUNK) * row);
      if (y >= filled.length) { const grown = new Uint8Array(Math.max(y + 1, filled.length * 2)); grown.set(filled); filled = grown; }
      filled[y] = 1;
    }
    height = Math.max(height, at + end);
  };
  // the waiting frames, each inside the band between fixed overlays; the page's top keeps its header
  // Keyframes: of the frames placed, only those about half a band on from the last one written are kept, each
  // joined to the last at the row in their overlap where the two agree best (a quiet gap, usually). Writing every
  // frame would slice anything animating or scaling with the scroll into thin strips from different moments.
  let key = null, spare = null; // the last keyframe written, and the latest frame since (written at the end)
  const seam = (a, b, from, to) => { // page rows [from, to) of keyframe a and frame b: the best row to join at
    const row = width * 4, step = 16;
    let best = from, low = Infinity;
    for (let y = from; y < to; y++) {
      const oa = (y - a.at) * row, ob = (y - b.at) * row;
      let d = 0;
      for (let x = 0; x < row; x += step) d += Math.abs(a.frame.data[oa + x] - b.frame.data[ob + x]) + Math.abs(a.frame.data[oa + x + 1] - b.frame.data[ob + x + 1]);
      d += ((y - from) / Math.max(1, to - from)) * 0.5 * (row / step); // a little in favour of higher rows
      if (d < low) { low = d; best = y; }
    }
    return best;
  };
  const join = (p, top, bottom) => {
    const keyEnd = key.at + bottom, start = p.at + top;
    // in the top of the overlap: below the seam the rows come from p, where they sit higher (settled) than in key
    const at = start < keyEnd ? seam(key, p, start, Math.round(start + (keyEnd - start) * SEAM)) : start;
    write(p, at - p.at, bottom);
    key = p; spare = null;
  };
  const place = (p, top, bottom) => {
    if (!key || p.at === 0 && key.at === 0) { write(p, p.at === 0 ? 0 : top, bottom); key = p; spare = null; return; }
    const span = bottom - top;
    if (p.at - key.at < span * KEY) { spare = p; return; }
    // too far on to overlap the last keyframe well (a fast scroll, a hinted jump): the frame between goes first
    if (spare && spare.at > key.at && p.at - key.at > span * 0.9) join(spare, top, bottom);
    join(p, top, bottom);
  };
  const flush = (sig) => {
    const found = overlays(still, rowStill, sig, frameHeight, Math.min(2, moves));
    // Overlays don't come and go: hold the widest band edges of the last few moves, so a frame where busy content
    // behind a translucent header hides it doesn't let the header into the page. And a top band seen in a few moves
    // is the site's header, kept to the end (behind a translucent header, busy content can hide it for long
    // stretches; a header that hides on scroll only costs rows other frames have).
    held.push(found); if (held.length > HOLD) held.shift();
    const bucket = found.top >> 2;
    if (found.top && found.edged) tops.set(bucket, (tops.get(bucket) || 0) + 1);
    const header = Math.max(0, ...[...tops].filter(([, n]) => n >= 3).map(([b]) => (b << 2) + 3));
    band = { ...found, top: Math.max(header, ...held.map((b) => b.top)), bottom: Math.min(...held.map((b) => b.bottom)) };
    for (const p of pending) place(p, ...edges());
    pending = [];
    return band;
  };
  // a few rows in from each overlay, for its anti-aliased edge and soft shadow
  const edges = () => [band.top ? band.top + MARGIN : 0, band.bottom < frameHeight ? band.bottom - MARGIN : frameHeight];

  return {
    // `wheel`: how far the page was scrolled since the last push, in frame px, if known (a forwarded wheel).
    // It narrows the search, and places frames where there is nothing to match on (long blank stretches).
    push(frame, { wheel: step } = {}) {
      if (step != null) wheel += step;
      const hint = step != null || wheel ? wheel : null;
      if (!prev) {
        width = frame.width; frameHeight = frame.height;
        limit = Math.min(maxHeight, Math.floor(maxPixels / width));
        prev = frame; prevSig = signature(frame, Math.ceil(width * BAR));
        still = new Uint8Array(BANDS * frameHeight); rowStill = new Uint8Array(frameHeight);
        pending = [{ frame, at: 0 }];
        band = { top: 0, bottom: frameHeight, barTop: 0, barBottom: frameHeight };
        return this.state();
      }
      if (frame.width !== width || frame.height !== frameHeight) return { ...this.state(), resized: true };
      const sig = signature(frame, Math.ceil(width * BAR)); // the scrollbar's moving thumb kept out of the match
      const bars = { top: band.barTop, bottom: band.barBottom };
      const { cells, quiet, blank } = compare(prevSig, sig, frameHeight, still, bars);
      if (quiet && !hint) return this.state();
      const near = hint != null && !lost ? [Math.round(hint) - 24, Math.round(hint) + 24] : undefined;
      // Trusted: most cells agree; or (parallax, sticky headings, scroll-linked effects: layers moving at different
      // rates, so no shift fits everything) the winner clearly stands out from any other shift, or stands out a
      // little and carries on the last scroll (scrolling is smooth: the next step is much like the last).
      const steady = (m) => last != null && Math.abs(m.s - last) <= Math.max(8, Math.abs(last) * 0.1);
      const trusted = (m) => m.count >= VOTES && (m.agree >= m.count * TRUST ||
        (m.agree >= VOTES * 2 && m.net >= Math.max(1, m.rival) * (steady(m) ? PEAK / 2 : PEAK)));
      let m = blank ? null : bestShift(prevSig, sig, cells, bars, near);
      if (m && near && !trusted(m)) m = bestShift(prevSig, sig, cells, bars);
      if (!m || !trusted(m)) {
        if (hint == null) { lost = !blank; return this.state(); } // without a wheel, wait for a frame that matches
        m = { s: Math.round(hint) };
      }
      lost = false;
      if (Math.abs(m.s) >= 2) { // a real move: which cells stayed put through it
        moves++;
        for (let o = 0; o < still.length - BANDS; o++) still[o] = pinned(prevSig, sig, o, m.s, frameHeight) ? Math.min(255, still[o] + 1) : 0;
        for (let y = 0; y < frameHeight; y++) {
          let same = 0;
          for (let k = 0, o = y * BANDS; k < BANDS; k++, o++) if (Math.abs(prevSig[o] - sig[o]) < STILL) same++;
          rowStill[y] = same >= BANDS - 1 ? Math.min(255, rowStill[y] + 1) : 0;
        }
      }
      const { top, bottom } = moves ? flush(sig) : { top: 0, bottom: frameHeight };
      crop = Math.max(crop, scrollbar(prev, frame, m.s, top, bottom));
      pos = Math.max(0, pos + m.s);
      if (Math.abs(m.s) >= 2) last = m.s;
      pending.push({ frame, at: pos });
      prev = frame; prevSig = sig; wheel = 0;
      return this.state();
    },
    state() {
      return { moved: pos, height: Math.max(height, pos + frameHeight * 0.75), lost, full: pos + frameHeight >= limit };
    },
    // The stitched page as full-width RGBA strips, with `crop` columns of scrollbar to drop on the right.
    // Rows no frame showed (a hinted jump over a blank stretch) repeat the row above. Never scrolled: the one frame.
    result() {
      if (pending.length) moves ? flush(prevSig) : pending.forEach((p) => write(p, 0, frameHeight));
      pending = [];
      if (spare && spare.at > key.at) join(spare, ...edges()); // the last view, whatever its distance: the page goes to the end
      const row = width * 4, at = (y) => chunks[Math.floor(y / CHUNK)].subarray((y % CHUNK) * row, (y % CHUNK + 1) * row);
      for (let y = 1; y < height; y++) if (!filled[y]) { chunks[Math.floor(y / CHUNK)] ??= new Uint8ClampedArray(CHUNK * row); at(y).set(at(y - 1)); }
      const parts = [];
      for (let y = 0; y < height; y += CHUNK) {
        const h = Math.min(CHUNK, height - y);
        parts.push({ y, h, data: chunks[y / CHUNK].subarray(0, h * row) });
      }
      return { width, height, crop, parts };
    },
  };
}

// One RGBA buffer from the result, scrollbar cropped (tests; the app's worker draws the parts on a canvas).
export function compose({ width, height, crop, parts }) {
  const w = width - crop, out = new Uint8ClampedArray(w * height * 4);
  for (const p of parts)
    for (let r = 0; r < p.h; r++) out.set(p.data.subarray(r * width * 4, r * width * 4 + w * 4), (p.y + r) * w * 4);
  return { width: w, height, data: out };
}
