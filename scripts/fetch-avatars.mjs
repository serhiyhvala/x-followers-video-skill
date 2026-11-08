#!/usr/bin/env node
// Downloads the avatar URLs in a data.json into a pfp/ folder next to it and rewrites the paths.
// A photo that cannot be fetched becomes null, so the build draws initials for it.
//
//   node scripts/fetch-avatars.mjs data.json [--dir pfp] [--force]
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--")) ?? "data.json";
const dirFlag = argv.indexOf("--dir");
const subdir = dirFlag >= 0 ? argv[dirFlag + 1] : "pfp";
const force = argv.includes("--force");

const abs = path.resolve(file);
const base = path.dirname(abs);
const data = JSON.parse(fs.readFileSync(abs, "utf8"));
fs.mkdirSync(path.join(base, subdir), { recursive: true });

/** X serves _x96 / _normal / _bigger / _200x200 thumbnails; _400x400 is the largest fixed size. */
export const fullSize = (url) => String(url).replace(/_(x96|normal|bigger|mini|200x200)(\.\w+)(\?.*)?$/, "_400x400$2");

async function download(url, dest) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "x-followers-video-skill/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) throw new Error("empty response");
    fs.writeFileSync(dest, buf);
  } finally {
    clearTimeout(timer);
  }
}

const jobs = [];
const queue = (person, name) => {
  if (!person || !person.avatar || !/^https?:/i.test(person.avatar)) return;
  const url = fullSize(person.avatar);
  const ext = (url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i) || [, "jpg"])[1].toLowerCase().replace("jpeg", "jpg");
  const rel = `${subdir}/${name}.${ext}`;
  const dest = path.join(base, rel);
  jobs.push(async () => {
    if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 200) {
      person.avatarUrl = person.avatar;
      person.avatar = rel;
      return { name, status: "kept" };
    }
    try {
      await download(url, dest);
      person.avatarUrl = person.avatar;
      person.avatar = rel;
      return { name, status: "ok" };
    } catch (e) {
      person.avatarUrl = person.avatar;
      person.avatar = null;
      return { name, status: `failed (${e.message}); initials will be drawn` };
    }
  });
};

queue(data.me, "me");
(data.followers ?? []).forEach((p, i) => queue(p, String(i + 1).padStart(2, "0")));

const results = [];
const workers = Array.from({ length: 6 }, async () => {
  while (jobs.length) results.push(await jobs.shift()());
});
await Promise.all(workers);

fs.writeFileSync(abs, JSON.stringify(data, null, 2) + "\n");
const counts = results.reduce((m, r) => ((m[r.status.split(" ")[0]] = (m[r.status.split(" ")[0]] ?? 0) + 1), m), {});
for (const r of results) if (r.status.startsWith("failed")) console.log(`  ${r.name}: ${r.status}`);
console.log(`avatars: ${JSON.stringify(counts)} -> ${path.join(base, subdir)}; ${path.relative(process.cwd(), abs)} updated`);
