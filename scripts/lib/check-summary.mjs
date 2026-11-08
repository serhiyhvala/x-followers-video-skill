#!/usr/bin/env node
// Summarise `hyperframes check --json` output: node scripts/lib/check-summary.mjs <report.json>
import fs from "node:fs";
const txt = fs.readFileSync(process.argv[2], "utf8");
const start = txt.indexOf("{");
const end = txt.lastIndexOf("}");
const r = JSON.parse(txt.slice(start, end + 1));
const out = [];
const walk = (o, label, depth = 0) => {
  if (!o || typeof o !== "object" || depth > 5) return;
  if (Array.isArray(o)) return o.forEach((x) => walk(x, label, depth + 1));
  if (o.severity || o.level) {
    out.push(`${label}: ${o.severity || o.level} ${o.rule || o.id || o.code || o.type || ""} ${(o.message || o.detail || "").slice(0, 200)} ${o.file || o.selector || ""} ${o.time != null ? "t=" + o.time : ""}`.trim());
    return;
  }
  for (const [k, v] of Object.entries(o)) walk(v, label + "." + k, depth + 1);
};
for (const k of Object.keys(r)) if (!["ok", "browserSkipped", "snapshots", "_meta"].includes(k)) walk(r[k], k);
console.log(`ok=${r.ok} browserSkipped=${r.browserSkipped}`);
console.log(out.length ? out.join("\n") : "(no findings)");
