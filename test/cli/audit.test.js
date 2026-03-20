const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

describe("audit", () => {
  let tmpDir, audit;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cisco-ise-audit-"));
    process.env.CISCO_ISE_CONFIG_DIR = tmpDir;
    delete require.cache[require.resolve("../../cli/utils/audit.js")];
    delete require.cache[require.resolve("../../cli/utils/config.js")];
    audit = require("../../cli/utils/audit.js");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CISCO_ISE_CONFIG_DIR;
  });

  it("writes an audit entry", () => {
    audit.log({ command: "endpoint list", cluster: "lab", status: "success" });
    const file = path.join(tmpDir, "audit.jsonl");
    assert.ok(fs.existsSync(file));
    const entry = JSON.parse(fs.readFileSync(file, "utf8").trim());
    assert.equal(entry.command, "endpoint list");
    assert.ok(entry.timestamp);
  });
});
