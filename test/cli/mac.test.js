const { describe, it } = require("node:test");
const assert = require("node:assert");
const { normalizeMac, isValidMac } = require("../../cli/utils/mac.js");

describe("MAC address normalizer", () => {
  it("normalizes colon-separated uppercase", () => {
    assert.equal(normalizeMac("AA:BB:CC:DD:EE:FF"), "AA:BB:CC:DD:EE:FF");
  });

  it("normalizes colon-separated lowercase", () => {
    assert.equal(normalizeMac("aa:bb:cc:dd:ee:ff"), "AA:BB:CC:DD:EE:FF");
  });

  it("normalizes dash-separated", () => {
    assert.equal(normalizeMac("AA-BB-CC-DD-EE-FF"), "AA:BB:CC:DD:EE:FF");
  });

  it("normalizes Cisco dot notation", () => {
    assert.equal(normalizeMac("AABB.CCDD.EEFF"), "AA:BB:CC:DD:EE:FF");
  });

  it("normalizes bare hex", () => {
    assert.equal(normalizeMac("aabbccddeeff"), "AA:BB:CC:DD:EE:FF");
  });

  it("validates correct MACs", () => {
    assert.equal(isValidMac("AA:BB:CC:DD:EE:FF"), true);
    assert.equal(isValidMac("AABB.CCDD.EEFF"), true);
    assert.equal(isValidMac("aabbccddeeff"), true);
  });

  it("rejects invalid MACs", () => {
    assert.equal(isValidMac("not-a-mac"), false);
    assert.equal(isValidMac("AA:BB:CC"), false);
    assert.equal(isValidMac(""), false);
  });
});
