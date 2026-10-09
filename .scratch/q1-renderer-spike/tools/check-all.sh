#!/usr/bin/env bash
# Runs lint + check (--json) for every variant, saves raw output under evidence/,
# prints a one-line summary per audit. Run from anywhere.
set -u
REPO=/c/Users/nfbco/Documents/GITHUB/Product-Film-Studio
SPIKE=.scratch/q1-renderer-spike
export PATH="/c/Users/nfbco/AppData/Local/Microsoft/WinGet/Links:$PATH"
cd "$REPO"
mkdir -p "$SPIKE/evidence"
VARIANTS="${*:-a-state b-native b3-helpers b2-inline c-hybrid}"
for v in $VARIANTS; do
  npx hyperframes lint "$SPIKE/$v" > "$SPIKE/evidence/lint-$v.txt" 2>&1
  npx hyperframes check "$SPIKE/$v" --json > "$SPIKE/evidence/check-$v.json" 2> "$SPIKE/evidence/check-$v.err"
done
node -e '
const fs = require("fs");
for (const v of process.argv.slice(1)) {
  const j = JSON.parse(fs.readFileSync(`.scratch/q1-renderer-spike/evidence/check-${v}.json`, "utf8"));
  const f = (s) => s ? `${s.ok ? "ok" : "FAIL"} e${s.errorCount}/w${s.warningCount}/i${s.infoCount}` : "-";
  const codes = (s) => [...new Set((s?.findings || []).map((x) => x.code))].join(",");
  console.log(`${v.padEnd(11)} ok=${j.ok} browserSkipped=${j.browserSkipped}`);
  console.log(`  lint     ${f(j.lint)} ${codes(j.lint)}`);
  console.log(`  runtime  ${f(j.runtime)} ${codes(j.runtime)}`);
  console.log(`  layout   ${f(j.layout)} samples=${j.layout?.samples?.length} ${codes(j.layout)}`);
  console.log(`  motion   ${f(j.motion)} enabled=${j.motion?.enabled} samples=${JSON.stringify(j.motion?.samples)?.slice(0,60)} ${codes(j.motion)}`);
  console.log(`  contrast ${f(j.contrast)} checked=${j.contrast?.checked} passed=${j.contrast?.passed}`);
}' $VARIANTS
