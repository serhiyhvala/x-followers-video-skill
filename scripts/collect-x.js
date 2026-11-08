/* x-milestone-video · collect-x.js
 *
 * Paste this whole file into the DevTools console on x.com (F12 → Console → paste → Enter), once per page:
 *   1. https://x.com/<your handle>            → follower count, your name and photo
 *   2. https://x.com/<your handle>/followers  → the newest followers (it scrolls for you)
 *   3. https://x.com/i/account_analytics      → the last 7 days (pick "7D" first)
 * Each run merges into what the previous runs saved (localStorage) and tells you what is still missing.
 * Any page is optional: the video degrades gracefully. The final data.json is copied to the clipboard
 * and printed; save it as data.json next to this skill, then run `node scripts/fetch-avatars.mjs data.json`.
 *
 * Nothing leaves your browser. Read the code before pasting: pasting code into DevTools runs it
 * with your logged-in session, so never paste code you have not read.
 *
 * An agent with a browser injects this file and calls `xmv.collect()` on each page, then `xmv.export()`.
 */
(function () {
  // ---- Selectors: X changes its DOM; when a field comes back empty, fix it here. -------------------
  var SELECTORS = {
    followersCountLink: 'a[href$="/verified_followers"], a[href$="/followers"]',
    profileName: '[data-testid="UserName"] span',
    profileAvatar: 'a[href$="/photo"] img',
    userCell: '[data-testid="UserCell"]',
    userCellHandleLink: 'a[href]',
    userCellAvatar: 'img[src*="profile_images"]',
    analyticsCharts: "main .recharts-wrapper",
    analyticsMain: "main",
  };
  var LIMIT = 60; // newest followers to keep
  var KEY = "xmv.data";
  var DAYS = 7;

  var state = load();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null") || { milestone: null, me: null, followers: null, analytics: null };
    } catch (e) {
      return { milestone: null, me: null, followers: null, analytics: null };
    }
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  function text(el) {
    return el ? (el.innerText || el.textContent || "").trim() : "";
  }
  function parseCount(s) {
    // "160 Followers", "1,234", "12.5K", "1.2M"
    var m = String(s).replace(/,/g, "").match(/([\d.]+)\s*([KM])?/i);
    if (!m) return null;
    var n = parseFloat(m[1]);
    if (m[2]) n *= m[2].toUpperCase() === "K" ? 1e3 : 1e6;
    return { value: Math.round(n), approx: !!m[2] };
  }
  function fullSize(url) {
    return String(url).replace(/_(x96|normal|bigger|mini|200x200)(\.\w+)(\?.*)?$/, "_400x400$2");
  }
  function handleFromPath() {
    var m = location.pathname.match(/^\/([A-Za-z0-9_]{1,15})(?:\/|$)/);
    return m && !/^(i|home|explore|notifications|messages|search|settings)$/.test(m[1]) ? m[1] : null;
  }
  function pageKind() {
    if (/^\/i\/account_analytics/.test(location.pathname)) return "analytics";
    if (/^\/[A-Za-z0-9_]{1,15}\/(verified_)?followers\/?$/.test(location.pathname)) return "followers";
    if (handleFromPath()) return "profile";
    return "unknown";
  }
  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  // ---- Profile ------------------------------------------------------------------------------------
  function collectProfile() {
    var handle = handleFromPath();
    var link = document.querySelector(SELECTORS.followersCountLink);
    var count = link ? parseCount(text(link)) : null;
    var nameEl = document.querySelector(SELECTORS.profileName);
    var avatar = document.querySelector(SELECTORS.profileAvatar);
    if (count) state.milestone = count.value;
    state.milestoneApprox = count ? count.approx : null;
    state.me = {
      name: text(nameEl) || handle,
      handle: handle,
      avatar: avatar ? fullSize(avatar.src) : null,
    };
    return { milestone: state.milestone, me: state.me };
  }

  // ---- Followers (newest first, as X lists them) ---------------------------------------------------
  function readCells() {
    var out = [];
    var seen = {};
    document.querySelectorAll(SELECTORS.userCell).forEach(function (cell) {
      var links = cell.querySelectorAll(SELECTORS.userCellHandleLink);
      var handle = null;
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute("href") || "";
        var m = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
        if (m) {
          handle = m[1];
          break;
        }
      }
      if (!handle || seen[handle]) return;
      seen[handle] = true;
      var lines = text(cell).split("\n").map(function (s) {
        return s.trim();
      }).filter(Boolean);
      // First text line is the display name; strip a handle that shares the line, then any "| tagline".
      var name = (lines[0] || handle).replace(new RegExp("\\s*@" + handle + "\\b.*$"), "").split("|")[0].trim() || handle;
      var img = cell.querySelector(SELECTORS.userCellAvatar);
      out.push({ name: name, handle: handle, avatar: img ? fullSize(img.src) : null });
    });
    return out;
  }
  async function collectFollowers() {
    var all = [];
    var stale = 0;
    for (var round = 0; round < 60 && all.length < LIMIT && stale < 4; round++) {
      var before = all.length;
      readCells().forEach(function (p) {
        if (!all.some(function (q) { return q.handle === p.handle; })) all.push(p);
      });
      stale = all.length === before ? stale + 1 : 0;
      window.scrollBy(0, window.innerHeight * 0.9);
      await sleep(700);
    }
    window.scrollTo(0, 0);
    state.followers = all.slice(0, LIMIT);
    if (!state.me && handleFromPath()) state.me = { name: handleFromPath(), handle: handleFromPath(), avatar: null };
    return state.followers;
  }

  // ---- Analytics (7D): exact daily values from the chart's React props, totals from the summary ----
  function fiberData(el) {
    var key = Object.keys(el).filter(function (k) { return k.indexOf("__reactFiber") === 0; })[0];
    var f = key ? el[key] : null;
    for (var i = 0; f && i < 60; i++, f = f.return) {
      var d = f.memoizedProps && f.memoizedProps.data;
      if (Array.isArray(d) && d.length) return d;
    }
    return null;
  }
  function seriesFrom(rows) {
    // rows like [{date:"Nov 2", impressions: 46641}, ...]: every numeric key becomes a series.
    var series = {};
    var labels = [];
    rows.forEach(function (row, i) {
      Object.keys(row).forEach(function (k) {
        var v = row[k];
        if (typeof v === "number") (series[k] = series[k] || [])[i] = v;
        else if (typeof v === "string" && labels.length === i) labels.push(v);
      });
    });
    return { labels: labels, series: series };
  }
  function pick(all, re) {
    for (var i = 0; i < all.length; i++) {
      var keys = Object.keys(all[i].series);
      for (var j = 0; j < keys.length; j++) if (re.test(keys[j]) && all[i].series[keys[j]].length === DAYS) return { values: all[i].series[keys[j]], labels: all[i].labels };
    }
    return null;
  }
  function collectAnalytics() {
    var charts = Array.prototype.slice.call(document.querySelectorAll(SELECTORS.analyticsCharts));
    var all = charts.map(fiberData).filter(Boolean).map(seriesFrom);
    var imp = pick(all, /impression/i);
    var fol = pick(all, /^follow|new.?follow|follows/i);
    var unf = pick(all, /unfollow/i);
    var main = text(document.querySelector(SELECTORS.analyticsMain));
    var pct = main.match(/Impressions[\s\S]{0,80}?([+\-−]?\d+(?:\.\d+)?)%/);
    var rangeM = main.match(/([A-Z][a-z]{2} \d{1,2})\s*[–-]\s*([A-Z][a-z]{2} \d{1,2})(?:,? (\d{4}))?/);
    var labels = (imp && imp.labels.length === DAYS ? imp.labels : null) || dayLabels(rangeM);
    state.analytics = imp
      ? {
          range: rangeM ? rangeM[0] : labels[0] + " – " + labels[DAYS - 1],
          days: labels,
          impressions: imp.values,
          impressionsChangePct: pct ? Math.round(parseFloat(pct[1].replace("−", "-"))) : null,
          follows: fol ? fol.values : null,
          unfollows: unf ? unf.values : null,
        }
      : null;
    state.analyticsRaw = all; // kept so a person or agent can map series by hand when the keys changed
    return state.analytics;
  }
  function dayLabels(rangeM) {
    var out = [];
    var end = rangeM ? new Date(rangeM[2] + " " + (rangeM[3] || new Date().getFullYear())) : new Date();
    for (var i = DAYS - 1; i >= 0; i--) {
      var d = new Date(end);
      d.setDate(end.getDate() - i);
      out.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return out;
  }

  // ---- Export ---------------------------------------------------------------------------------------
  function exportData() {
    var out = {
      milestone: state.milestone,
      me: state.me,
      followers: state.followers || [],
      analytics: state.analytics,
      collectedAt: new Date().toISOString().slice(0, 10),
      source: "collect-x.js",
    };
    return out;
  }
  function status() {
    var missing = [];
    if (!state.milestone) missing.push("milestone (run on https://x.com/<handle>)");
    if (!state.followers) missing.push("followers (run on https://x.com/<handle>/followers)");
    if (!state.analytics) missing.push("analytics (run on https://x.com/i/account_analytics with 7D selected)");
    return missing;
  }
  function deliver() {
    var json = JSON.stringify(exportData(), null, 2);
    var copied = false;
    try {
      if (typeof copy === "function") {
        copy(json);
        copied = true;
      }
    } catch (e) {}
    if (!copied && navigator.clipboard) navigator.clipboard.writeText(json).then(function () { console.log("%ccopied data.json to the clipboard", "color:green"); }, function () {});
    console.log("%cdata.json" + (copied ? " (copied to the clipboard)" : "") + ":", "font-weight:bold");
    console.log(json);
    var missing = status();
    if (missing.length) console.log("%cStill missing (optional): " + missing.join("; "), "color:#b36b00");
    else console.log("%cAll three pages collected. Save the JSON above as data.json.", "color:green");
    return json;
  }

  async function collect() {
    var kind = pageKind();
    if (kind === "profile") collectProfile();
    else if (kind === "followers") await collectFollowers();
    else if (kind === "analytics") collectAnalytics();
    else {
      console.warn("Open your profile, your /followers page, or x.com/i/account_analytics, then run again.");
      return null;
    }
    save();
    console.log("collected " + kind + (kind === "followers" ? " (" + state.followers.length + " people)" : kind === "profile" ? " (" + state.milestone + ")" : ""));
    deliver();
    return exportData();
  }

  window.xmv = {
    collect: collect,
    export: exportData,
    status: status,
    reset: function () {
      localStorage.removeItem(KEY);
      state = load();
    },
    selectors: SELECTORS,
    state: function () {
      return state;
    },
  };
  return collect();
})();
