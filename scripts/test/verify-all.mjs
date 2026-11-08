#!/usr/bin/env node
// Builds every template in both aspects from a data.json, runs `hyperframes check`, renders, and probes
// the MP4 with ffprobe. Prints one table.  node scripts/test/verify-all.mjs [data.json] [--templates a,b] [--no-render]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, listTemplates, HYPERFRAMES } from "../build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const tFlag = argv.indexOf("--templates");
const templates = tFlag >= 0 ? argv[tFlag + 1].split(",") : listTemplates().map((t) => t.name);
const data = argv.find((a, i) => !a.startsWith("--") && (tFlag < 0 || i !== tFlag + 1)) ?? path.join(ROOT, "examples", "data.json");
const render = !argv.includes("--no-render");
const outRoot = path.join(ROOT, "out", "verify", path.basename(data, ".json"));
const rows = [];
let failed = 0;

for (const template of templates) {
  for (const aspect of ["16x9", "9x16"]) {
    const out = path.join(outRoot, `${template}-${aspect}`);
    fs.rmSync(out, { recursive: true, force: true });
    const summary = await build({ data, template, aspect, out, quiet: true });
    const check = spawnSync("npx", ["--yes", HYPERFRAMES, "check", "--json"], { cwd: out, encoding: "utf8", maxBuffer: 64e6 });
    const txt = check.stdout + check.stderr;
    let report = null;
    try {
      report = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
    } catch {}
    const findings = [];
    const walk = (o, d = 0) => {
      if (!o || typeof o !== "object" || d > 6) return;
      if (Array.isArray(o)) return o.forEach((x) => walk(x, d + 1));
      if (o.severity && o.code) return findings.push(`${o.severity}:${o.code}`);
      Object.values(o).forEach((v) => walk(v, d + 1));
    };
    if (report) walk(report);
    const errors = findings.filter((f) => f.startsWith("error"));
    const warnings = [...new Set(findings.filter((f) => f.startsWith("warning")).map((f) => f.split(":")[1]))];
    let probe = "skipped";
    if (render) {
      const mp4 = path.join(out, "renders", `${template}-${aspect}.mp4`);
      const r = spawnSync("npx", ["--yes", HYPERFRAMES, "render", "--quality", "looks", "--output", mp4], { cwd: out, encoding: "utf8", maxBuffer: 64e6 });
      if (r.status !== 0 || !fs.existsSync(mp4)) probe = "render failed";
      else {
        const p = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,duration", "-of", "json", mp4], { encoding: "utf8" });
        const streams = JSON.parse(p.stdout).streams;
        const video = streams.find((s) => s.codec_type === "video");
        const audio = streams.find((s) => s.codec_type === "audio");
        const dur = Number(video?.duration ?? 0);
        const ok = video && !audio && video.width === summary.width && video.height === summary.height && Math.abs(dur - summary.duration) < 0.1;
        probe = ok ? `ok ${video.width}x${video.height} ${dur.toFixed(2)}s silent` : `MISMATCH ${JSON.stringify(streams)}`;
      }
    }
    const ok = report?.ok === true && errors.length === 0 && !probe.startsWith("MISMATCH") && probe !== "render failed";
    if (!ok) failed++;
    rows.push({ template, aspect, duration: summary.duration, dropped: summary.dropped.length, check: report ? (errors.length ? `ERRORS ${errors.join(",")}` : "clean") : "no report", warnings: warnings.join(" "), probe });
  }
}
console.table(rows);
fs.writeFileSync(path.join(outRoot, "verify.json"), JSON.stringify(rows, null, 2));
console.log(failed ? `${failed} build(s) failed` : "all builds pass");
process.exit(failed ? 1 : 0);
