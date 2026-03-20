const UNITS = { m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function parseDuration(str) {
  const match = str.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid duration: "${str}". Use format like 30m, 2h, 1d`);
  return parseInt(match[1], 10) * UNITS[match[2]];
}

function resolveTimeRange(opts) {
  if (opts.last) {
    const ms = parseDuration(opts.last);
    const to = Date.now();
    return { from: to - ms, to };
  }
  if (opts.from && opts.to) {
    return { from: new Date(opts.from).getTime(), to: new Date(opts.to).getTime() };
  }
  throw new Error("Specify --last <duration> or --from <date> --to <date>");
}

module.exports = { parseDuration, resolveTimeRange };
