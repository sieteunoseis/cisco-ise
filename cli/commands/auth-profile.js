const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const IseClient = require("../utils/api.js");

module.exports = function (program) {
  const cmd = program.command("auth-profile").description("List ISE authorization profiles");

  cmd.command("list")
    .description("List all authorization profiles")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/authorizationprofile");
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("get <name>")
    .description("Get authorization profile details")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const data = await client.ersGet("/authorizationprofile", { filter: `name.EQ.${name}`, size: 1 });
        const resources = data?.SearchResult?.resources;
        if (!resources?.length) throw new Error(`Authorization profile "${name}" not found.`);
        const detail = await client.ersGet(`/authorizationprofile/${resources[0].id}`);
        await printResult(detail?.AuthorizationProfile || detail, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
