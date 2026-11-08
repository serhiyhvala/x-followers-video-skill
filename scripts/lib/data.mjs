// Parses data.json at the boundary. Everything downstream trusts the Milestone shape it returns.
import fs from "node:fs";
import path from "node:path";

export const MAX_FOLLOWERS = 60;
export const DAYS = 7;

/**
 * @typedef {{ name: string, handle: string, avatar: string | null }} Person
 * @typedef {{ range: string, days: string[], impressions: number[], impressionsChangePct: number | null,
 *             follows: number[] | null, unfollows: number[] | null }} Analytics
 * @typedef {{ milestone: number, me: Person | null, followers: Person[], analytics: Analytics | null,
 *             collectedAt: string | null, dir: string }} Milestone
 */

export class DataError extends Error {}

const isInt = (n) => Number.isInteger(n) && n >= 0;

function person(raw, where) {
  if (!raw || typeof raw !== "object") throw new DataError(`${where}: expected an object`);
  const handle = String(raw.handle ?? "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) throw new DataError(`${where}: handle "${raw.handle}" is not an X handle`);
  let name = String(raw.name ?? "").trim();
  // "Name | tagline" taglines are trimmed to the name; a missing name falls back to the handle.
  name = name.split("|")[0].trim() || handle;
  const avatar = raw.avatar == null || raw.avatar === "" ? null : String(raw.avatar);
  return { name, handle, avatar };
}

function series(raw, key, where) {
  if (raw[key] == null) return null;
  const a = raw[key];
  if (!Array.isArray(a) || a.length !== DAYS || !a.every((n) => Number.isFinite(n) && n >= 0)) {
    throw new DataError(`${where}.${key}: expected ${DAYS} non-negative numbers`);
  }
  return a.map((n) => Math.round(n));
}

function analytics(raw) {
  if (raw == null) return null;
  const where = "analytics";
  if (typeof raw !== "object") throw new DataError(`${where}: expected an object or null`);
  const impressions = series(raw, "impressions", where);
  if (!impressions) throw new DataError(`${where}.impressions is required when analytics is present`);
  const days = Array.isArray(raw.days) && raw.days.length === DAYS ? raw.days.map(String) : null;
  if (!days) throw new DataError(`${where}.days: expected ${DAYS} labels`);
  const follows = series(raw, "follows", where);
  const unfollows = series(raw, "unfollows", where) ?? (follows ? Array(DAYS).fill(0) : null);
  const pct = raw.impressionsChangePct;
  return {
    range: String(raw.range ?? `${days[0]} – ${days[DAYS - 1]}`),
    days,
    impressions,
    impressionsChangePct: Number.isFinite(pct) ? Math.round(pct) : null,
    follows,
    unfollows,
  };
}

/** @returns {Milestone} */
export function parseMilestone(raw, dir) {
  if (!raw || typeof raw !== "object") throw new DataError("data.json must hold an object");
  const milestone = Number(raw.milestone);
  if (!isInt(milestone) || milestone < 1) throw new DataError(`milestone: expected a positive integer, got ${JSON.stringify(raw.milestone)}`);
  const followersRaw = raw.followers ?? [];
  if (!Array.isArray(followersRaw)) throw new DataError("followers: expected an array");
  const followers = followersRaw.slice(0, MAX_FOLLOWERS).map((f, i) => person(f, `followers[${i}]`));
  return {
    milestone,
    me: raw.me ? person(raw.me, "me") : null,
    followers,
    analytics: analytics(raw.analytics),
    collectedAt: raw.collectedAt ? String(raw.collectedAt) : null,
    dir,
  };
}

export function loadMilestone(file) {
  const abs = path.resolve(file);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (e) {
    throw new DataError(`cannot read ${abs}: ${e.message}`);
  }
  return parseMilestone(raw, path.dirname(abs));
}

/** What the data supports, so templates and the skill can say what will be dropped. */
export function tiers(m) {
  return {
    followers: m.followers.length > 0,
    photos: m.followers.some((f) => f.avatar),
    analytics: m.analytics != null,
    growth: m.analytics?.follows != null,
  };
}
