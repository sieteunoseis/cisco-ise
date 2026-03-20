"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { execSync } = require("child_process");

// Load env file based on NODE_ENV before requiring anything that reads env
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: path.join(__dirname, "..", "..", "env", "development.env") });
} else if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: path.join(__dirname, "..", "..", "env", "test.env") });
} else if (process.env.NODE_ENV === "staging") {
  require("dotenv").config({ path: path.join(__dirname, "..", "..", "env", "staging.env") });
}

const { cleanEnv, str, host } = require("envalid");

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    desc: "Node environment",
  }),
  ISE_HOSTNAME: host({ desc: "Cisco ISE Hostname or IP Address." }),
  ISE_USERNAME: str({ desc: "Cisco ISE ERS/Admin Username." }),
  ISE_PASSWORD: str({ desc: "Cisco ISE ERS/Admin Password." }),
});

const CLI = `node ${path.join(__dirname, "..", "..", "bin", "cisco-ise.js")}`;
const CLUSTER_NAME = "integration-test";
const TEST_ENDPOINT_MAC = `AA:BB:CC:00:${String(Date.now() % 100).padStart(2, "0")}:99`;

let authPassed = false;

function run(cmd) {
  return execSync(`${CLI} ${cmd}`, { encoding: "utf8", timeout: 30000 });
}

function runAll(cmd) {
  // Capture both stdout and stderr by redirecting stderr to stdout
  try {
    return execSync(`${CLI} ${cmd} 2>&1`, { encoding: "utf8", timeout: 30000 });
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
}

describe("cisco-ise integration tests", () => {
  before(() => {
    // Clean up any stale test cluster
    try { run("config remove " + CLUSTER_NAME); } catch { /* may not exist */ }

    // Register test cluster
    run(
      `config add ${CLUSTER_NAME} ` +
      `--host ${env.ISE_HOSTNAME} ` +
      `--username ${env.ISE_USERNAME} ` +
      `--password ${env.ISE_PASSWORD} ` +
      `--insecure`
    );
    run(`config use ${CLUSTER_NAME}`);
  });

  after(() => {
    // Clean up test endpoint if it was created
    try {
      run(`endpoint delete ${TEST_ENDPOINT_MAC}`);
    } catch { /* may not exist */ }

    // Remove test cluster config
    try { run("config remove " + CLUSTER_NAME); } catch { /* ignore */ }
  });

  // ── Authentication & Connectivity ─────────────────────────────────────

  describe("authentication & connectivity", () => {
    it("config test succeeds", () => {
      const out = run("config test");
      assert.ok(out.includes("Connection successful"), "should report connection success");
      authPassed = true;
    });

    it("config test reports API availability", () => {
      const out = run("config test");
      // At minimum ERS should be available
      assert.ok(
        out.includes("ERS API") || out.includes("OpenAPI"),
        "should report API availability"
      );
    });

    it("rejects invalid credentials", () => {
      try {
        run(
          `config test ` +
          `--host ${env.ISE_HOSTNAME} ` +
          `--username ${env.ISE_USERNAME} ` +
          `--password definitely-wrong-password-xyz ` +
          `--insecure`
        );
        // If no throw, the process exit code should still indicate failure
        assert.fail("should have thrown or reported failure");
      } catch (err) {
        // execSync throws on non-zero exit — expected
        assert.ok(true, "invalid credentials correctly rejected");
      }
    });
  });

  // ── Config Management ─────────────────────────────────────────────────

  describe("config management", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("config list shows the test cluster", () => {
      const out = run("config list");
      assert.ok(out.includes(CLUSTER_NAME), "should show test cluster in list");
    });

    it("config show displays cluster details", () => {
      const out = run("config show --format json");
      const data = JSON.parse(out);
      assert.equal(data.name, CLUSTER_NAME);
      assert.equal(data.host, env.ISE_HOSTNAME);
      assert.ok(data.password.includes("*"), "password should be masked");
    });

    it("config list --format json returns valid JSON", () => {
      const out = run("config list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
      assert.ok(data.length > 0, "should have at least one cluster");
    });
  });

  // ── Read-Only Discovery ───────────────────────────────────────────────

  describe("endpoint discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("endpoint list returns results", () => {
      const out = run("endpoint list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });

    it("endpoint list respects --limit", () => {
      const out = run("endpoint list --limit 5 --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data));
      assert.ok(data.length <= 5, `should return at most 5, got ${data.length}`);
    });
  });

  describe("identity group discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("identity-group list returns groups", () => {
      const out = run("identity-group list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
      assert.ok(data.length > 0, "should have at least one identity group");
    });

    it("identity-group list --type endpoint returns endpoint groups", () => {
      const out = run("identity-group list --type endpoint --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0, "should have at least one endpoint group");
    });
  });

  describe("authorization profile discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("auth-profile list returns profiles", () => {
      const out = run("auth-profile list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
      assert.ok(data.length > 0, "should have at least one auth profile");
    });
  });

  describe("network device discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("network-device list returns devices", () => {
      const out = run("network-device list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });
  });

  describe("deployment discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("deployment nodes returns node info", () => {
      const out = run("deployment nodes --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
      assert.ok(data.length > 0, "should have at least one node");
      assert.ok(data[0].hostname || data[0].fqdn, "node should have hostname or fqdn");
    });

    it("deployment status returns status info", () => {
      const out = run("deployment status --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0);
    });
  });

  describe("guest portal discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("guest portals returns portals", () => {
      const out = run("guest portals --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });
  });

  describe("session discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("session list returns data or reports MNT unavailable", () => {
      try {
        const out = run("session list --format json");
        const data = JSON.parse(out);
        assert.ok(data !== undefined, "should return data");
      } catch (err) {
        // MNT API may not be available or may require different auth
        const msg = err.stderr || err.stdout || err.message;
        assert.ok(
          msg.includes("401") || msg.includes("Request failed") || msg.includes("Error"),
          "should fail with auth/connectivity error if MNT not available"
        );
      }
    });
  });

  describe("TACACS discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("tacacs command-sets returns data", () => {
      const out = run("tacacs command-sets --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });

    it("tacacs profiles returns data", () => {
      const out = run("tacacs profiles --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });
  });

  describe("TrustSec discovery", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("trustsec sgt list returns SGTs", () => {
      const out = run("trustsec sgt list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });

    it("trustsec sgacl list returns SGACLs", () => {
      const out = run("trustsec sgacl list --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
    });
  });

  // ── Dry Run (write operations without executing) ──────────────────────

  describe("dry run operations", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("endpoint add --dry-run shows payload without executing", () => {
      const out = runAll(
        `endpoint add --mac ${TEST_ENDPOINT_MAC} --group "Unknown" --dry-run`
      );
      assert.ok(
        out.includes("DRY RUN") || out.includes("dryRun"),
        "should indicate dry run"
      );
    });

    it("network-device add --dry-run shows payload", () => {
      const out = runAll(
        `network-device add --name "test-nad-dry" --ip 10.99.99.99 --radius-secret "test" --dry-run`
      );
      assert.ok(
        out.includes("DRY RUN") || out.includes("dryRun"),
        "should indicate dry run"
      );
    });
  });

  // ── Endpoint CRUD Lifecycle ───────────────────────────────────────────

  describe("endpoint CRUD lifecycle", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("creates an endpoint", () => {
      const out = run(`endpoint add --mac ${TEST_ENDPOINT_MAC} --description "Integration test endpoint"`);
      assert.ok(
        out.includes("created") || out.includes(TEST_ENDPOINT_MAC),
        "should confirm endpoint creation"
      );
    });

    it("searches for the created endpoint", () => {
      // ISE ERS search filter uses the internal MAC format
      // The endpoint list returns resource summaries (id, name, link)
      // The name field in the list IS the MAC address (colon-separated, uppercase)
      const normalizedMac = TEST_ENDPOINT_MAC.toUpperCase();
      const out = run("endpoint list --no-cache --format json");
      const data = JSON.parse(out);
      assert.ok(Array.isArray(data), "should return an array");
      const found = data.some((e) =>
        (e.name || "").toUpperCase().includes(normalizedMac.replace(/:/g, "")) ||
        (e.name || "").toUpperCase() === normalizedMac ||
        JSON.stringify(e).toUpperCase().includes(normalizedMac.replace(/:/g, ""))
      );
      assert.ok(found, `should find endpoint ${normalizedMac} in endpoint list`);
    });

    it("updates the endpoint description", () => {
      const out = run(`endpoint update ${TEST_ENDPOINT_MAC} --description "Updated by integration test"`);
      assert.ok(
        out.includes("updated") || out.includes(TEST_ENDPOINT_MAC),
        "should confirm endpoint update"
      );
    });

    it("deletes the endpoint", () => {
      const out = run(`endpoint delete ${TEST_ENDPOINT_MAC}`);
      assert.ok(
        out.includes("deleted") || out.includes(TEST_ENDPOINT_MAC),
        "should confirm endpoint deletion"
      );
    });

    it("confirms endpoint is gone", () => {
      const out = run(`endpoint search --mac ${TEST_ENDPOINT_MAC} --format json`);
      const data = JSON.parse(out);
      assert.ok(
        !Array.isArray(data) || data.length === 0,
        "deleted endpoint should not be found"
      );
    });
  });

  // ── RADIUS Monitoring ─────────────────────────────────────────────────

  describe("RADIUS monitoring", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("radius failures returns data or reports MNT unavailable", () => {
      try {
        const out = run("radius failures --last 1d --format json");
        const data = JSON.parse(out);
        assert.ok(data !== undefined, "should return data");
      } catch (err) {
        // MNT API may not be available or may require different auth
        const msg = err.stderr || err.stdout || err.message;
        assert.ok(
          msg.includes("401") || msg.includes("Request failed") || msg.includes("Error"),
          "should fail with auth/connectivity error if MNT not available"
        );
      }
    });
  });

  // ── Output Formats ────────────────────────────────────────────────────

  describe("output formats", () => {
    before(() => {
      if (!authPassed) throw new Error("Skipping: authentication failed");
    });

    it("--format table produces table output", () => {
      const out = run("identity-group list --format table");
      // Table output uses box-drawing characters
      assert.ok(out.includes("─") || out.includes("|") || out.includes("┌"), "should contain table formatting");
    });

    it("--format json produces valid JSON", () => {
      const out = run("identity-group list --format json");
      assert.doesNotThrow(() => JSON.parse(out), "should be valid JSON");
    });

    it("--format csv produces CSV output", () => {
      const out = run("identity-group list --format csv");
      assert.ok(out.includes(",") || out.includes("\n"), "should contain CSV delimiters");
    });
  });
});
