const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError, printDryRun } = require("../utils/output.js");
const { checkWriteAllowed } = require("../utils/confirm.js");
const { normalizeMac } = require("../utils/mac.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

function extractSessions(mntData) {
  const list = mntData?.activeList?.activeSession;
  if (!list) return [];
  const sessions = Array.isArray(list) ? list : [list];
  return sessions.map((s) => {
    const row = {
      user: s.user_name || s.calling_station_id || "unknown",
      mac: s.calling_station_id || "",
      nas: s.nas_ip_address || "",
      server: s.server || s.acs_server || "",
    };
    if (s.framed_ip_address) row.ip = s.framed_ip_address;
    if (s.acct_session_id) row.sessionId = s.acct_session_id;
    if (s.acct_status_type) row.status = s.acct_status_type;
    if (s.nas_port_id) row.port = s.nas_port_id;
    return row;
  });
}

module.exports = function (program) {
  const cmd = program.command("session").description("Manage active ISE sessions");

  cmd.command("list")
    .description("List active sessions")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const data = await client.mntGet("/Session/ActiveList");
        const sessions = extractSessions(data);
        await printResult(sessions, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("search")
    .description("Search active sessions")
    .option("--mac <mac>", "filter by MAC address")
    .option("--user <user>", "filter by username")
    .option("--nas <nas>", "filter by NAS IP")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const data = await client.mntGet("/Session/ActiveList");
        let sessions = extractSessions(data);

        if (opts.mac) {
          const normalized = normalizeMac(opts.mac).replace(/:/g, "");
          sessions = sessions.filter((s) => s.mac.replace(/[:\-\.]/g, "").toUpperCase().includes(normalized));
        }
        if (opts.user) {
          const search = opts.user.toLowerCase();
          sessions = sessions.filter((s) => s.user.toLowerCase().includes(search));
        }
        if (opts.nas) {
          sessions = sessions.filter((s) => s.nas.includes(opts.nas));
        }

        await printResult(sessions, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("disconnect <mac>")
    .description("Disconnect a session by MAC address")
    .action(async (mac, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, { debug: globalOpts.debug });

        const normalized = normalizeMac(mac);
        // Find the session to get the NAS IP
        const data = await client.mntGet("/Session/ActiveList");
        const sessions = extractSessions(data);
        const cleanMac = normalized.replace(/:/g, "");
        const session = sessions.find((s) => s.mac.replace(/[:\-\.]/g, "").toUpperCase() === cleanMac);
        if (!session) throw new Error(`No active session found for MAC ${normalized}`);

        if (globalOpts.dryRun) {
          printDryRun({ method: "GET", url: client.mntUrl(`/CoA/Disconnect/${conn.host}/${normalized}/1`) });
          return;
        }

        await client.mntGet(`/CoA/Disconnect/${conn.host}/${normalized}/1`);
        if (globalOpts.audit !== false) audit.log({ command: "session disconnect", mac: normalized });
        console.log(`Session for ${normalized} disconnected.`);
      } catch (err) { printError(err); }
    });

  cmd.command("reauth <mac>")
    .description("Reauthenticate a session by MAC address")
    .action(async (mac, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, { debug: globalOpts.debug });

        const normalized = normalizeMac(mac);
        if (globalOpts.dryRun) {
          printDryRun({ method: "GET", url: client.mntUrl(`/CoA/Reauth/${conn.host}/${normalized}/1`) });
          return;
        }

        await client.mntGet(`/CoA/Reauth/${conn.host}/${normalized}/1`);
        if (globalOpts.audit !== false) audit.log({ command: "session reauth", mac: normalized });
        console.log(`Session for ${normalized} reauthenticated.`);
      } catch (err) { printError(err); }
    });
};
