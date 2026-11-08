// {{key}} substitution for template files. Keys resolve from the context; a missing key fails the build.
// {{include:name}} splices templates/<template>/partials/<name> first, so scenes can share CSS and scripts.
import fs from "node:fs";
import path from "node:path";

export function expandIncludes(src, partialsDir, file, depth = 0) {
  return src.replace(/\{\{\s*include:([A-Za-z0-9_.\-]+)\s*\}\}/g, (_, name) => {
    const p = path.join(partialsDir, name);
    if (!fs.existsSync(p)) throw new Error(`${file}: no partial ${name} in ${partialsDir}`);
    if (depth > 5) throw new Error(`${file}: include nesting too deep at ${name}`);
    return expandIncludes(fs.readFileSync(p, "utf8"), partialsDir, name, depth + 1);
  });
}

export function render(src, ctx, file) {
  return src.replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
    if (value === undefined) throw new Error(`${file}: no value for {{${key}}}`);
    return String(value);
  });
}
