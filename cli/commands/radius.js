const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { parseDuration } = require("../utils/time.js");
const { createSpinner } = require("../utils/spinner.js");
const { matchFailure } = require("../utils/failure-reasons.js");
const IseClient = require("../utils/api.js");

function extractVal(field) {
  if (field == null) return "";
  if (typeof field === "object" && "#text" in field) return field["#text"];
  return String(field);
}

function parseOtherAttrs(str) {
  if (!str) return {};
  const attrs = {};
  const parts = str.split(":!:");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq > 0) {
      const key = part.substring(0, eq).trim();
      const val = part.substring(eq + 1).trim();
      attrs[key] = val;
    }
  }
  return attrs;
}

function parseAuthRecords(data) {
  const list = data?.authStatusOutputList?.authStatusList;
  if (!list) return [];
  const elements = list.authStatusElements;
  if (!elements) return [];
  const arr = Array.isArray(elements) ? elements : [elements];
  return arr.map((r) => {
    const attrs = parseOtherAttrs(r.other_attr_string);
    return {
      timestamp: r.acs_timestamp || "",
      user: r.user_name || "",
      mac: r.calling_station_id || "",
      nas: r.nas_ip_address || "",
      device: r.network_device_name || "",
      protocol: r.authentication_protocol || "",
      method: r.authentication_method || "",
      passed: extractVal(r.passed),
      failed: extractVal(r.failed),
      group: r.identity_group || "",
      server: r.acs_server || "",
      failureReason: r.failure_reason || "",
      selectedProfile: r.selected_azn_profiles || "",
      identityStore: r.identity_store || "",
      responseTime: r.response_time || 0,
      messageCode: r.message_code || 0,
      executionSteps: r.execution_steps || "",
      response: r.response || "",
      policySet: attrs.ISEPolicySetName || "",
      authnRule: attrs.IdentityPolicyMatchedRule || "",
      authzRule: attrs.AuthorizationPolicyMatchedRule || "",
      authStatus: attrs.AuthenticationStatus || "",
      nasPortType: r.nas_port_type || "",
      tlsVersion: attrs.TLSVersion || "",
      tlsCipher: attrs.TLSCipher || "",
    };
  });
}

module.exports = function (program) {
  const cmd = program.command("radius").description("RADIUS authentication monitoring");

  cmd.command("auth-log")
    .description("Show RADIUS auth log for a MAC address")
    .option("--mac <mac>", "MAC address to look up")
    .option("--last <duration>", "time window (e.g., 30m, 2h, 1d)", "1d")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

        if (!opts.mac) throw new Error("--mac is required");

        const seconds = Math.ceil(parseDuration(opts.last) / 1000);
        const spinner = createSpinner("Querying ISE auth log...");
        const data = await client.mntGet(`/AuthStatus/MACAddress/${opts.mac}/${seconds}/0/All`);
        spinner.stop();
        const records = parseAuthRecords(data);

        const results = records.map((r) => ({
          timestamp: r.timestamp,
          user: r.user,
          mac: r.mac,
          result: r.passed === "true" || r.passed === true ? "PASS" : "FAIL",
          method: r.method,
          protocol: r.protocol,
          device: r.device,
          server: r.server,
        }));

        await printResult(results, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("failures")
    .description("Show RADIUS authentication failures")
    .option("--mac <mac>", "filter by MAC address")
    .option("--last <duration>", "time window (e.g., 30m, 2h, 1d)", "1d")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

        // If MAC provided, use AuthStatus for that MAC
        if (opts.mac) {
          const seconds = Math.ceil(parseDuration(opts.last) / 1000);
          const data = await client.mntGet(`/AuthStatus/MACAddress/${opts.mac}/${seconds}/0/All`);
          const records = parseAuthRecords(data).filter((r) =>
            extractVal(r.failed) === "true" || extractVal(r.failed) === true
          );
          const results = records.map((r) => ({
            timestamp: r.timestamp,
            user: r.user,
            mac: r.mac,
            device: r.device,
            reason: r.failureReason || "Unknown",
          }));
          await printResult(results, globalOpts.format);
          return;
        }

        // No MAC — try to get active sessions and check each
        const sessionData = await client.mntGet("/Session/ActiveList");
        const sessions = sessionData?.activeList?.activeSession;
        if (!sessions) {
          await printResult([], globalOpts.format);
          return;
        }
        const sessionList = Array.isArray(sessions) ? sessions : [sessions];
        const macs = [...new Set(sessionList.map((s) => s.calling_station_id).filter(Boolean))];

        const seconds = Math.ceil(parseDuration(opts.last) / 1000);
        const allFailures = [];
        for (const mac of macs) {
          try {
            const data = await client.mntGet(`/AuthStatus/MACAddress/${mac}/${seconds}/0/All`);
            const records = parseAuthRecords(data).filter((r) =>
              extractVal(r.failed) === "true" || extractVal(r.failed) === true
            );
            allFailures.push(...records);
          } catch { /* skip MACs that error */ }
        }

        const results = allFailures.map((r) => ({
          timestamp: r.timestamp,
          user: r.user,
          mac: r.mac,
          device: r.device,
          reason: r.failureReason || "Unknown",
        }));
        await printResult(results, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("troubleshoot")
    .description("Troubleshoot RADIUS auth for a MAC — shows detailed analysis with remediation")
    .option("--mac <mac>", "MAC address to troubleshoot")
    .option("--last <duration>", "time window (e.g., 30m, 2h, 1d)", "1d")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

        if (!opts.mac) throw new Error("--mac is required");

        const seconds = Math.ceil(parseDuration(opts.last) / 1000);
        const spinner = createSpinner("Analyzing RADIUS auth history...");
        const data = await client.mntGet(`/AuthStatus/MACAddress/${opts.mac}/${seconds}/0/All`);
        spinner.stop();
        const records = parseAuthRecords(data);

        if (records.length === 0) {
          console.log(`No authentication records found for ${opts.mac} in the last ${opts.last}.`);
          console.log("Possible causes:");
          console.log("  - Device has not attempted to authenticate");
          console.log("  - MAC address is incorrect");
          console.log("  - Network device is not sending RADIUS to ISE");
          return;
        }

        if (globalOpts.format === "json") {
          await printResult(records, "json");
          return;
        }

        // Summary header
        const latest = records[0];
        const failures = records.filter((r) => String(r.failed) === "true");
        const passes = records.filter((r) => String(r.passed) === "true");

        console.log(`\n  RADIUS Troubleshoot: ${opts.mac}`);
        console.log(`  ${"─".repeat(50)}`);
        console.log(`  Records found:  ${records.length} (${passes.length} passed, ${failures.length} failed)`);
        console.log(`  Time window:    last ${opts.last}`);
        console.log(`  Latest attempt: ${latest.timestamp}`);
        console.log(`  Latest result:  ${String(latest.passed) === "true" ? "PASS ✓" : "FAIL ✗"}`);
        if (latest.user) console.log(`  Username:       ${latest.user}`);
        if (latest.device) console.log(`  Network device: ${latest.device}`);
        if (latest.nasPortType) console.log(`  Access type:    ${latest.nasPortType}`);
        if (latest.protocol) console.log(`  Auth protocol:  ${latest.protocol}`);
        if (latest.method) console.log(`  Auth method:    ${latest.method}`);
        if (latest.identityStore) console.log(`  Identity store: ${latest.identityStore}`);
        if (latest.policySet) console.log(`  Policy set:     ${latest.policySet}`);
        if (latest.authnRule) console.log(`  Authn rule:     ${latest.authnRule}`);
        if (latest.authzRule) console.log(`  Authz rule:     ${latest.authzRule}`);
        if (latest.selectedProfile) console.log(`  Authz profile:  ${latest.selectedProfile}`);
        if (latest.tlsVersion) console.log(`  TLS:            ${latest.tlsVersion} (${latest.tlsCipher})`);
        if (latest.responseTime) console.log(`  Response time:  ${latest.responseTime}ms`);

        // Parse VLAN from response
        if (latest.response) {
          const vlanMatch = latest.response.match(/Tunnel-Private-Group-ID=\(tag=\d+\)\s*(\S+)/);
          if (vlanMatch) console.log(`  Assigned VLAN:  ${vlanMatch[1]}`);
        }

        // Show auth timeline
        console.log(`\n  Auth Timeline`);
        console.log(`  ${"─".repeat(50)}`);
        for (const r of records) {
          const status = String(r.passed) === "true" ? "PASS ✓" : "FAIL ✗";
          const user = r.user ? ` (${r.user})` : "";
          const rule = r.authzRule ? ` → ${r.authzRule}` : "";
          const reason = r.failureReason ? ` [${r.failureReason}]` : "";
          console.log(`  ${r.timestamp}  ${status}${user}${rule}${reason}`);
        }

        // Failure analysis
        if (failures.length > 0) {
          console.log(`\n  Failure Analysis`);
          console.log(`  ${"─".repeat(50)}`);

          for (const f of failures) {
            console.log(`\n  ${f.timestamp}:`);
            if (f.failureReason) {
              console.log(`    Reason: ${f.failureReason}`);
              const match = matchFailure(f.failureReason, f.messageCode);
              if (match) {
                if (match.causes?.length) {
                  console.log(`    Causes: ${match.causes[0]}`);
                  for (let i = 1; i < match.causes.length; i++) {
                    console.log(`            ${match.causes[i]}`);
                  }
                }
                console.log(`    Fix:    ${match.fix}`);
              }
            }
          }
        }

        // Recommendations
        if (passes.length > 0 && failures.length > 0) {
          console.log(`\n  Recommendation`);
          console.log(`  ${"─".repeat(50)}`);
          console.log("  This device has both successful and failed auths.");
          console.log("  This typically indicates intermittent issues —");
          console.log("  check the failure timestamps against network events.");
        } else if (passes.length === 0 && failures.length > 0) {
          console.log(`\n  Recommendation`);
          console.log(`  ${"─".repeat(50)}`);
          console.log("  All auth attempts failed. Check the failure reasons above.");
          console.log("  Common issues: wrong credentials, user not found,");
          console.log("  certificate trust, or shared secret mismatch.");
        }

        console.log("");
      } catch (err) { printError(err); }
    });

  cmd.command("live")
    .description("Live monitoring of RADIUS sessions (Ctrl+C to stop)")
    .option("--interval <seconds>", "polling interval in seconds", parseInt, 5)
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

        const seen = new Set();
        const interval = (opts.interval || 5) * 1000;

        process.stderr.write("Live RADIUS monitoring started. Press Ctrl+C to stop.\n");

        const poll = async () => {
          try {
            const data = await client.mntGet("/Session/ActiveList");
            const sessions = data?.activeList?.activeSession;
            if (!sessions) return;
            const list = Array.isArray(sessions) ? sessions : [sessions];
            for (const s of list) {
              const key = s.calling_station_id + "|" + s.user_name;
              if (!seen.has(key)) {
                seen.add(key);
                console.log(JSON.stringify({
                  timestamp: new Date().toISOString(),
                  user: s.user_name || "",
                  mac: s.calling_station_id || "",
                  nas: s.nas_ip_address || "",
                  server: s.server || "",
                }));
              }
            }
          } catch (err) {
            process.stderr.write(`Poll error: ${err.message}\n`);
          }
        };

        await poll();
        const timer = setInterval(poll, interval);
        process.on("SIGINT", () => {
          clearInterval(timer);
          process.stderr.write("\nStopped.\n");
          process.exit(0);
        });
      } catch (err) { printError(err); }
    });
};
