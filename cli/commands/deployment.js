const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("deployment").description("ISE deployment information (read-only)");

  cmd.command("nodes")
    .description("List ISE deployment nodes")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const data = await client.openApiGet("/deployment/node");
        const nodes = data?.response || data || [];
        const result = Array.isArray(nodes) ? nodes : [nodes];
        await printResult(result.map((n) => ({
          hostname: n.hostname || n.fqdn || "",
          fqdn: n.fqdn || "",
          ip: n.ipAddress || n.ipAddresses?.[0] || "",
          roles: Array.isArray(n.roles) ? n.roles.join(", ") : (n.roles || ""),
          services: Array.isArray(n.services) ? n.services.join(", ") : (n.services || ""),
          status: n.nodeStatus || "",
        })), globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("status")
    .description("Show ISE deployment status")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const data = await client.openApiGet("/deployment/node");
        const nodes = data?.response || data || [];
        const result = Array.isArray(nodes) ? nodes : [nodes];
        await printResult(result.map((n) => ({
          hostname: n.hostname || n.fqdn || "",
          status: n.nodeStatus || "unknown",
          roles: Array.isArray(n.roles) ? n.roles.join(", ") : (n.roles || ""),
          services: Array.isArray(n.services) ? n.services.join(", ") : (n.services || ""),
        })), globalOpts.format);
      } catch (err) { printError(err); }
    });
};
