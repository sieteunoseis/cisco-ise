const { resolveConnection } = require("../utils/connection.js");
const { printError } = require("../utils/output.js");
const { createSpinner } = require("../utils/spinner.js");
const config = require("../utils/config.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  program.command("doctor")
    .description("Check ISE connectivity, APIs, and configuration health")
    .action(async (opts, command) => {
      const globalOpts = command.optsWithGlobals();
      let passed = 0;
      let warned = 0;
      let failed = 0;

      const ok = (msg) => { console.log(`  ✓ ${msg}`); passed++; };
      const warn = (msg) => { console.log(`  ⚠ ${msg}`); warned++; };
      const fail = (msg) => { console.log(`  ✗ ${msg}`); failed++; };

      console.log("\n  cisco-ise doctor");
      console.log("  " + "─".repeat(50));

      // 1. Config
      console.log("\n  Configuration");
      let conn;
      try {
        const data = config.loadConfig();
        if (!data.activeCluster) {
          fail("No active cluster configured");
          console.log("    Run: cisco-ise config add <name> --host <host> --username <user> --password <pass>");
          console.log("\n  " + "─".repeat(50));
          console.log(`  Results: ${passed} passed, ${warned} warnings, ${failed} failed\n`);
          process.exitCode = 1;
          return;
        }
        ok(`Active cluster: ${data.activeCluster}`);
        const cluster = data.clusters[data.activeCluster];
        ok(`Host: ${cluster.host}`);
        ok(`Username: ${cluster.username}`);

        if (cluster.insecure) ok("TLS verification: disabled (--insecure)");
        else ok("TLS verification: enabled");

        if (cluster.readOnly) ok("Read-only mode: enabled");

        if (cluster.ppan) ok(`PPAN node: ${cluster.ppan}`);
        if (cluster.pmnt) ok(`PMNT node: ${cluster.pmnt}`);

        if (cluster.sponsorUser) ok(`Sponsor user: ${cluster.sponsorUser}`);
        else warn("No sponsor credentials — guest commands will not work");

        conn = resolveConnection(globalOpts);
      } catch (err) {
        fail(`Config error: ${err.message}`);
        console.log("\n  " + "─".repeat(50));
        console.log(`  Results: ${passed} passed, ${warned} warnings, ${failed} failed\n`);
        process.exitCode = 1;
        return;
      }

      const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

      // 2. ERS API
      console.log("\n  ERS API (port 9060)");
      const spinner1 = createSpinner("Testing ERS API...");
      try {
        await client.ersGet("/endpoint", { size: 1 });
        spinner1.stop();
        ok("ERS API: connected");

        // Check ERS read/write
        try {
          const groups = await client.ersGet("/endpointgroup", { size: 1 });
          ok(`ERS read: ${groups?.SearchResult?.total || 0} endpoint groups found`);
        } catch { warn("ERS endpoint groups: not accessible"); }
      } catch (err) {
        spinner1.stop();
        const status = err.response?.status;
        if (status === 401) fail("ERS API: authentication failed (401) — check username/password");
        else if (status === 403) fail("ERS API: forbidden (403) — user may lack ERS Admin/Operator role");
        else fail(`ERS API: ${err.message}`);
      }

      // 3. OpenAPI
      console.log("\n  OpenAPI (port 443)");
      const spinner2 = createSpinner("Testing OpenAPI...");
      try {
        const data = await client.openApiGet("/deployment/node");
        spinner2.stop();
        const nodes = data?.response || [];
        const count = Array.isArray(nodes) ? nodes.length : 1;
        ok(`OpenAPI: connected (${count} deployment node${count !== 1 ? "s" : ""})`);
      } catch (err) {
        spinner2.stop();
        const status = err.response?.status;
        if (status === 401) fail("OpenAPI: authentication failed (401)");
        else if (status === 403) warn("OpenAPI: forbidden (403) — may need Open API role");
        else fail(`OpenAPI: ${err.message}`);
      }

      // 4. MNT API
      console.log("\n  MNT API (port 443)");
      const spinner3 = createSpinner("Testing MNT API...");
      try {
        const data = await client.mntGet("/Version");
        spinner3.stop();
        const version = data?.product?.version || "unknown";
        ok(`MNT API: connected (ISE ${version})`);

        // Check active sessions
        try {
          const sessions = await client.mntGet("/Session/ActiveList");
          const count = sessions?.activeList?.["@_noOfActiveSession"] || 0;
          ok(`Active sessions: ${count}`);
        } catch { warn("MNT session list: not accessible"); }
      } catch (err) {
        spinner3.stop();
        const status = err.response?.status;
        if (status === 401) fail("MNT API: authentication failed (401) — user may need MNT Admin role");
        else if (err.message.includes("timeout")) warn("MNT API: timeout — monitoring node may be slow or unavailable");
        else fail(`MNT API: ${err.message}`);
      }

      // 5. Sponsor API
      if (conn.sponsorUser) {
        console.log("\n  Sponsor API (guest management)");
        const spinner4 = createSpinner("Testing sponsor credentials...");
        try {
          await client.sponsorGet("/guestuser", { size: 1 });
          spinner4.stop();
          ok("Sponsor API: connected");
        } catch (err) {
          spinner4.stop();
          const status = err.response?.status;
          if (status === 401) fail("Sponsor API: authentication failed (401) — check sponsor-user/sponsor-password");
          else if (status === 500) fail("Sponsor API: sponsor user not mapped to a sponsor group");
          else fail(`Sponsor API: ${err.message}`);
        }
      }

      // 6. Config file permissions
      console.log("\n  Security");
      try {
        const fs = require("fs");
        const configPath = config.getConfigPath();
        const stats = fs.statSync(configPath);
        const mode = (stats.mode & 0o777).toString(8);
        if (mode === "600") ok(`Config file permissions: ${mode} (secure)`);
        else warn(`Config file permissions: ${mode} — should be 600. Run: chmod 600 ${configPath}`);
      } catch { /* config file may not exist yet */ }

      // 7. Audit trail
      try {
        const fs = require("fs");
        const path = require("path");
        const auditPath = path.join(config.getConfigDir(), "audit.jsonl");
        if (fs.existsSync(auditPath)) {
          const stats = fs.statSync(auditPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
          ok(`Audit trail: ${sizeMB}MB`);
          if (stats.size > 8 * 1024 * 1024) warn("Audit trail approaching 10MB rotation limit");
        } else {
          ok("Audit trail: empty (no operations logged yet)");
        }
      } catch { /* ignore */ }

      // Summary
      console.log("\n  " + "─".repeat(50));
      console.log(`  Results: ${passed} passed, ${warned} warning${warned !== 1 ? "s" : ""}, ${failed} failed`);
      if (failed > 0) {
        process.exitCode = 1;
        console.log("  Status:  issues found — review failures above");
      } else if (warned > 0) {
        console.log("  Status:  healthy with warnings");
      } else {
        console.log("  Status:  all systems healthy ✓");
      }
      console.log("");
    });
};
