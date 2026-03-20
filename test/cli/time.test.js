const { describe, it } = require("node:test");
const assert = require("node:assert");
const { parseDuration, resolveTimeRange } = require("../../cli/utils/time.js");

describe("time parser", () => {
  it("parses minutes", () => {
    assert.equal(parseDuration("30m"), 30 * 60 * 1000);
  });

  it("parses hours", () => {
    assert.equal(parseDuration("2h"), 2 * 60 * 60 * 1000);
  });

  it("parses days", () => {
    assert.equal(parseDuration("1d"), 24 * 60 * 60 * 1000);
  });

  it("throws on invalid duration", () => {
    assert.throws(() => parseDuration("abc"), /Invalid duration/);
  });

  it("resolveTimeRange with --last returns from/to", () => {
    const before = Date.now();
    const { from, to } = resolveTimeRange({ last: "30m" });
    const after = Date.now();
    assert.ok(to >= before && to <= after + 10);
    assert.ok(to - from >= 30 * 60 * 1000 - 10);
    assert.ok(to - from <= 30 * 60 * 1000 + 10);
  });
});
