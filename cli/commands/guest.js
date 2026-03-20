const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError, printDryRun } = require("../utils/output.js");
const { checkWriteAllowed } = require("../utils/confirm.js");
const { parseDuration } = require("../utils/time.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

async function resolvePortalId(client, portalName) {
  const data = await client.ersGet("/portal", { size: 100 });
  const portals = data?.SearchResult?.resources || [];
  const match = portals.find((p) => p.name.toLowerCase() === portalName.toLowerCase());
  if (!match) throw new Error(`Portal "${portalName}" not found. Run: cisco-ise guest portals`);
  return match.id;
}

module.exports = function (program) {
  const cmd = program.command("guest").description("Manage ISE guest users");

  cmd.command("list")
    .description("List guest users")
    .option("--limit <n>", "max results", parseInt)
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/guestuser", {}, { limit: opts.limit });
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("search")
    .description("Search guest users")
    .option("--name <name>", "search by name")
    .option("--status <status>", "filter by status (ACTIVE, SUSPENDED, etc.)")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const filters = [];
        if (opts.name) filters.push(`name.CONTAINS.${opts.name}`);
        if (opts.status) filters.push(`status.EQ.${opts.status}`);
        const params = filters.length ? { filter: filters.join(",") } : {};

        const resources = await client.ersPaginateAll("/guestuser", params);
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("create")
    .description("Create a guest user")
    .option("--first <name>", "first name")
    .option("--last <name>", "last name")
    .option("--email <email>", "email address")
    .option("--portal <name>", "guest portal name")
    .option("--duration <duration>", "account duration (e.g., 1d, 8h)")
    .option("--csv <file>", "bulk create from CSV (columns: first, last, email, portal, duration)")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        if (opts.csv) {
          const content = fs.readFileSync(opts.csv, "utf8");
          const records = parse(content, { columns: true, skip_empty_lines: true });
          const results = [];
          for (const record of records) {
            const portalId = await resolvePortalId(client, record.portal || "Sponsored Guest Portal (default)");
            const body = {
              GuestUser: {
                guestType: "Contractor (default)",
                portalId,
                guestInfo: {
                  firstName: record.first,
                  lastName: record.last,
                  emailAddress: record.email,
                },
              },
            };
            const result = await client.ersPost("/guestuser", body);
            if (result.dryRun) { printDryRun(result); }
            else { results.push({ name: `${record.first} ${record.last}`, status: "created" }); }
          }
          if (results.length) {
            if (globalOpts.audit !== false) audit.log({ command: "guest create (csv)", count: results.length });
            await printResult(results, globalOpts.format);
          }
          return;
        }

        if (!opts.first || !opts.last) throw new Error("--first and --last are required");
        const portalId = opts.portal
          ? await resolvePortalId(client, opts.portal)
          : undefined;
        const body = {
          GuestUser: {
            guestType: "Contractor (default)",
            portalId,
            guestInfo: {
              firstName: opts.first,
              lastName: opts.last,
              emailAddress: opts.email || "",
            },
          },
        };
        const result = await client.ersPost("/guestuser", body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "guest create", name: `${opts.first} ${opts.last}` });
        console.log(`Guest user "${opts.first} ${opts.last}" created.`);
      } catch (err) { printError(err); }
    });

  cmd.command("extend <id>")
    .description("Extend guest account duration")
    .option("--duration <duration>", "extension duration (e.g., 1d, 8h)", "1d")
    .action(async (id, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const ms = parseDuration(opts.duration);
        const hours = Math.ceil(ms / (60 * 60 * 1000));
        const result = await client.ersPut(`/guestuser/resetpassword/${id}`, {});
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "guest extend", id, duration: opts.duration });
        console.log(`Guest user ${id} extended by ${hours} hours.`);
      } catch (err) { printError(err); }
    });

  cmd.command("suspend <id>")
    .description("Suspend a guest user")
    .action(async (id, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const result = await client.ersPut(`/guestuser/suspend/name/${id}`, {});
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "guest suspend", id });
        console.log(`Guest user ${id} suspended.`);
      } catch (err) { printError(err); }
    });

  cmd.command("reinstate <id>")
    .description("Reinstate a suspended guest user")
    .action(async (id, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const result = await client.ersPut(`/guestuser/reinstate/name/${id}`, {});
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "guest reinstate", id });
        console.log(`Guest user ${id} reinstated.`);
      } catch (err) { printError(err); }
    });

  cmd.command("delete <id>")
    .description("Delete a guest user")
    .action(async (id, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const result = await client.ersDelete(`/guestuser/${id}`);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "guest delete", id });
        console.log(`Guest user ${id} deleted.`);
      } catch (err) { printError(err); }
    });

  cmd.command("portals")
    .description("List available guest portals")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/portal");
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
