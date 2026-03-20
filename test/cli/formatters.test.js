const { describe, it } = require("node:test");
const assert = require("node:assert");
const table = require("../../cli/formatters/table.js");
const json = require("../../cli/formatters/json.js");
const csv = require("../../cli/formatters/csv.js");

const data = [
  { name: "endpoint1", mac: "AA:BB:CC:DD:EE:FF" },
  { name: "endpoint2", mac: "11:22:33:44:55:66" },
];

describe("formatters", () => {
  it("table returns string with data", () => {
    const out = table(data);
    assert.ok(out.includes("endpoint1"));
    assert.ok(out.includes("AA:BB:CC:DD:EE:FF"));
  });

  it("json returns valid JSON", () => {
    const out = json(data);
    const parsed = JSON.parse(out);
    assert.equal(parsed.length, 2);
  });

  it("csv returns CSV with headers", () => {
    const out = csv(data);
    assert.ok(out.includes("name"));
    assert.ok(out.includes("endpoint1"));
  });

  it("table handles empty array", () => {
    const out = table([]);
    assert.ok(out.includes("No results"));
  });

  it("table handles single object", () => {
    const out = table({ name: "test", value: "123" });
    assert.ok(out.includes("test"));
    assert.ok(out.includes("123"));
  });
});
