#!/usr/bin/env node
// Runs collect-x.js against the fixture pages in headless Chrome and checks the data.json it produces.
//   node scripts/test/collect-test.mjs
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileP = promisify(execFile);
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = fs.readFileSync(path.join(here, "x-fixture.html"), "utf8");
const collector = fs.readFileSync(path.join(here, "..", "collect-x.js"), "utf8");

function findChrome() {
  const env = process.env.HYPERFRAMES_CHROME || process.env.CHROME_PATH;
  if (env && fs.existsSync(env)) return env;
  const cache = path.join(os.homedir(), ".cache", "hyperframes", "chrome");
  const walk = (dir, depth) => {
    if (depth > 6 || !fs.existsSync(dir)) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
      if (e.isDirectory()) {
        const r = walk(p, depth + 1);
        if (r) return r;
      }
    }
    return null;
  };
  const bundled = walk(cache, 0);
  if (bundled) return bundled;
  for (const p of [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]) if (fs.existsSync(p)) return p;
  return null;
}

const chrome = findChrome();
if (!chrome) {
  console.log("skip: no Chrome found (run `npx hyperframes@0.9.23 browser ensure` or set CHROME_PATH)");
  process.exit(0);
}

const server = http.createServer((req, res) => {
  if (req.url === "/collect-x.js") return res.writeHead(200, { "content-type": "text/javascript" }).end(collector);
  const page = req.url.includes("account_analytics") ? "analytics" : req.url.includes("followers") ? "followers" : "profile";
  const html = fixture.replace(
    "</body>",
    `<script>window.__page="${page}";document.getElementById("${page}").hidden=false;</script>` +
      `<script>(async()=>{await new Promise(r=>setTimeout(r,50));const s=document.createElement("script");s.src="/collect-x.js";document.body.appendChild(s);` +
      `await new Promise(r=>s.onload=r);const data=await window.xmv.collect();const pre=document.createElement("pre");pre.id="xmv-out";pre.textContent=JSON.stringify(data);document.body.appendChild(pre);})();</script></body>`,
  );
  res.writeHead(200, { "content-type": "text/html" }).end(html);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "xmv-chrome-"));

// The fixture server runs in this process, so Chrome must be spawned asynchronously or the server never answers.
async function visit(p) {
  let stdout = "";
  try {
    ({ stdout } = await execFileP(
      chrome,
      ["--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, "--virtual-time-budget=20000", "--dump-dom", `http://127.0.0.1:${port}${p}`],
      { encoding: "utf8", timeout: 60000, maxBuffer: 16 * 1024 * 1024 },
    ));
  } catch (e) {
    stdout = e.stdout || "";
  }
  const m = stdout.match(/<pre id="xmv-out">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error(`no output for ${p}: ${stdout.slice(0, 600)}`);
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
}

let failed = 0;
const eq = (what, a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${ok ? "✓" : "✗"} ${what}${ok ? "" : `: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`}`);
  if (!ok) failed++;
};
try {
  const p1 = await visit("/ada_example");
  eq("milestone from the followers link", p1.milestone, 160);
  eq("me", p1.me, { name: "Ada Example", handle: "ada_example", avatar: "https://pbs.twimg.com/profile_images/1/ada_400x400.jpg" });
  const p2 = await visit("/ada_example/followers");
  eq("followers keep order, trim taglines, upsize photos", p2.followers, [
    { name: "Priya Raman", handle: "priyabuilds", avatar: "https://pbs.twimg.com/profile_images/11/p_400x400.jpg" },
    { name: "李晓明", handle: "lixiaoming_dev", avatar: "https://pbs.twimg.com/profile_images/12/l_400x400.png" },
    { name: "Hana Sato 🌸", handle: "hanasato_dev", avatar: null },
  ]);
  eq("milestone survives across pages", p2.milestone, 160);
  const p3 = await visit("/i/account_analytics");
  eq("analytics days", p3.analytics.days, ["Nov 2", "Nov 3", "Nov 4", "Nov 5", "Nov 6", "Nov 7", "Nov 8"]);
  eq("impressions from the chart props", p3.analytics.impressions, [31240, 18772, 9530, 7415, 26108, 12290, 5860]);
  eq("follows / unfollows", [p3.analytics.follows, p3.analytics.unfollows], [[14, 9, 6, 3, 19, 7, 11], [2, 1, 0, 3, 2, 0, 1]]);
  eq("change % and range from the summary text", [p3.analytics.impressionsChangePct, p3.analytics.range], [84, "Nov 2 – Nov 8, 2026"]);
  eq("everything merged", [p3.milestone, p3.followers.length, p3.me.handle], [160, 3, "ada_example"]);
} catch (e) {
  console.log(`✗ ${e.message}`);
  failed++;
} finally {
  server.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
console.log(failed ? `${failed} failed` : "collect-x.js: all checks passed");
process.exit(failed ? 1 : 0);
