// Sync: copies the Library into a Project and stamps its version (ADR-0004).
// Usage: node tools/library/sync.mjs <project-dir>
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(repo, "library");

export function sync(projectDir) {
  const project = resolve(projectDir);
  if (!existsSync(join(project, "hyperframes.json"))) throw new Error(`Not a HyperFrames project: ${project}`);
  const target = join(project, "library");
  rmSync(target, { recursive: true, force: true }); // a re-sync replaces the copy; the Project's git shows the diff
  cpSync(source, target, { recursive: true });
  const version = readFileSync(join(source, "VERSION"), "utf8").trim();
  const commit = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repo, encoding: "utf8" }).stdout.trim();
  const stamp = { version, commit, synced: new Date().toISOString() };
  writeFileSync(join(target, "library.json"), JSON.stringify(stamp, null, 2) + "\n");
  return stamp;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error("Usage: node tools/library/sync.mjs <project-dir>"); process.exit(1); }
  const stamp = sync(process.argv[2]);
  console.log(`Library ${stamp.version} (${stamp.commit}) synced into ${resolve(process.argv[2])}`);
}
