const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

let config;
let tmpDir;

describe("config utility", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cisco-ise-test-"));
    process.env.CISCO_ISE_CONFIG_DIR = tmpDir;
    delete require.cache[require.resolve("../../cli/utils/config.js")];
    config = require("../../cli/utils/config.js");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CISCO_ISE_CONFIG_DIR;
  });

  it("creates config file on first addCluster", () => {
    config.addCluster("lab", { host: "10.0.0.1", username: "admin", password: "pass" });
    const data = config.loadConfig();
    assert.equal(data.clusters.lab.host, "10.0.0.1");
    assert.equal(data.activeCluster, "lab");
  });

  it("sets active cluster", () => {
    config.addCluster("a", { host: "1", username: "u", password: "p" });
    config.addCluster("b", { host: "2", username: "u", password: "p" });
    config.useCluster("b");
    assert.equal(config.loadConfig().activeCluster, "b");
  });

  it("removes a cluster", () => {
    config.addCluster("lab", { host: "1", username: "u", password: "p" });
    config.removeCluster("lab");
    assert.equal(config.loadConfig().clusters.lab, undefined);
  });

  it("throws when using nonexistent cluster", () => {
    assert.throws(() => config.useCluster("nope"), /not found/i);
  });

  it("stores readOnly flag", () => {
    config.addCluster("prod", { host: "1", username: "u", password: "p", readOnly: true });
    assert.equal(config.loadConfig().clusters.prod.readOnly, true);
  });

  it("updates cluster fields", () => {
    config.addCluster("lab", { host: "1", username: "u", password: "p" });
    config.updateCluster("lab", { host: "2", readOnly: true });
    const cluster = config.loadConfig().clusters.lab;
    assert.equal(cluster.host, "2");
    assert.equal(cluster.readOnly, true);
    assert.equal(cluster.username, "u");
  });
});
