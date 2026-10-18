// Runs the full-page stitch off the page's thread: VideoFrames of the shared tab in, progress out,
// and on "finish" the stitched page as a PNG blob (scrollbar cropped).
import { createStitcher } from "./stitch.js";

let stitcher = null, canvas = null, ctx = null;

function pixels(frame) {
  const w = frame.displayWidth, h = frame.displayHeight;
  if (!canvas || canvas.width !== w || canvas.height !== h) {
    canvas = new OffscreenCanvas(w, h);
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }
  ctx.drawImage(frame, 0, 0, w, h);
  frame.close();
  return ctx.getImageData(0, 0, w, h);
}

onmessage = async ({ data }) => {
  try {
    if (data.type === "start") { stitcher = createStitcher({ maxHeight: data.maxHeight }); return; }
    if (data.type === "frame") {
      const state = stitcher.push(pixels(data.frame), { wheel: data.wheel });
      postMessage({ type: "progress", ...state });
      return;
    }
    if (data.type === "finish") {
      const { width, height, crop, parts } = stitcher.result();
      const out = new OffscreenCanvas(width - crop, height), c = out.getContext("2d");
      for (const p of parts) c.putImageData(new ImageData(p.data, width, p.h), 0, p.y, 0, 0, width - crop, p.h);
      postMessage({ type: "done", blob: await out.convertToBlob({ type: "image/png" }), width: width - crop, height });
    }
  } catch (e) {
    data.frame?.close?.();
    postMessage({ type: "error", message: String(e?.message || e) });
  }
};
