const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

describe("ISE API client", () => {
  let tmpDir, IseClient;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cisco-ise-api-"));
    process.env.CISCO_ISE_CONFIG_DIR = tmpDir;
    delete require.cache[require.resolve("../../cli/utils/api.js")];
    IseClient = require("../../cli/utils/api.js");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CISCO_ISE_CONFIG_DIR;
  });

  it("constructs ERS URL correctly", () => {
    const client = new IseClient({ host: "ise.example.com", username: "u", password: "p" });
    assert.equal(client.ersUrl("/endpoint"), "https://ise.example.com:9060/ers/config/endpoint");
  });

  it("constructs OpenAPI URL correctly", () => {
    const client = new IseClient({ host: "ise.example.com", username: "u", password: "p" });
    assert.equal(client.openApiUrl("/deployment/node"), "https://ise.example.com/api/v1/deployment/node");
  });

  it("constructs MNT URL correctly", () => {
    const client = new IseClient({ host: "ise.example.com", username: "u", password: "p" });
    assert.equal(client.mntUrl("/Session/ActiveList"), "https://ise.example.com/admin/API/mnt/Session/ActiveList");
  });

  it("generates cache key from URL and params", () => {
    const client = new IseClient({ host: "ise.example.com", username: "u", password: "p" });
    const key1 = client.cacheKey("/endpoint", { size: 100 });
    const key2 = client.cacheKey("/endpoint", { size: 100 });
    const key3 = client.cacheKey("/endpoint", { size: 50 });
    assert.equal(key1, key2);
    assert.notEqual(key1, key3);
  });

  it("routes ERS/OpenAPI to PPAN node when configured", () => {
    const client = new IseClient({ host: "ise.example.com", ppan: "pan.example.com", username: "u", password: "p" });
    assert.equal(client.ersUrl("/endpoint"), "https://pan.example.com:9060/ers/config/endpoint");
    assert.equal(client.openApiUrl("/deployment/node"), "https://pan.example.com/api/v1/deployment/node");
    // MNT should still use default host
    assert.equal(client.mntUrl("/Session/ActiveList"), "https://ise.example.com/admin/API/mnt/Session/ActiveList");
  });

  it("routes MNT to PMNT node when configured", () => {
    const client = new IseClient({ host: "ise.example.com", pmnt: "mnt.example.com", username: "u", password: "p" });
    assert.equal(client.mntUrl("/Session/ActiveList"), "https://mnt.example.com/admin/API/mnt/Session/ActiveList");
    // ERS/OpenAPI should still use default host
    assert.equal(client.ersUrl("/endpoint"), "https://ise.example.com:9060/ers/config/endpoint");
  });

  it("routes to both PPAN and PMNT when both configured", () => {
    const client = new IseClient({ host: "ise.example.com", ppan: "pan.example.com", pmnt: "mnt.example.com", username: "u", password: "p" });
    assert.equal(client.ersUrl("/endpoint"), "https://pan.example.com:9060/ers/config/endpoint");
    assert.equal(client.openApiUrl("/deployment/node"), "https://pan.example.com/api/v1/deployment/node");
    assert.equal(client.mntUrl("/Session/ActiveList"), "https://mnt.example.com/admin/API/mnt/Session/ActiveList");
  });
});
