const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

let resolveConnection, tmpDir;

describe("connection utility", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cisco-ise-conn-"));
    process.env.CISCO_ISE_CONFIG_DIR = tmpDir;
    delete require.cache[require.resolve("../../cli/utils/connection.js")];
    delete require.cache[require.resolve("../../cli/utils/config.js")];
    const config = require("../../cli/utils/config.js");
    config.addCluster("lab", { host: "10.0.0.1", username: "admin", password: "secret", insecure: true });
    resolveConnection = require("../../cli/utils/connection.js").resolveConnection;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CISCO_ISE_CONFIG_DIR;
    delete process.env.CISCO_ISE_HOST;
    delete process.env.CISCO_ISE_USERNAME;
    delete process.env.CISCO_ISE_PASSWORD;
  });

  it("resolves from config", () => {
    const conn = resolveConnection({});
    assert.equal(conn.host, "10.0.0.1");
    assert.equal(conn.username, "admin");
  });

  it("CLI flags override config", () => {
    const conn = resolveConnection({ host: "override.example.com" });
    assert.equal(conn.host, "override.example.com");
    assert.equal(conn.username, "admin");
  });

  it("env vars override config", () => {
    process.env.CISCO_ISE_HOST = "env.example.com";
    const conn = resolveConnection({});
    assert.equal(conn.host, "env.example.com");
  });

  it("throws when no config available", () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir);
    delete require.cache[require.resolve("../../cli/utils/connection.js")];
    delete require.cache[require.resolve("../../cli/utils/config.js")];
    resolveConnection = require("../../cli/utils/connection.js").resolveConnection;
    assert.throws(() => resolveConnection({}), /No cluster configured/i);
  });
});
