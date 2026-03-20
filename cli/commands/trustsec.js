const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("trustsec").description("TrustSec SGT and SGACL management (read-only)");

  const sgt = cmd.command("sgt").description("Security Group Tags");

  sgt.command("list")
    .description("List all SGTs")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/sgt");
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  const sgacl = cmd.command("sgacl").description("Security Group ACLs");

  sgacl.command("list")
    .description("List all SGACLs")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/sgacl");
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
