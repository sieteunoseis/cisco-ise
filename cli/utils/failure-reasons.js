// ISE failure codes, causes, and remediation
// Reference: https://community.cisco.com/t5/security-knowledge-base/how-to-troubleshoot-ise-failed-authentications-amp/ta-p/3630960

const FAILURE_MAP = {
  5400: {
    title: "Authentication failed",
    causes: ["Wrong credentials", "User not found", "Identity store unavailable"],
    fix: "Check credentials, identity store, and authentication policy.",
  },
  5405: {
    title: "RADIUS request dropped",
    causes: ["Shared secret mismatch between NAD and ISE"],
    fix: "Verify shared secret matches: cisco-ise network-device get <name>",
  },
  5407: {
    title: "RADIUS request timeout",
    causes: ["Network connectivity issue between NAD and ISE", "ISE overloaded"],
    fix: "Check network connectivity. Verify RADIUS port (1812) is reachable.",
  },
  5411: {
    title: "No response received during 120 seconds on last EAP message sent to client",
    causes: [
      "NAD or supplicant EAP timeout too aggressive",
      "Supplicant does not trust ISE certificate (cert-based auth)",
      "User did not provide valid credentials (password-based auth)",
      "External identity store responding too slowly",
    ],
    fix: "Verify supplicant is configured for full EAP conversation. Check NAS EAP timers. Verify supplicant trusts the ISE EAP certificate.",
  },
  5417: {
    title: "Dynamic Authorization (CoA) failed",
    causes: ["NAD not configured with CoA from ISE PSN", "Network connectivity issue"],
    fix: "Verify NAD supports CoA. Check CoA port (1700 Cisco, 3799 others). Ensure ISE is defined as dynamic authorization client on NAD.",
  },
  5440: {
    title: "Client abandoned EAP session",
    causes: ["Supplicant stopped responding", "Client disconnected mid-auth"],
    fix: "Check client supplicant configuration and network stability.",
  },
  11007: {
    title: "Could not locate Network Device or AAA Client",
    causes: ["NAD not in the ISE network device list"],
    fix: "Add the device: cisco-ise network-device add --name <name> --ip <ip> --radius-secret <secret>",
  },
  11036: {
    title: "Invalid Message-Authenticator RADIUS attribute",
    causes: ["Shared RADIUS secret mismatch between ISE and NAD"],
    fix: "Check shared secrets match: cisco-ise network-device get <name>. Also check for NAD hardware or RADIUS compatibility issues.",
  },
  11213: {
    title: "No response from NAD after Dynamic Authorization request",
    causes: ["NAD does not support CoA", "CoA port mismatch", "Network issue"],
    fix: "Verify NAD supports CoA. Check CoA port (default 1700 for Cisco, 3799 for others). Verify shared secret: cisco-ise network-device get <name>",
  },
  12520: {
    title: "EAP-TLS failed — client rejected ISE certificate",
    causes: ["Supplicant does not trust the ISE PSN certificate"],
    fix: "Verify ISE EAP certificate in Administration > Certificates. Ensure the signing CA is trusted by the client supplicant.",
  },
  15039: {
    title: "Rejected per authorization profile",
    causes: ["Default authz rule is deny and no matching authz rules for this session"],
    fix: "Check authorization policy rules. The DenyAccess profile was matched. Add an authz rule for this user/group.",
  },
  22040: {
    title: "Wrong password or invalid shared secret",
    causes: ["User entered wrong password", "Shared RADIUS secret mismatch"],
    fix: "Check user password: cisco-ise internal-user get <user>. Check device shared secret: cisco-ise network-device get <name>",
  },
  22044: {
    title: "Identity policy configured for certificate auth but received password auth",
    causes: ["Mismatch between ISE auth policy and supplicant configuration"],
    fix: "Check authentication policy — identity source expects certificate but supplicant sent password credentials.",
  },
  22045: {
    title: "Identity policy configured for password auth but received certificate auth",
    causes: ["Mismatch between ISE auth policy and supplicant configuration"],
    fix: "Check authentication policy — identity source expects password but supplicant sent certificate credentials.",
  },
  22056: {
    title: "Subject not found in the applicable identity store(s)",
    causes: [
      "User or device not found in configured identity store",
      "Authentication policy points to wrong identity store",
      "Missing domain suffix for AD auth (user@domain.com)",
    ],
    fix: "Check user exists: cisco-ise internal-user list. Verify auth policy points to correct identity store. For AD, ensure supplicant appends domain suffix.",
  },
  22058: {
    title: "Wrong password",
    causes: ["User entered incorrect password"],
    fix: "Reset password: cisco-ise internal-user update <user> --user-password <pass>",
  },
  22061: {
    title: "User account is disabled",
    causes: ["User account has been disabled in ISE"],
    fix: "Enable the user: cisco-ise internal-user update <user> --enable",
  },
  24408: {
    title: "User authentication against Active Directory failed — wrong password",
    causes: ["User entered wrong password", "RADIUS request using PAP — also check shared secret"],
    fix: "Check user credentials. If using PAP, also verify shared secret on the network device.",
  },
};

// Pattern-based matching for failure_reason text that includes the code inline
function matchFailure(failureReason, messageCode) {
  // Try exact message code first
  if (messageCode && FAILURE_MAP[messageCode]) {
    return FAILURE_MAP[messageCode];
  }

  // Try extracting code from the failure reason string (e.g., "11213 No response...")
  if (failureReason) {
    const codeMatch = failureReason.match(/^(\d+)\s/);
    if (codeMatch && FAILURE_MAP[parseInt(codeMatch[1])]) {
      return FAILURE_MAP[parseInt(codeMatch[1])];
    }
  }

  return null;
}

module.exports = { FAILURE_MAP, matchFailure };
