#!/usr/bin/env node
// data.json + template name -> a ready HyperFrames project (static markup, no runtime data access).
//
//   node scripts/build.mjs --data data.json --template wall --aspect 16x9 --out out/wall-16x9
//
// Flags: --template <name|all>  --aspect <16x9|9x16|all>  --out <dir>  --list  --quiet
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadMilestone, tiers, DataError } from "./lib/data.mjs";
import { avatarSvg } from "./lib/avatars.mjs";
import { render, expandIncludes } from "./lib/template.mjs";
import * as fmt from "./lib/format.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = path.join(ROOT, "templates");
export const HYPERFRAMES = "hyperframes@0.9.23";
export const GSAP = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js";
const ASPECTS = { "16x9": { W: 1920, H: 1080 }, "9x16": { W: 1080, H: 1920 } };

function parseArgs(argv) {
  const a = { data: "data.json", template: "wall", aspect: "16x9", out: null, list: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--list") a.list = true;
    else if (k === "--quiet") a.quiet = true;
    else if (k.startsWith("--") && k.slice(2) in a) a[k.slice(2)] = argv[++i];
    else throw new Error(`unknown argument ${k}`);
  }
  return a;
}

export function listTemplates() {
  return fs
    .readdirSync(TEMPLATES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && fs.existsSync(path.join(TEMPLATES, d.name, "template.json")))
    .map((d) => ({ name: d.name, ...JSON.parse(fs.readFileSync(path.join(TEMPLATES, d.name, "template.json"), "utf8")) }));
}

function copyAvatar(person, index, outAssets, dataDir) {
  const file = index == null ? "me" : fmt.pad2(index + 1);
  if (person.avatar && !/^https?:/i.test(person.avatar)) {
    const src = path.resolve(dataDir, person.avatar);
    if (fs.existsSync(src)) {
      const ext = path.extname(src).toLowerCase() || ".jpg";
      const rel = index == null ? `assets/${file}${ext}` : `assets/pfp/${file}${ext}`;
      fs.mkdirSync(path.dirname(path.join(outAssets, "..", rel)), { recursive: true });
      fs.copyFileSync(src, path.join(outAssets, "..", rel));
      return { src: rel, photo: true };
    }
  }
  const rel = index == null ? `assets/${file}.svg` : `assets/pfp/${file}.svg`;
  fs.mkdirSync(path.dirname(path.join(outAssets, "..", rel)), { recursive: true });
  fs.writeFileSync(path.join(outAssets, "..", rel), avatarSvg(person));
  return { src: rel, photo: false };
}

/** The context every template generator and composition file sees. */
async function makeContext(m, aspect, outDir, templateName) {
  const { W, H } = ASPECTS[aspect];
  const outAssets = path.join(outDir, "assets");
  fs.mkdirSync(outAssets, { recursive: true });
  const followers = m.followers.map((p, i) => ({ ...p, i, ...copyAvatar(p, i, outAssets, m.dir) }));
  const me = m.me ? { ...m.me, ...copyAvatar(m.me, null, outAssets, m.dir) } : null;
  const from = Math.max(0, m.milestone - 3);
  return {
    template: templateName,
    aspect,
    W,
    H,
    v: aspect === "9x16",
    rootClass: aspect === "9x16" ? "v" : "h",
    milestone: m.milestone,
    milestoneText: fmt.withCommas(m.milestone),
    from,
    digits: String(m.milestone).length,
    reels: fmt.reels(from, m.milestone),
    ticks: fmt.reelSchedule(from, m.milestone),
    followers,
    me,
    meHandle: me ? me.handle : null,
    analytics: m.analytics,
    tiers: tiers(m),
    collectedAt: m.collectedAt,
    gsap: GSAP,
    fmt,
  };
}

function hostMarkup(scenes, W, H) {
  return scenes
    .map(
      (s) =>
        `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.file}" ` +
        `data-start="${s.start}" data-duration="${s.duration}" data-track-index="1" data-track-kind="graphics" ` +
        `data-width="${W}" data-height="${H}"></div>`,
    )
    .join("\n");
}

const round = (n) => Math.round(n * 1000) / 1000;

export async function build({ data, template, aspect, out, quiet = false }) {
  const m = loadMilestone(data);
  const tdir = path.join(TEMPLATES, template);
  if (!fs.existsSync(path.join(tdir, "template.json"))) throw new Error(`no template "${template}" in ${TEMPLATES}`);
  const meta = JSON.parse(fs.readFileSync(path.join(tdir, "template.json"), "utf8"));
  const outDir = path.resolve(out ?? path.join("out", `${template}-${aspect}`));
  fs.rmSync(path.join(outDir, "compositions"), { recursive: true, force: true });
  fs.rmSync(path.join(outDir, "assets"), { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "compositions"), { recursive: true });

  const ctx = await makeContext(m, aspect, outDir, template);
  const { default: generate } = await import(pathToFileURL(path.join(tdir, "generate.mjs")).href);
  const plan = generate(ctx);

  let t = 0;
  const scenes = plan.scenes.map((s) => {
    const start = round(t);
    t += s.duration;
    return { ...s, start, duration: round(s.duration) };
  });
  const duration = round(t);
  const vars = { ...ctx, ...plan.vars, scenes: hostMarkup(scenes, ctx.W, ctx.H), duration, fps: meta.fps ?? 30 };
  vars.rootVariablesList = plan.rootVariables ?? [];
  vars.rootVariables = fmt.attr(vars.rootVariablesList);

  const indexSrc = fs.readFileSync(path.join(tdir, "index.html"), "utf8");
  fs.writeFileSync(path.join(outDir, "index.html"), render(indexSrc, vars, "index.html"));
  const sceneSources = {};
  for (const s of scenes) {
    const src = expandIncludes(fs.readFileSync(path.join(tdir, "compositions", s.file), "utf8"), path.join(tdir, "partials"), s.file);
    const sceneVars = { ...vars, ...(s.vars ?? {}), sceneId: s.id, sceneDuration: s.duration };
    sceneSources[s.id] = render(src, sceneVars, s.file);
    fs.writeFileSync(path.join(outDir, "compositions", s.file), sceneSources[s.id]);
  }

  const name = `${template}-${aspect}`;
  fs.writeFileSync(
    path.join(outDir, "package.json"),
    JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        scripts: {
          dev: `npx --yes ${HYPERFRAMES} preview`,
          check: `npx --yes ${HYPERFRAMES} check`,
          render: `npx --yes ${HYPERFRAMES} render --quality delivery --output renders/${name}.mp4`,
          "render:docker": `npx --yes ${HYPERFRAMES} render --docker --quality delivery --output renders/${name}.mp4`,
        },
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(outDir, "hyperframes.json"),
    JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
        media: { autoProxy: true },
      },
      null,
      2,
    ) + "\n",
  );
  if (!fs.existsSync(path.join(outDir, "meta.json"))) {
    fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify({ id: name, name }, null, 2) + "\n");
  }
  fs.mkdirSync(path.join(outDir, "player"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "player", "index.html"), playerHtml({ ...vars, scenes, sceneSources, title: meta.title ?? template }));
  const summary = {
    template,
    aspect,
    width: ctx.W,
    height: ctx.H,
    fps: vars.fps,
    duration,
    scenes: scenes.map(({ id, start, duration }) => ({ id, start, duration })),
    tiers: ctx.tiers,
    dropped: plan.dropped ?? [],
    out: outDir,
  };
  fs.writeFileSync(path.join(outDir, "BUILD.json"), JSON.stringify(summary, null, 2) + "\n");
  if (!quiet) {
    console.log(`built ${name} -> ${path.relative(process.cwd(), outDir) || "."}`);
    console.log(`  ${ctx.W}x${ctx.H} · ${duration}s · scenes: ${scenes.map((s) => `${s.id}@${s.start}`).join(", ")}`);
    if (summary.dropped.length) console.log(`  dropped: ${summary.dropped.join("; ")}`);
    console.log(`  next: cd ${path.relative(process.cwd(), outDir) || "."} && npm run check && npm run render`);
  }
  return summary;
}

/** player/index.html: plays the built video with a small driver, for browsers without HyperFrames. Asset paths stay root-relative, so it sets <base>. */
function playerHtml(v) {
  const scenesJson = JSON.stringify(v.scenes.map(({ id, start, duration }) => ({ id, start, duration })));
  const templates = v.scenes
    .map((s) => `<template data-scene="${s.id}">${v.sceneSources[s.id].replace(/^\s*<template>|<\/template>\s*$/g, "")}</template>`)
    .join("\n");
  const vars = (v.rootVariablesList ?? []).map((d) => `--${d.id}: ${d.default};`).join(" ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="../" />
<title>${fmt.esc(v.title)} · ${v.milestoneText} followers</title>
<script src="${GSAP}"></script>
<style>
  :root { ${vars} }
  html, body { margin: 0; height: 100%; background: #1a1a1a; overflow: hidden; font-family: Inter, system-ui, sans-serif; }
  #stage-wrap { position: absolute; inset: 0; overflow: hidden; }
  #stage { position: absolute; left: 50%; top: 50%; width: ${v.W}px; height: ${v.H}px; margin: -${v.H / 2}px 0 0 -${v.W / 2}px; overflow: hidden; background: #fff; transform-origin: 50% 50%; }
  .xmv-host { position: absolute; inset: 0; }
  #bar { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; gap: 10px; align-items: center;
         background: rgba(0,0,0,.72); color: #fff; padding: 10px 14px; border-radius: 14px; font-size: 14px; transition: opacity .25s; }
  #bar.hide, body.rec #bar { opacity: 0; pointer-events: none; }
  #bar button { all: unset; cursor: pointer; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,.14); }
  #bar input[type=range] { width: 260px; }
</style>
</head>
<body>
<div id="stage-wrap"><div id="stage"></div></div>
<div id="bar">
  <button id="play">Play</button><input id="seek" type="range" min="0" max="${v.duration}" step="${1 / v.fps}" value="0" />
  <span id="clock">0.00 / ${v.duration}s</span><button id="loop" title="Loop">Loop: off</button>
  <span>Space play · ←/→ frame · R restart · H hide bar · ?rec hides it on load · ?t=seconds opens at a time</span>
</div>
${templates}
<script>
(function () {
  var SCENES = ${scenesJson}, DURATION = ${v.duration}, FPS = ${v.fps};
  window.__timelines = window.__timelines || {};
  window.__hyperframes = window.__hyperframes || { getVariables: function () { return {}; } };
  var stage = document.getElementById("stage");
  // One scene is in the DOM at a time, as in HyperFrames, so scene ids and #root never collide.
  var mounted = null, mountedStyle = null;
  function mount(s) {
    if (mounted === s.id) return;
    unmount();
    var tpl = document.querySelector('template[data-scene="' + s.id + '"]');
    var host = document.createElement("div");
    host.className = "xmv-host on"; host.id = "host-" + s.id;
    stage.appendChild(host);
    mountedStyle = document.createElement("style");
    Array.prototype.slice.call(tpl.content.children).forEach(function (node) {
      if (node.tagName === "STYLE") mountedStyle.textContent += node.textContent;
      else if (node.tagName !== "SCRIPT") host.appendChild(document.importNode(node, true));
    });
    document.head.appendChild(mountedStyle);
    Array.prototype.slice.call(tpl.content.children).forEach(function (node) {
      if (node.tagName !== "SCRIPT") return;
      var sc = document.createElement("script");
      sc.textContent = "(function(){\\n" + node.textContent + "\\n})();";
      host.appendChild(sc);
    });
    mounted = s.id;
  }
  function unmount() {
    if (!mounted) return;
    var host = document.getElementById("host-" + mounted);
    if (host) host.remove();
    if (mountedStyle) mountedStyle.remove();
    delete window.__timelines[mounted];
    mounted = null; mountedStyle = null;
  }
  function fit() {
    var k = Math.min(innerWidth / ${v.W}, innerHeight / ${v.H});
    stage.style.transform = "scale(" + k + ")";
  }
  addEventListener("resize", fit); fit();
  var t = 0, playing = false, loop = false, last = 0;
  var seek = document.getElementById("seek"), clock = document.getElementById("clock"), playBtn = document.getElementById("play");
  function show(time) {
    t = Math.max(0, Math.min(DURATION, time));
    var active = null;
    SCENES.forEach(function (s) { if (t >= s.start && t < s.start + s.duration) active = s; });
    if (!active) active = SCENES[SCENES.length - 1];
    mount(active);
    var tl = window.__timelines[active.id];
    if (tl) tl.time(Math.min(Math.max(0, t - active.start), tl.duration()), true);
    seek.value = t; clock.textContent = t.toFixed(2) + " / " + DURATION + "s";
  }
  function tick(now) {
    if (playing) {
      var dt = (now - last) / 1000; last = now;
      var next = t + dt;
      if (next >= DURATION) { if (loop) next = 0; else { next = DURATION - 1 / FPS; playing = false; playBtn.textContent = "Play"; } }
      show(next);
    }
    requestAnimationFrame(tick);
  }
  function toggle() { playing = !playing; last = performance.now(); playBtn.textContent = playing ? "Pause" : "Play"; if (playing && t >= DURATION - 1 / FPS) show(0); }
  playBtn.onclick = toggle;
  document.getElementById("loop").onclick = function () { loop = !loop; this.textContent = "Loop: " + (loop ? "on" : "off"); };
  seek.oninput = function () { show(Number(seek.value)); };
  addEventListener("keydown", function (e) {
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") show(t + 1 / FPS);
    else if (e.key === "ArrowLeft") show(t - 1 / FPS);
    else if (e.key === "r" || e.key === "R") show(0);
    else if (e.key === "h" || e.key === "H") document.getElementById("bar").classList.toggle("hide");
  });
  var q = new URLSearchParams(location.search);
  if (q.has("rec")) document.body.classList.add("rec");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { show(t); });
  show(q.has("t") ? Number(q.get("t")) : 0);
  requestAnimationFrame(function (now) { last = now; tick(now); });
})();
</script>
</body>
</html>
`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const a = parseArgs(process.argv.slice(2));
    if (a.list) {
      for (const t of listTemplates()) console.log(`${t.name.padEnd(10)} ${t.title} — ${t.description}`);
      process.exit(0);
    }
    const templates = a.template === "all" ? listTemplates().map((t) => t.name) : [a.template];
    const aspects = a.aspect === "all" ? Object.keys(ASPECTS) : a.aspect.split(",");
    for (const asp of aspects) if (!ASPECTS[asp]) throw new Error(`aspect must be 16x9 or 9x16, got ${asp}`);
    for (const template of templates) {
      for (const aspect of aspects) {
        const out = a.out && templates.length * aspects.length === 1 ? a.out : a.out ? path.join(a.out, `${template}-${aspect}`) : null;
        await build({ data: a.data, template, aspect, out, quiet: a.quiet });
      }
    }
  } catch (e) {
    console.error(`✗ ${e instanceof DataError ? "data.json: " : ""}${e.message}`);
    process.exit(1);
  }
}
