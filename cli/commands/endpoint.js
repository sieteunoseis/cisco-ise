const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError, printDryRun } = require("../utils/output.js");
const { checkWriteAllowed } = require("../utils/confirm.js");
const { normalizeMac } = require("../utils/mac.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

async function resolveGroupId(client, groupName) {
  const data = await client.ersGet("/endpointgroup", { size: 100 });
  const groups = data?.SearchResult?.resources || [];
  const match = groups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
  if (!match) throw new Error(`Identity group "${groupName}" not found. Run: cisco-ise identity-group list`);
  return match.id;
}

async function findEndpointByMac(client, mac) {
  const normalized = normalizeMac(mac);
  const data = await client.ersGet(`/endpoint`, { filter: `mac.EQ.${normalized}`, size: 1 });
  const resources = data?.SearchResult?.resources;
  if (!resources?.length) throw new Error(`Endpoint with MAC ${normalized} not found.`);
  const detail = await client.ersGet(`/endpoint/${resources[0].id}`);
  return detail?.ERSEndPoint || detail;
}

module.exports = function (program) {
  const cmd = program.command("endpoint").description("Manage ISE endpoints");

  cmd.command("list")
    .description("List all endpoints")
    .option("--limit <n>", "max results", parseInt)
    .option("--page <n>", "specific page", parseInt)
    .option("--page-size <n>", "results per page", parseInt)
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/endpoint", {}, {
          limit: opts.limit,
          page: opts.page,
          pageSize: opts.pageSize,
        });
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("search")
    .description("Search endpoints")
    .option("--mac <mac>", "search by MAC address")
    .option("--group <name>", "filter by identity group name")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const params = {};
        const filters = [];
        if (opts.mac) filters.push(`mac.EQ.${normalizeMac(opts.mac)}`);
        if (opts.group) {
          const groupId = await resolveGroupId(client, opts.group);
          filters.push(`groupId.EQ.${groupId}`);
        }
        if (filters.length) params.filter = filters.join(",");

        const resources = await client.ersPaginateAll("/endpoint", params);
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("add")
    .description("Add an endpoint")
    .option("--mac <mac>", "MAC address")
    .option("--group <name>", "identity group name")
    .option("--description <desc>", "endpoint description")
    .option("--csv <file>", "bulk import from CSV (columns: mac, group, description)")
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
            const mac = normalizeMac(record.mac);
            const body = { ERSEndPoint: { mac, description: record.description || "" } };
            if (record.group) {
              body.ERSEndPoint.groupId = await resolveGroupId(client, record.group);
            }
            const result = await client.ersPost("/endpoint", body);
            if (result.dryRun) { printDryRun(result); }
            else { results.push({ mac, status: "created" }); }
          }
          if (results.length) {
            if (globalOpts.audit !== false) audit.log({ command: "endpoint add (csv)", count: results.length });
            await printResult(results, globalOpts.format);
          }
          return;
        }

        if (!opts.mac) throw new Error("--mac is required (or use --csv for bulk import)");
        const mac = normalizeMac(opts.mac);
        const body = { ERSEndPoint: { mac, description: opts.description || "" } };
        if (opts.group) {
          body.ERSEndPoint.groupId = await resolveGroupId(client, opts.group);
        }
        const result = await client.ersPost("/endpoint", body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "endpoint add", mac });
        console.log(`Endpoint ${mac} created.`);
      } catch (err) { printError(err); }
    });

  cmd.command("update <mac>")
    .description("Update an endpoint")
    .option("--group <name>", "new identity group")
    .option("--description <desc>", "new description")
    .action(async (mac, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findEndpointByMac(client, mac);
        const body = { ERSEndPoint: { ...existing } };
        if (opts.description !== undefined) body.ERSEndPoint.description = opts.description;
        if (opts.group) {
          body.ERSEndPoint.groupId = await resolveGroupId(client, opts.group);
        }
        const result = await client.ersPut(`/endpoint/${existing.id}`, body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "endpoint update", mac: normalizeMac(mac) });
        console.log(`Endpoint ${normalizeMac(mac)} updated.`);
      } catch (err) { printError(err); }
    });

  cmd.command("delete <mac>")
    .description("Delete an endpoint")
    .action(async (mac, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findEndpointByMac(client, mac);
        const result = await client.ersDelete(`/endpoint/${existing.id}`);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "endpoint delete", mac: normalizeMac(mac) });
        console.log(`Endpoint ${normalizeMac(mac)} deleted.`);
      } catch (err) { printError(err); }
    });
};
