const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { parseDuration } = require("../utils/time.js");
const IseClient = require("../utils/api.js");

function extractVal(field) {
  if (field == null) return "";
  if (typeof field === "object" && "#text" in field) return field["#text"];
  return String(field);
}

function parseAuthRecords(data) {
  const list = data?.authStatusOutputList?.authStatusList;
  if (!list) return [];
  const elements = list.authStatusElements;
  if (!elements) return [];
  const arr = Array.isArray(elements) ? elements : [elements];
  return arr.map((r) => ({
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
  }));
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
        const data = await client.mntGet(`/AuthStatus/MACAddress/${opts.mac}/${seconds}/0/All`);
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
