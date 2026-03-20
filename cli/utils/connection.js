const config = require("./config.js");

function resolveConnection(opts) {
  let cluster;
  try {
    cluster = opts.cluster
      ? config.getActiveCluster(opts.cluster)
      : config.getActiveCluster();
  } catch {
    cluster = null;
  }

  if (!cluster && !opts.host && !process.env.CISCO_ISE_HOST) {
    throw new Error(
      "No cluster configured. Run: cisco-ise config add <name> --host <host> --username <user> --password <pass>"
    );
  }

  const resolved = {
    host: opts.host || process.env.CISCO_ISE_HOST || cluster?.host,
    username: opts.username || process.env.CISCO_ISE_USERNAME || cluster?.username,
    password: opts.password || process.env.CISCO_ISE_PASSWORD || cluster?.password,
    ppan: opts.ppan || process.env.CISCO_ISE_PPAN || cluster?.ppan || undefined,
    pmnt: opts.pmnt || process.env.CISCO_ISE_PMNT || cluster?.pmnt || undefined,
    sponsorUser: opts.sponsorUser || process.env.CISCO_ISE_SPONSOR_USER || cluster?.sponsorUser || undefined,
    sponsorPassword: opts.sponsorPassword || process.env.CISCO_ISE_SPONSOR_PASSWORD || cluster?.sponsorPassword || undefined,
    insecure: opts.insecure ?? cluster?.insecure ?? false,
    readOnly: opts.readOnly ?? cluster?.readOnly ?? false,
  };

  if (!resolved.host) throw new Error("Missing --host. Provide via flag, env var CISCO_ISE_HOST, or config.");
  if (!resolved.username) throw new Error("Missing --username.");
  if (!resolved.password) throw new Error("Missing --password.");

  for (const key of ["host", "username", "password", "ppan", "pmnt", "sponsorUser", "sponsorPassword"]) {
    if (resolved[key]) resolved[key] = config.resolveSecrets(resolved[key]);
  }

  // Set TLS override if insecure (covers config-file sourced flag)
  if (resolved.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return resolved;
}

module.exports = { resolveConnection };
