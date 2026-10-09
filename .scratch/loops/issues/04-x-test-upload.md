# X test upload

Type: task (user)
Status: resolved

X's docs say uploads up to 1280×1024; third-party guides say 1920×1200. X re-encodes everything. Upload a 4:3 test file (any existing clip will do until a Loop exists) and download what X serves.

Done when: the served size and bitrate are recorded here, and the X version's size is set.

## Answer

**X serves 4:3 at 960×720 at most. The X version is 960×720, 60fps.** Tested 2026-10-09 on post `2108507671653503256` (@nickcollins___).

- **Uploaded:** `.scratch/look-test/sheets/v2-1600-tuned-5M.mp4`: 1600×1200, 60fps, 5s, 4.58 Mbps, 2.86 MB. It was matched to the download by SSIM (0.98 against 0.97 and 0.94 for the other two 1600 sheets).
- **X kept the original's size:** the syndication API reports `original_info` 1600×1200.
- **X's variants:** MP4s at 360×270 (288 kbps nominal), 480×360 (832 kbps) and 960×720 (2176 kbps). The HLS master playlist lists only 960×720. There is no 1280 or 1600 variant.
- **Served file** (Twitter Media Harvest, the 960×720 MP4): H.264 High, level 3.2, yuv420p, 60fps, 300 frames, 5.0s, **354 kbps video, 222 KB**. That's about 1/13 of the upload. The 2176 kbps nominal is a ceiling: X encodes for quality, so a mostly static dark scene gets much less.
- **How it looks** (`.scratch/loops/x-test/sbs-2.5s.png`, our Lanczos downscale to 960 against X's file): the headline still reads, but small type, chips and the hero image go soft. The grain is gone. With the dark Backdrop brightened 5× (`sbs-bottom-boosted.png`), X's version shows blocky vertical streaks where ours has even grain. At normal brightness the streaks are faint but visible in the lower right.
- A copy of the served file is in `references/x/x-test-01-served-960x720.mp4` (git-ignored).

### X version

- **960×720, 60fps.** We downscale ourselves rather than upload 1600 and let X's scaler do it. That's one resample we control instead of an unknown one. Bigger uploads buy nothing.
- **Grain and dither don't survive X at about 350 kbps.** The X version gets no grain policy of its own; banding on X is accepted.
- **Untested:** whether a native 960×720 upload looks better than X's downscale of 1600, and whether X Premium unlocks a bigger variant. Retest when the first real Loop is posted.
