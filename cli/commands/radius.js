const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { resolveTimeRange } = require("../utils/time.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("radius").description("RADIUS authentication monitoring");

  cmd.command("failures")
    .description("Show RADIUS authentication failures")
    .option("--last <duration>", "time window (e.g., 30m, 2h, 1d)", "1h")
    .option("--user <user>", "filter by username")
    .option("--nas <nas>", "filter by NAS IP")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: true, debug: globalOpts.debug });

        const { from, to } = resolveTimeRange({ last: opts.last });

        // Get failure reasons for human-readable mapping
        let failureReasons = {};
        try {
          const reasonsData = await client.mntGet("/FailureReasons");
          const reasons = reasonsData?.failureReasonList?.failureReason;
          if (reasons) {
            const list = Array.isArray(reasons) ? reasons : [reasons];
            for (const r of list) {
              if (r.id && r.cause) failureReasons[r.id] = r.cause;
            }
          }
        } catch { /* failure reasons API may not be available */ }

        // Get auth status records
        const data = await client.mntGet("/Session/AuthList/null/null");
        let records = [];
        const authList = data?.authStatusList?.authStatusElements;
        if (authList) {
          const list = Array.isArray(authList) ? authList : [authList];
          records = list.filter((r) => {
            if (r.passed === "true" || r.passed === true) return false;
            const ts = new Date(r.acs_timestamp || 0).getTime();
            return ts >= from && ts <= to;
          });
        }

        if (opts.user) {
          const search = opts.user.toLowerCase();
          records = records.filter((r) => (r.user_name || "").toLowerCase().includes(search));
        }
        if (opts.nas) {
          records = records.filter((r) => (r.nas_ip_address || "").includes(opts.nas));
        }

        const results = records.map((r) => ({
          timestamp: r.acs_timestamp || "",
          user: r.user_name || "",
          mac: r.calling_station_id || "",
          nas: r.nas_ip_address || "",
          reason: failureReasons[r.failure_reason] || r.failure_reason || "Unknown",
        }));

        await printResult(results, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("live")
    .description("Live polling of RADIUS events (Ctrl+C to stop)")
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
              const id = s.acct_session_id;
              if (id && !seen.has(id)) {
                seen.add(id);
                console.log(JSON.stringify({
                  timestamp: new Date().toISOString(),
                  user: s.user_name || "",
                  mac: s.calling_station_id || "",
                  nas: s.nas_ip_address || "",
                  status: s.acct_status_type || "",
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
