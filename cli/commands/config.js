const { resolveConnection } = require("../utils/connection.js");
const config = require("../utils/config.js");
const { printResult, printError } = require("../utils/output.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("config").description("Manage ISE cluster configurations");

  cmd.command("add <name>")
    .description("Add a named ISE cluster")
    .action((name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const { host, username, password, ppan, pmnt, insecure, readOnly } = globalOpts;
        if (!host) throw new Error("--host is required");
        if (!username) throw new Error("--username is required");
        if (!password) throw new Error("--password is required");
        config.addCluster(name, { host, username, password, ppan, pmnt, insecure, readOnly });
        console.log(`Cluster "${name}" added successfully.`);
      } catch (err) { printError(err); }
    });

  cmd.command("use <name>")
    .description("Set the active cluster")
    .action((name) => {
      try {
        config.useCluster(name);
        console.log(`Active cluster set to "${name}".`);
      } catch (err) { printError(err); }
    });

  cmd.command("list")
    .description("List all configured clusters")
    .action(async (opts, command) => {
      try {
        const clusters = config.listClusters();
        const active = config.loadConfig().activeCluster;
        const rows = Object.entries(clusters).map(([name, c]) => ({
          name: name === active ? `${name} *` : name,
          host: c.host,
          username: c.username,
          readOnly: c.readOnly ? "yes" : "no",
        }));
        await printResult(rows, command.optsWithGlobals().format);
      } catch (err) { printError(err); }
    });

  cmd.command("show")
    .description("Show active cluster details")
    .action(async (opts, command) => {
      try {
        const data = config.loadConfig();
        const cluster = data.clusters[data.activeCluster];
        if (!cluster) throw new Error("No active cluster. Run: cisco-ise config add <name> ...");
        const details = {
          name: data.activeCluster,
          host: cluster.host,
          username: cluster.username,
          password: config.maskPassword(cluster.password),
          insecure: cluster.insecure || false,
          readOnly: cluster.readOnly || false,
        };
        if (cluster.ppan) details.ppan = cluster.ppan;
        if (cluster.pmnt) details.pmnt = cluster.pmnt;
        await printResult(details, command.optsWithGlobals().format);
      } catch (err) { printError(err); }
    });

  cmd.command("remove <name>")
    .description("Remove a cluster from config")
    .action((name) => {
      try {
        config.removeCluster(name);
        console.log(`Cluster "${name}" removed.`);
      } catch (err) { printError(err); }
    });

  cmd.command("test")
    .description("Test connection to active cluster")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { debug: globalOpts.debug });

        let ersOk = false, openApiOk = false;
        try {
          await client.ersGet("/endpoint", { size: 1 });
          ersOk = true;
        } catch { /* ERS not available */ }

        try {
          await client.openApiGet("/deployment/node");
          openApiOk = true;
        } catch { /* OpenAPI not available */ }

        if (!ersOk && !openApiOk) {
          throw new Error("Connection failed. Check host, credentials, and that ERS is enabled.");
        }
        console.log("Connection successful.");
        console.log(`  ERS API (port 9060): ${ersOk ? "\u2713" : "\u2717"}`);
        console.log(`  OpenAPI (port 443):  ${openApiOk ? "\u2713" : "\u2717"}`);
      } catch (err) { printError(err); }
    });

  cmd.command("update <name>")
    .description("Update cluster settings")
    .action((name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const updates = {};
        if (globalOpts.host) updates.host = globalOpts.host;
        if (globalOpts.username) updates.username = globalOpts.username;
        if (globalOpts.password) updates.password = globalOpts.password;
        if (globalOpts.ppan) updates.ppan = globalOpts.ppan;
        if (globalOpts.pmnt) updates.pmnt = globalOpts.pmnt;
        if (globalOpts.insecure !== undefined) updates.insecure = globalOpts.insecure;
        if (globalOpts.readOnly !== undefined) updates.readOnly = globalOpts.readOnly;
        config.updateCluster(name, updates);
        console.log(`Cluster "${name}" updated.`);
      } catch (err) { printError(err); }
    });

  cmd.command("clear-cache")
    .description("Clear response cache")
    .action((opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn);
        client.invalidateCache();
        console.log("Cache cleared.");
      } catch (err) { printError(err); }
    });
};
