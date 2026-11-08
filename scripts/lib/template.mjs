// {{key}} substitution for template files. Keys resolve from the context; a missing key fails the build.
export function render(src, ctx, file) {
  return src.replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
    if (value === undefined) throw new Error(`${file}: no value for {{${key}}}`);
    return String(value);
  });
}
