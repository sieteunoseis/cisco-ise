const { Command } = require("commander");
const pkg = require("../package.json");

try {
  const updateNotifier = require("update-notifier").default || require("update-notifier");
  updateNotifier({ pkg }).notify();
} catch {};

const program = new Command();

program
  .name("cisco-ise")
  .description("CLI for Cisco ISE (Identity Services Engine)")
  .version(pkg.version)
  .option("--format <format>", "output format (table, json, toon, csv)", "table")
  .option("--host <host>", "ISE hostname or IP")
  .option("--username <user>", "ISE username")
  .option("--password <pass>", "ISE password")
  .option("--cluster <name>", "use a named cluster from config")
  .option("--ppan <host>", "PAN node for ERS/OpenAPI (large deployments)")
  .option("--pmnt <host>", "MNT node for monitoring APIs (large deployments)")
  .option("--sponsor-user <user>", "sponsor username for guest API")
  .option("--sponsor-password <pass>", "sponsor password for guest API")
  .option("--insecure", "skip TLS certificate verification")
  .option("--read-only", "block write operations")
  .option("--dry-run", "show what would happen without executing")
  .option("--no-audit", "disable audit logging")
  .option("--no-cache", "bypass response cache")
  .option("--debug", "enable debug logging");

// Commands — registered as each command file is created
require("./commands/config.js")(program);
require("./commands/endpoint.js")(program);
require("./commands/identity-group.js")(program);
require("./commands/auth-profile.js")(program);
require("./commands/network-device.js")(program);
require("./commands/guest.js")(program);
require("./commands/session.js")(program);
require("./commands/radius.js")(program);
require("./commands/tacacs.js")(program);
require("./commands/trustsec.js")(program);
require("./commands/internal-user.js")(program);
require("./commands/doctor.js")(program);
require("./commands/deployment.js")(program);

program.parse(process.argv);
