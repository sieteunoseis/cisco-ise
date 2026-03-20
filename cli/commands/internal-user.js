const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError, printDryRun } = require("../utils/output.js");
const { checkWriteAllowed } = require("../utils/confirm.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

async function resolveGroupId(client, groupName) {
  const data = await client.ersGet("/identitygroup", { size: 100 });
  const groups = data?.SearchResult?.resources || [];
  const match = groups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
  if (!match) throw new Error(`Identity group "${groupName}" not found. Run: cisco-ise identity-group list --type user`);
  return match.id;
}

async function findUserByName(client, name) {
  const data = await client.ersGet("/internaluser", { filter: `name.EQ.${name}`, size: 1 });
  const resources = data?.SearchResult?.resources;
  if (!resources?.length) throw new Error(`Internal user "${name}" not found.`);
  const detail = await client.ersGet(`/internaluser/${resources[0].id}`);
  return detail?.InternalUser || detail;
}

module.exports = function (program) {
  const cmd = program.command("internal-user").description("Manage ISE internal users");

  cmd.command("list")
    .description("List internal users")
    .option("--limit <n>", "max results", parseInt)
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/internaluser", {}, { limit: opts.limit });
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("get <name>")
    .description("Get internal user details")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const user = await findUserByName(client, name);
        const { link, ...clean } = user;
        await printResult(clean, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("add")
    .description("Create an internal user")
    .option("--user-name <name>", "username")
    .option("--user-password <pass>", "user password")
    .option("--email <email>", "email address")
    .option("--first <name>", "first name")
    .option("--last <name>", "last name")
    .option("--group <name>", "identity group name")
    .option("--description <desc>", "user description")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        if (!opts.userName) throw new Error("--user-name is required");
        if (!opts.userPassword) throw new Error("--user-password is required");

        const body = {
          InternalUser: {
            name: opts.userName,
            password: opts.userPassword,
            enabled: true,
            changePassword: false,
            description: opts.description || "",
          },
        };
        if (opts.email) body.InternalUser.email = opts.email;
        if (opts.first) body.InternalUser.firstName = opts.first;
        if (opts.last) body.InternalUser.lastName = opts.last;
        if (opts.group) {
          body.InternalUser.identityGroups = await resolveGroupId(client, opts.group);
        }

        const result = await client.ersPost("/internaluser", body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "internal-user add", name: opts.userName });
        console.log(`Internal user "${opts.userName}" created.`);
      } catch (err) { printError(err); }
    });

  cmd.command("update <name>")
    .description("Update an internal user")
    .option("--user-password <pass>", "new password")
    .option("--email <email>", "email address")
    .option("--first <name>", "first name")
    .option("--last <name>", "last name")
    .option("--group <name>", "identity group name")
    .option("--description <desc>", "description")
    .option("--enable", "enable the user")
    .option("--disable", "disable the user")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findUserByName(client, name);
        const body = {
          InternalUser: {
            id: existing.id,
            name: existing.name,
            enabled: existing.enabled,
          },
        };

        if (opts.userPassword) body.InternalUser.password = opts.userPassword;
        if (opts.email) body.InternalUser.email = opts.email;
        if (opts.first) body.InternalUser.firstName = opts.first;
        if (opts.last) body.InternalUser.lastName = opts.last;
        if (opts.description !== undefined) body.InternalUser.description = opts.description;
        if (opts.enable) body.InternalUser.enabled = true;
        if (opts.disable) body.InternalUser.enabled = false;
        if (opts.group) {
          body.InternalUser.identityGroups = await resolveGroupId(client, opts.group);
        }

        const result = await client.ersPut(`/internaluser/${existing.id}`, body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "internal-user update", name });
        console.log(`Internal user "${name}" updated.`);
      } catch (err) { printError(err); }
    });

  cmd.command("delete <name>")
    .description("Delete an internal user")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findUserByName(client, name);
        const result = await client.ersDelete(`/internaluser/${existing.id}`);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "internal-user delete", name });
        console.log(`Internal user "${name}" deleted.`);
      } catch (err) { printError(err); }
    });
};
