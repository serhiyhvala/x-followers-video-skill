#!/usr/bin/env node
// Reports exactly what this machine is missing to build and render locally, and the fallback for each gap.
//
//   node scripts/doctor.mjs            # environment checks (about 10 s on first run: npx fetches the CLI)
//   node scripts/doctor.mjs --render   # also renders a 1 s probe through the pinned CLI
//   node scripts/doctor.mjs --json
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HYPERFRAMES = "hyperframes@0.9.23";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const checks = [];
const add = (name, ok, detail, fix) => checks.push({ name, ok, detail, fix: ok ? undefined : fix });

const run = (cmd, argv, opts = {}) => {
  const r = spawnSync(cmd, argv, { encoding: "utf8", shell: process.platform === "win32", timeout: opts.timeout ?? 180000, cwd: opts.cwd });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || ""), status: r.status, error: r.error };
};

// Node
const major = Number(process.versions.node.split(".")[0]);
add("Node.js 22+", major >= 22, `v${process.versions.node}`, "Install Node 22 or newer: https://nodejs.org");

// npx
const npx = run("npx", ["--version"], { timeout: 30000 });
add("npx", npx.ok, npx.ok ? `npx ${npx.out.trim()}` : "not found", "npx ships with npm; reinstall Node.js");

// FFmpeg (the CLI needs it to encode)
for (const bin of ["ffmpeg", "ffprobe"]) {
  const r = run(bin, ["-version"], { timeout: 20000 });
  add(bin, r.ok, r.ok ? r.out.split("\n")[0].slice(0, 60) : "not found", `brew install ffmpeg · apt install ffmpeg · choco install ffmpeg, or set HYPERFRAMES_FFMPEG_PATH / HYPERFRAMES_FFPROBE_PATH`);
}

// The pinned CLI itself, through npx, and its own doctor (Chrome, memory, disk).
let hf = null;
if (npx.ok) {
  const r = run("npx", ["--yes", HYPERFRAMES, "doctor", "--json"], { timeout: 300000 });
  const start = r.out.indexOf("{");
  const end = r.out.lastIndexOf("}");
  try {
    hf = JSON.parse(r.out.slice(start, end + 1));
  } catch {
    hf = null;
  }
  add(`npx ${HYPERFRAMES} runs`, hf != null, hf ? `doctor ok=${hf.ok}` : r.out.trim().split("\n").slice(-3).join(" · ").slice(0, 200), "Check network access to npmjs.com, or `npm cache clean --force` and retry");
  if (hf) {
    for (const c of hf.checks ?? []) {
      const optional = /optional|docker|whisper|shm/i.test(`${c.name} ${c.detail ?? ""}`);
      if (!c.ok && optional) continue;
      add(`hyperframes: ${c.name}`, !!c.ok, String(c.detail ?? "").slice(0, 120), c.hint ?? (c.name.toLowerCase().includes("chrome") ? `npx ${HYPERFRAMES} browser ensure` : undefined));
    }
  }
}

// Optional: a real 1 s render through the pinned CLI, so "it renders" is observed rather than inferred.
if (args.has("--render") && hf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xmv-probe-"));
  fs.cpSync(path.join(ROOT, "scripts", "probe"), dir, { recursive: true });
  const out = path.join(dir, "probe.mp4");
  const r = run("npx", ["--yes", HYPERFRAMES, "render", "--quality", "draft", "--output", out], { cwd: dir, timeout: 600000 });
  const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
  add("probe render (1 s)", r.ok && size > 1000, r.ok ? `${(size / 1024).toFixed(0)} KB at ${out}` : r.out.trim().split("\n").slice(-4).join(" · ").slice(0, 300), "Read the error above; `npx hyperframes@0.9.23 browser ensure` fixes most Chrome problems");
}

const docker = run("docker", ["info"], { timeout: 20000 }).ok;
const ok = checks.every((c) => c.ok);
const fallbacks = [
  "No local render? Open <project>/player/index.html in any browser and screen-record it (needs internet for GSAP).",
  docker ? "Docker is running: `npm run render:docker` inside the built project renders in a container." : "With Docker running, `npm run render:docker` inside the built project renders in a container.",
  "Push a private copy of this repo with your data.json and run the GitHub Actions workflow `Render followers video`.",
];

if (args.has("--json")) {
  console.log(JSON.stringify({ ok, checks, docker, fallbacks }, null, 2));
} else {
  for (const c of checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name.padEnd(34)} ${c.detail}${c.fix ? `\n    fix: ${c.fix}` : ""}`);
  console.log(ok ? "\nReady: build with scripts/build.mjs, then `npm run render` inside the project." : "\nNot ready for a local render. Fallbacks:");
  if (!ok) for (const f of fallbacks) console.log(`  - ${f}`);
}
process.exit(ok ? 0 : 1);
