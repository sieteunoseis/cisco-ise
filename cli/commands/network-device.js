const { resolveConnection } = require("../utils/connection.js");
const { printResult, printError, printDryRun } = require("../utils/output.js");
const { checkWriteAllowed } = require("../utils/confirm.js");
const audit = require("../utils/audit.js");
const IseClient = require("../utils/api.js");

async function findDeviceByName(client, name) {
  const data = await client.ersGet("/networkdevice", { filter: `name.EQ.${name}`, size: 1 });
  const resources = data?.SearchResult?.resources;
  if (!resources?.length) throw new Error(`Network device "${name}" not found.`);
  const detail = await client.ersGet(`/networkdevice/${resources[0].id}`);
  return detail?.NetworkDevice || detail;
}

module.exports = function (program) {
  const cmd = program.command("network-device").description("Manage ISE network devices (NADs)");

  cmd.command("list")
    .description("List all network devices")
    .option("--limit <n>", "max results", parseInt)
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const resources = await client.ersPaginateAll("/networkdevice", {}, { limit: opts.limit });
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("search")
    .description("Search network devices")
    .option("--name <name>", "search by name")
    .option("--ip <ip>", "search by IP address")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const filters = [];
        if (opts.name) filters.push(`name.CONTAINS.${opts.name}`);
        if (opts.ip) filters.push(`ipaddress.CONTAINS.${opts.ip}`);
        const params = filters.length ? { filter: filters.join(",") } : {};

        const resources = await client.ersPaginateAll("/networkdevice", params);
        await printResult(resources, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("get <name>")
    .description("Get network device details")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        const client = new IseClient(conn, { noCache: !globalOpts.cache, debug: globalOpts.debug });

        const device = await findDeviceByName(client, name);
        await printResult(device, globalOpts.format);
      } catch (err) { printError(err); }
    });

  cmd.command("add")
    .description("Add a network device")
    .option("--name <name>", "device name")
    .option("--ip <ip>", "IP address")
    .option("--radius-secret <secret>", "RADIUS shared secret")
    .option("--description <desc>", "device description")
    .option("--type <type>", "device type")
    .option("--location <loc>", "device location")
    .action(async (opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        if (!opts.name) throw new Error("--name is required");
        if (!opts.ip) throw new Error("--ip is required");

        const body = {
          NetworkDevice: {
            name: opts.name,
            description: opts.description || "",
            NetworkDeviceIPList: [{ ipaddress: opts.ip, mask: 32 }],
            NetworkDeviceGroupList: [
              "Location#All Locations",
              "IPSEC#Is IPSEC Device#No",
              "Device Type#All Device Types",
            ],
          },
        };
        if (opts.radiusSecret) {
          body.NetworkDevice.authenticationSettings = {
            networkProtocol: "RADIUS",
            radiusSharedSecret: opts.radiusSecret,
            enableKeyWrap: false,
          };
        }
        if (opts.type) body.NetworkDevice.profileName = opts.type;
        if (opts.location) body.NetworkDevice.location = opts.location;

        const result = await client.ersPost("/networkdevice", body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "network-device add", name: opts.name });
        console.log(`Network device "${opts.name}" created.`);
      } catch (err) { printError(err); }
    });

  cmd.command("update <name>")
    .description("Update a network device")
    .option("--ip <ip>", "new IP address")
    .option("--radius-secret <secret>", "new RADIUS shared secret")
    .option("--description <desc>", "new description")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findDeviceByName(client, name);
        const body = { NetworkDevice: { ...existing } };
        if (opts.description !== undefined) body.NetworkDevice.description = opts.description;
        if (opts.ip) {
          body.NetworkDevice.NetworkDeviceIPList = {
            NetworkDeviceIP: [{ ipaddress: opts.ip, mask: 32 }],
          };
        }
        if (opts.radiusSecret) {
          body.NetworkDevice.authenticationSettings = {
            ...(existing.authenticationSettings || {}),
            radiusSharedSecret: opts.radiusSecret,
          };
        }
        const result = await client.ersPut(`/networkdevice/${existing.id}`, body);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "network-device update", name });
        console.log(`Network device "${name}" updated.`);
      } catch (err) { printError(err); }
    });

  cmd.command("delete <name>")
    .description("Delete a network device")
    .action(async (name, opts, command) => {
      try {
        const globalOpts = command.optsWithGlobals();
        const conn = resolveConnection(globalOpts);
        await checkWriteAllowed(conn, globalOpts);
        const client = new IseClient(conn, {
          noCache: !globalOpts.cache, debug: globalOpts.debug, dryRun: globalOpts.dryRun,
        });

        const existing = await findDeviceByName(client, name);
        const result = await client.ersDelete(`/networkdevice/${existing.id}`);
        if (result.dryRun) { printDryRun(result); return; }
        if (globalOpts.audit !== false) audit.log({ command: "network-device delete", name });
        console.log(`Network device "${name}" deleted.`);
      } catch (err) { printError(err); }
    });
};
