const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("identity-group").description("List ISE identity groups");

  cmd.command("list")
    .description("List identity groups")
    .option("--type <type>", "filter by type (endpoint, user)")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        let endpoint = "/endpointgroup";
        if (opts.type === "user") endpoint = "/identitygroup";

        const resources = await client.ersPaginateAll(endpoint);
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
