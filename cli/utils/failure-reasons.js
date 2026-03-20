// ISE failure codes, causes, and remediation
// Sources:
//   - Cisco ISE Message Catalog (Splunk app): https://github.com/splunk/splunk-app-cisco-ise/blob/master/app/Splunk_CiscoISE/lookups/message_catalog.csv
//   - Cisco ISE Syslogs: https://www.cisco.com/c/en/us/td/docs/security/ise/syslog/Cisco_ISE_Syslogs/m_SyslogsList.html
//   - Cisco Community: https://community.cisco.com/t5/security-knowledge-base/how-to-troubleshoot-ise-failed-authentications-amp/ta-p/3630960
//   - Cisco ISE Message Catalog: https://content.cisco.com/chapter.sjs?uri=/searchable/chapter/content/en/us/td/docs/security/ise/2-6/Cisco_ISE_Syslogs/Cisco_ISE_Syslogs/Cisco_ISE_Syslogs_chapter_00.html.xml
//   - Wires and Wi-Fi: https://www.wiresandwi.fi/blog/cisco-ise-top-reasons-your-certificate-authentications-are-failing

// ──────────────────────────────────────────────
//  5xxx — Authentication & Authorization Results
// ──────────────────────────────────────────────

const CODES_5XXX = {
  // --- Passed ---
  5200: {
    title: "Authentication succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed — authentication was successful.",
  },
  5201: {
    title: "Authentication succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed — authentication was successful (alternate log entry).",
  },
  5202: {
    title: "Command Authorization succeeded",
    category: "Device-Administration",
    causes: [],
    fix: "No action needed.",
  },
  5203: {
    title: "Session Authorization succeeded",
    category: "Device-Administration",
    causes: [],
    fix: "No action needed.",
  },
  5204: {
    title: "Change password succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed.",
  },
  5205: {
    title: "Dynamic Authorization succeeded",
    category: "Dynamic-Authorization",
    causes: [],
    fix: "No action needed — CoA was applied successfully.",
  },
  5206: {
    title: "PAC provisioned",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed — EAP-FAST PAC was provisioned.",
  },
  5231: {
    title: "Guest Authentication Passed",
    category: "Guest",
    causes: [],
    fix: "No action needed.",
  },
  5232: {
    title: "DACL Download Succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed.",
  },
  5233: {
    title: "SGA Data Download Succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed.",
  },
  5234: {
    title: "SGA Peer Policy Download Succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed.",
  },
  5235: {
    title: "Sponsor has successfully authenticated",
    category: "Sponsor",
    causes: [],
    fix: "No action needed.",
  },
  5236: {
    title: "Authorize-Only succeeded",
    category: "Passed-Authentication",
    causes: [],
    fix: "No action needed.",
  },
  5237: {
    title: "Device Registration Web Authentication Passed",
    category: "Guest",
    causes: [],
    fix: "No action needed.",
  },

  // --- Failed ---
  5400: {
    title: "Authentication failed",
    category: "Failed-Attempt",
    causes: [
      "Wrong credentials",
      "User not found in identity store",
      "Identity store unavailable",
      "Authorization profile set to DenyAccess",
      "Certificate validation failure",
    ],
    fix: "Check the detailed failure reason (sub-code) in the log. Verify credentials, identity store configuration, and authentication/authorization policies.",
  },
  5401: {
    title: "Authentication failed",
    category: "Failed-Attempt",
    causes: ["Same as 5400 — alternate log entry for authentication failure"],
    fix: "Check the detailed failure reason in the log details.",
  },
  5402: {
    title: "Command Authorization failed",
    category: "Failed-Attempt",
    causes: ["TACACS+ command not permitted by command set"],
    fix: "Check Device Administration > Command Sets. Verify the command is permitted for this admin/device.",
  },
  5403: {
    title: "Session Authorization failed",
    category: "Device-Administration",
    causes: ["TACACS+ session authorization denied"],
    fix: "Check Device Administration > Authorization Policy and Shell Profiles.",
  },
  5404: {
    title: "Authorization failed",
    category: "Device-Administration",
    causes: ["Authorization policy returned deny"],
    fix: "Review authorization policy rules for device administration.",
  },
  5405: {
    title: "RADIUS request dropped",
    category: "Failed-Attempt",
    causes: [
      "Shared secret mismatch between NAD and ISE",
      "Malformed RADIUS packet",
      "NAD not configured in ISE",
    ],
    fix: "Verify shared secret matches: cisco-ise network-device get <name>. Also verify the device is added to ISE.",
  },
  5406: {
    title: "TACACS+ request dropped",
    category: "Failed-Attempt",
    causes: ["TACACS+ shared secret mismatch", "NAD not configured in ISE"],
    fix: "Verify the device is added to ISE and TACACS+ shared secret is correct.",
  },
  5407: {
    title: "TACACS+ Authorization failed",
    category: "Failed-Attempt",
    causes: ["Shell profile denied access", "Command set denied the command"],
    fix: "Review TACACS+ authorization policies, shell profiles, and command sets.",
  },
  5408: {
    title: "Command Authorization encountered an error",
    category: "Failed-Attempt",
    causes: ["Internal error during TACACS+ command authorization"],
    fix: "Check ISE logs for internal errors. Verify command set configuration.",
  },
  5409: {
    title: "Session Authorization encountered an error",
    category: "Failed-Attempt",
    causes: ["Internal error during session authorization"],
    fix: "Check ISE logs for details. Verify authorization policy configuration.",
  },
  5410: {
    title: "TACACS+ Authorization encountered an error",
    category: "Failed-Attempt",
    causes: ["Internal error in TACACS+ processing"],
    fix: "Check ISE application server logs for internal errors.",
  },
  5411: {
    title: "No response received during 120 seconds on last EAP message sent to client",
    category: "Failed-Attempt",
    causes: [
      "NAD or supplicant EAP timeout too aggressive",
      "Supplicant does not trust ISE EAP certificate (cert-based auth)",
      "User did not provide valid credentials in time (password-based auth)",
      "External identity store responding too slowly",
      "Poor wireless signal causing client disconnection during EAP",
    ],
    fix: "Verify supplicant is configured for full EAP conversation. Check NAS EAP timers. Verify supplicant trusts the ISE EAP certificate. Check for wireless coverage issues.",
  },
  5412: {
    title: "TACACS+ authentication request ended with error",
    category: "Failed-Attempt",
    causes: ["TACACS+ protocol error", "Internal ISE error"],
    fix: "Check ISE TACACS+ logs. Verify TACACS+ configuration on NAD and ISE.",
  },
  5413: {
    title: "RADIUS Accounting-Request dropped",
    category: "Failed-Attempt",
    causes: ["Invalid accounting request", "NAD not configured in ISE"],
    fix: "Verify NAD is added to ISE. Check RADIUS accounting configuration on the NAD.",
  },
  5414: {
    title: "TACACS+ accounting has failed",
    category: "Failed-Attempt",
    causes: ["TACACS+ accounting processing error"],
    fix: "Check ISE logs for accounting errors.",
  },
  5415: {
    title: "Change password failed",
    category: "Failed-Attempt",
    causes: ["Password change rejected by identity store", "Password complexity requirements not met"],
    fix: "Verify the new password meets complexity requirements. Check identity store password policy.",
  },
  5416: {
    title: "RADIUS PAP session cleaned up",
    category: "Failed-Attempt",
    causes: ["PAP session timed out before completion"],
    fix: "Check network connectivity between NAD and ISE. Verify RADIUS timeouts.",
  },
  5417: {
    title: "Dynamic Authorization (CoA) failed",
    category: "Dynamic-Authorization",
    causes: [
      "NAD not configured with CoA from ISE PSN",
      "Network connectivity issue",
      "CoA port mismatch",
      "Shared secret mismatch",
    ],
    fix: "Verify NAD supports CoA. Check CoA port (1700 Cisco, 3799 RFC default). Ensure ISE PSN is defined as dynamic authorization client on NAD.",
  },
  5431: {
    title: "Guest Authentication Failed",
    category: "Guest",
    causes: ["Guest credentials invalid or expired", "Guest account not found"],
    fix: "Verify guest account exists and is not expired. Check guest portal and identity group configuration.",
  },
  5432: {
    title: "DACL Download Failed",
    category: "Failed-Attempt",
    causes: ["DACL name not found", "DACL request missing required attributes"],
    fix: "Verify the DACL exists in Policy > Policy Elements > Results > Downloadable ACLs. Check the authorization profile references.",
  },
  5433: {
    title: "SGA Data Download Failed",
    category: "Failed-Attempt",
    causes: ["TrustSec data download failure"],
    fix: "Check TrustSec configuration and SGT/SGACL assignments.",
  },
  5434: {
    title: "SGA Peer Policy Download Failed",
    category: "Failed-Attempt",
    causes: ["TrustSec peer policy unavailable"],
    fix: "Check TrustSec peer policy configuration.",
  },
  5435: {
    title: "Sponsor authentication has failed",
    category: "Sponsor",
    causes: ["Sponsor credentials invalid", "Sponsor account disabled"],
    fix: "Verify sponsor account credentials and that the account is enabled.",
  },
  5436: {
    title: "Authorize-Only failed",
    category: "Failed-Attempt",
    causes: ["Authorization failed without authentication (authorize-only mode)"],
    fix: "Check authorization policy for authorize-only requests.",
  },
  5437: {
    title: "Device Registration Web Authentication Failed",
    category: "Guest",
    causes: ["Device registration portal authentication failure"],
    fix: "Check device registration portal configuration and identity source.",
  },
  5440: {
    title: "Endpoint abandoned EAP session and started new",
    category: "Failed-Attempt",
    causes: [
      "Supplicant stopped responding and restarted authentication",
      "Client disconnected mid-auth (poor wireless signal)",
      "Client roamed to another AP during EAP exchange",
      "RSSI fluctuation causing disassociation",
    ],
    fix: "Check client supplicant configuration and wireless coverage. Increase NAS EAP timeout. Check for client roaming issues.",
  },
};

// ──────────────────────────────────────────────
//  11xxx — RADIUS Core & EAP Framework
// ──────────────────────────────────────────────

const CODES_11XXX = {
  // --- RADIUS Core ---
  11001: {
    title: "Received RADIUS Access-Request",
    category: "RADIUS",
    causes: [],
    fix: "Informational — RADIUS request was received.",
  },
  11002: {
    title: "Returned RADIUS Access-Accept",
    category: "RADIUS",
    causes: [],
    fix: "No action needed — authentication succeeded.",
  },
  11003: {
    title: "Returned RADIUS Access-Reject",
    category: "RADIUS",
    causes: ["Authentication or authorization failed"],
    fix: "Check the detailed failure reason in the same log entry. Common sub-reasons: wrong password, user not found, policy mismatch.",
  },
  11004: {
    title: "Received RADIUS Accounting-Request",
    category: "RADIUS",
    causes: [],
    fix: "Informational — accounting request received.",
  },
  11005: {
    title: "Returned RADIUS Accounting-Response",
    category: "RADIUS",
    causes: [],
    fix: "Informational.",
  },
  11006: {
    title: "Returned RADIUS Access-Challenge",
    category: "RADIUS",
    causes: [],
    fix: "Informational — EAP challenge issued to client.",
  },
  11007: {
    title: "Could not locate Network Device or AAA Client",
    category: "RADIUS",
    causes: [
      "NAD IP address not added to ISE",
      "Request came from an unknown IP not matching any Network Device definition",
    ],
    fix: "Add the device: cisco-ise network-device add --name <name> --ip <ip> --radius-secret <secret>. Verify Administration > Network Resources > Network Devices.",
  },
  11008: {
    title: "Received Service-Type = Call Check but no Calling-Station-ID",
    category: "RADIUS",
    causes: ["MAB request missing MAC address (Calling-Station-ID)"],
    fix: "Verify NAD is sending Calling-Station-ID in RADIUS requests. Check MAB configuration on the switch port.",
  },
  11009: {
    title: "RADIUS listener started",
    category: "RADIUS",
    causes: [],
    fix: "Informational — ISE RADIUS service started.",
  },
  11010: {
    title: "RADIUS listener stopped",
    category: "RADIUS",
    causes: ["ISE RADIUS service stopped"],
    fix: "Check ISE application status. Restart if needed: cisco-ise deployment status.",
  },
  11011: {
    title: "RADIUS listener failed",
    category: "RADIUS",
    causes: ["ISE cannot bind to RADIUS port"],
    fix: "Check if another process is using ports 1812/1813. Restart ISE services.",
  },
  11012: {
    title: "RADIUS packet contains invalid header",
    category: "RADIUS",
    causes: ["Malformed RADIUS packet from NAD"],
    fix: "Check NAD RADIUS implementation. Packet capture may help diagnose.",
  },
  11013: {
    title: "RADIUS packet already in the process",
    category: "RADIUS",
    causes: ["Duplicate RADIUS request received while previous is still processing", "ISE latency > NAD retransmit timer"],
    fix: "Increase NAD RADIUS timeout. Check ISE processing latency. Possible ISE overload.",
  },
  11014: {
    title: "RADIUS packet contains invalid attribute(s)",
    category: "RADIUS",
    causes: ["RADIUS attribute value exceeds allowed length or is malformed"],
    fix: "Check NAD RADIUS attribute configuration. Review packet capture.",
  },
  11015: {
    title: "Access-Request missing NAS-IP-Address and NAS-Identifier",
    category: "RADIUS",
    causes: ["NAD not sending required attributes"],
    fix: "Configure NAS-IP-Address or NAS-Identifier on the NAD. ISE continues processing but may log warning.",
  },
  11016: {
    title: "Translating EAP protocol result into RADIUS result",
    category: "RADIUS",
    causes: [],
    fix: "Informational — normal EAP-to-RADIUS translation.",
  },
  11017: {
    title: "RADIUS created a new session",
    category: "RADIUS",
    causes: [],
    fix: "Informational — new authentication session started.",
  },
  11018: {
    title: "RADIUS is re-using an existing session",
    category: "RADIUS",
    causes: [],
    fix: "Informational — session resumed.",
  },
  11019: {
    title: "Selected DenyAccess Service",
    category: "RADIUS",
    causes: ["Policy matched DenyAccess result"],
    fix: "Check Service Selection Policy. Access to the network is denied by policy.",
  },
  11020: {
    title: "RADIUS session authorization did not return a valid result",
    category: "RADIUS",
    causes: ["No matching authorization rule", "Authorization policy misconfiguration"],
    fix: "Review authorization policy. Ensure a default rule exists.",
  },
  11021: {
    title: "RADIUS could not decipher password — packet missing necessary attributes",
    category: "RADIUS",
    causes: ["PAP password decryption failed", "Missing User-Password or shared secret issue"],
    fix: "Verify RADIUS shared secret. Check PAP configuration on the NAD.",
  },
  11022: {
    title: "Added the dACL specified in the Authorization Profile",
    category: "DACL",
    causes: [],
    fix: "Informational — DACL applied.",
  },
  11023: {
    title: "The requested dACL is not found — unknown dACL name",
    category: "DACL",
    causes: ["Authorization profile references a DACL that does not exist"],
    fix: "Create the missing DACL in Policy > Policy Elements > Results > Downloadable ACLs. Or update the authorization profile.",
  },
  11027: {
    title: "Detected Host Lookup UseCase (Service-Type = Call Check)",
    category: "RADIUS",
    causes: [],
    fix: "Informational — MAB authentication detected.",
  },
  11028: {
    title: "Detected Host Lookup UseCase (UserName = Calling-Station-ID)",
    category: "RADIUS",
    causes: [],
    fix: "Informational — MAB detected via matching username to MAC.",
  },
  11029: {
    title: "Unsupported RADIUS packet type",
    category: "RADIUS",
    causes: ["NAD sent a RADIUS packet type that ISE does not support"],
    fix: "Check NAD RADIUS configuration. Only Access-Request and Accounting-Request are standard.",
  },
  11030: {
    title: "Pre-parsing of the RADIUS packet failed",
    category: "RADIUS",
    causes: ["Corrupt or truncated RADIUS packet"],
    fix: "Check network path for MTU issues. Verify NAD RADIUS implementation.",
  },
  11036: {
    title: "The Message-Authenticator RADIUS attribute is invalid",
    category: "RADIUS",
    causes: ["Shared RADIUS secret mismatch between ISE and NAD"],
    fix: "Verify shared secrets match: cisco-ise network-device get <name>. Check for NAD hardware or RADIUS compatibility issues.",
  },
  11038: {
    title: "RADIUS Accounting-Request header contains invalid Authenticator field",
    category: "RADIUS",
    causes: ["Accounting request authenticator mismatch — usually shared secret issue"],
    fix: "Verify shared secret on the NAD and ISE match.",
  },
  11039: {
    title: "RADIUS authentication request rejected due to critical logging error",
    category: "RADIUS",
    causes: ["ISE logging subsystem failure"],
    fix: "Check ISE disk space and logging configuration. Restart logging services if needed.",
  },
  11041: {
    title: "RADIUS PAP session timed out",
    category: "RADIUS",
    causes: ["PAP authentication did not complete in time"],
    fix: "Check network connectivity. Verify identity store responsiveness.",
  },
  11042: {
    title: "Received duplicate RADIUS request — retransmitting previous response",
    category: "RADIUS",
    causes: ["NAD retransmitted before ISE responded", "ISE processing latency"],
    fix: "Increase NAD RADIUS timeout. Check ISE load and response times.",
  },
  11049: {
    title: "Settings of RADIUS default network will be used",
    category: "RADIUS",
    causes: ["NAD IP matched default device group instead of a specific network device"],
    fix: "Add the specific NAD to ISE if you need per-device settings: cisco-ise network-device add.",
  },
  11050: {
    title: "RADIUS request dropped due to system overload",
    category: "RADIUS",
    causes: ["ISE node is overloaded"],
    fix: "Check ISE CPU and memory. Consider load balancing across multiple PSN nodes. Review concurrent session count.",
  },
  11051: {
    title: "RADIUS packet contains invalid state attribute",
    category: "RADIUS",
    causes: ["EAP state attribute mismatch — session may have expired"],
    fix: "Check for NAD-ISE session mismatch. May need to clear sessions.",
  },
  11052: {
    title: "Authentication request dropped due to unsupported port number",
    category: "RADIUS",
    causes: ["RADIUS request received on a non-standard port"],
    fix: "Verify NAD is configured to use standard RADIUS ports (1812, 1813).",
  },
  11054: {
    title: "Request from non-wireless device dropped due to Wireless license",
    category: "RADIUS",
    causes: ["ISE has wireless-only license but received wired request"],
    fix: "Upgrade ISE license to include wired endpoints. Or configure NAD to report as wireless.",
  },

  // --- RADIUS-Client (Proxy/External) ---
  11100: {
    title: "RADIUS-Client about to send request",
    category: "RADIUS-Client",
    causes: [],
    fix: "Informational — ISE forwarding RADIUS request to external server.",
  },
  11101: {
    title: "RADIUS-Client received response",
    category: "RADIUS-Client",
    causes: [],
    fix: "Informational.",
  },
  11102: {
    title: "RADIUS-Client silently discarded invalid response",
    category: "RADIUS-Client",
    causes: ["External RADIUS server returned invalid response"],
    fix: "Check external RADIUS server configuration and shared secret.",
  },
  11103: {
    title: "RADIUS-Client encountered error during processing flow",
    category: "RADIUS-Client",
    causes: ["Error communicating with external RADIUS server"],
    fix: "Check network connectivity to external RADIUS server. Verify configuration.",
  },
  11104: {
    title: "RADIUS-Client request timeout expired",
    category: "RADIUS-Client",
    causes: ["External RADIUS server did not respond in time"],
    fix: "Check external RADIUS server availability. Increase timeout. Check network path.",
  },
  11115: {
    title: "AAA Client Message Authenticator Code Key mismatch",
    category: "RADIUS",
    causes: ["Shared secret mismatch between NAD and ISE"],
    fix: "Verify RADIUS shared secret on both the NAD and ISE.",
  },

  // --- Dynamic Authorization ---
  11200: {
    title: "Received invalid dynamic authorization request",
    category: "Dynamic-Authorization",
    causes: ["Malformed CoA/disconnect request"],
    fix: "Check the CoA request format and attributes.",
  },
  11205: {
    title: "Could not find Network Access Device for CoA",
    category: "Dynamic-Authorization",
    causes: ["NAD IP not in ISE device list"],
    fix: "Add the NAD to ISE: cisco-ise network-device add.",
  },
  11213: {
    title: "No response received from Network Access Device",
    category: "Dynamic-Authorization",
    causes: [
      "NAD does not support CoA",
      "CoA port mismatch",
      "Network connectivity issue",
      "Firewall blocking CoA port",
    ],
    fix: "Verify NAD supports CoA. Check CoA port (default 1700 for Cisco, 3799 for others). Verify shared secret: cisco-ise network-device get <name>.",
  },
  11214: {
    title: "Invalid response received from Network Access Device",
    category: "Dynamic-Authorization",
    causes: ["NAD sent an unexpected response to CoA/disconnect request"],
    fix: "Check NAD CoA implementation. Verify shared secret.",
  },
  11215: {
    title: "No response from Dynamic Authorization Client in ISE",
    category: "Dynamic-Authorization",
    causes: ["ISE proxy node did not respond to CoA relay"],
    fix: "Check ISE node connectivity in distributed deployment.",
  },

  // --- SGA/TrustSec ---
  11300: {
    title: "Could not locate SGA Device",
    category: "SGA",
    causes: ["TrustSec device not configured in ISE"],
    fix: "Add the device under Work Centers > TrustSec > Network Devices.",
  },
  11304: {
    title: "Could not retrieve requested Security Group Tag",
    category: "SGA",
    causes: ["SGT not defined or not assigned"],
    fix: "Verify SGT exists in Work Centers > TrustSec > Components > Security Groups.",
  },
  11305: {
    title: "Could not retrieve requested Security Group ACL",
    category: "SGA",
    causes: ["SGACL not defined"],
    fix: "Verify SGACL exists in Work Centers > TrustSec > Components > Security Group ACLs.",
  },

  // --- RADIUS-Proxy ---
  11350: {
    title: "Detected proxy loop — dropping request",
    category: "RADIUS-Proxy",
    causes: ["RADIUS request is looping between ISE nodes"],
    fix: "Check RADIUS proxy configuration. Ensure no circular forwarding rules.",
  },
  11353: {
    title: "No more external RADIUS servers — cannot perform failover",
    category: "RADIUS-Proxy",
    causes: ["All configured external RADIUS servers are unreachable"],
    fix: "Check connectivity to external RADIUS servers. Verify server addresses and ports.",
  },

  // --- EAP Framework ---
  11400: {
    title: "EAP-MSCHAP password change not allowed by Allowed Protocols",
    category: "EAP",
    causes: ["Password change via EAP-MSCHAP is disabled in the Allowed Protocols"],
    fix: "Enable password change in the Allowed Protocols configuration if needed.",
  },
  11500: {
    title: "Invalid or unexpected EAP payload received",
    category: "EAP",
    causes: ["Malformed EAP message from supplicant"],
    fix: "Check supplicant software version and configuration.",
  },
  11503: {
    title: "Prepared EAP-Success",
    category: "EAP",
    causes: [],
    fix: "Informational — EAP authentication completed successfully.",
  },
  11504: {
    title: "Prepared EAP-Failure",
    category: "EAP",
    causes: ["EAP authentication failed"],
    fix: "Check the detailed failure reason in the same log entry.",
  },
  11506: {
    title: "Prepared EAP-Request/Identity",
    category: "EAP",
    causes: [],
    fix: "Informational — ISE requesting identity from supplicant.",
  },
  11507: {
    title: "Extracted EAP-Response/Identity",
    category: "EAP",
    causes: [],
    fix: "Informational — received identity from supplicant.",
  },
  11508: {
    title: "EAP-Response/Identity contains invalid identity data",
    category: "EAP",
    causes: ["Supplicant sent empty or malformed identity"],
    fix: "Check supplicant identity/username configuration.",
  },
  11509: {
    title: "Access Service does not allow any EAP protocols",
    category: "EAP",
    causes: ["No EAP methods enabled in the selected Allowed Protocols"],
    fix: "Enable EAP methods in Policy > Policy Elements > Results > Authentication > Allowed Protocols.",
  },
  11510: {
    title: "Invalid EAP-Response/NAK — EAP negotiation failed",
    category: "EAP",
    causes: ["Client and ISE could not agree on an EAP method"],
    fix: "Ensure the supplicant and ISE Allowed Protocols have at least one common EAP method.",
  },
  11514: {
    title: "Unexpectedly received empty TLS message — treating as rejection by client",
    category: "EAP",
    causes: [
      "Windows TPM certificates using RSA-PSS signatures",
      "Client rejected the TLS handshake silently",
    ],
    fix: "Disable RSA-PSS signatures via ISE CLI: run 'application configure ise' on PSN nodes. Or check client certificate configuration.",
  },

  // --- EAP-MSCHAP ---
  11812: {
    title: "EAP-MSCHAP authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  11813: {
    title: "EAP-MSCHAP authentication failed",
    category: "EAP",
    causes: ["Wrong password", "User not found in identity store"],
    fix: "Verify user credentials. Check identity store configuration.",
  },
  11814: {
    title: "Inner EAP-MSCHAP authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  11815: {
    title: "Inner EAP-MSCHAP authentication failed",
    category: "EAP",
    causes: ["Wrong password inside PEAP/EAP-FAST tunnel"],
    fix: "Verify user credentials in the inner identity store.",
  },
  11816: {
    title: "MSCHAP username doesn't match inner method EAP-Response/Identity",
    category: "EAP",
    causes: ["Username mismatch between outer and inner EAP identity"],
    fix: "Check supplicant is sending consistent identity in outer and inner EAP methods.",
  },
};

// ──────────────────────────────────────────────
//  12xxx — EAP Methods (FAST, PEAP, TLS, GTC, LEAP)
// ──────────────────────────────────────────────

const CODES_12XXX = {
  // --- EAP-MD5 ---
  12005: {
    title: "EAP-MD5 authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  12006: {
    title: "EAP-MD5 authentication failed",
    category: "EAP",
    causes: ["Wrong password or challenge-response mismatch"],
    fix: "Verify user credentials.",
  },
  12003: {
    title: "Failed to negotiate EAP — EAP-MD5 not allowed in Allowed Protocols",
    category: "EAP",
    causes: ["EAP-MD5 is disabled in the selected Allowed Protocols"],
    fix: "Enable EAP-MD5 in Allowed Protocols if needed. Or configure supplicant for a different EAP method.",
  },

  // --- EAP-FAST ---
  12103: {
    title: "Failed to negotiate EAP — EAP-FAST not allowed in Allowed Protocols",
    category: "EAP",
    causes: ["EAP-FAST not enabled"],
    fix: "Enable EAP-FAST in Policy > Policy Elements > Results > Authentication > Allowed Protocols.",
  },
  12106: {
    title: "EAP-FAST authentication phase finished successfully",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  12108: {
    title: "EAP-FAST authentication failed",
    category: "EAP",
    causes: ["Inner method failure", "PAC verification failure", "Tunnel establishment failure"],
    fix: "Check inner method logs. Verify PAC provisioning. Check client EAP-FAST configuration.",
  },
  12110: {
    title: "PAC verification failed",
    category: "EAP",
    causes: ["PAC is expired, invalid, or from a different ISE deployment"],
    fix: "Re-provision PAC. Check PAC expiration settings. Verify ISE Authority ID matches.",
  },
  12113: {
    title: "PAC has expired — rejecting it",
    category: "EAP",
    causes: ["EAP-FAST PAC reached its expiration date"],
    fix: "Re-provision PAC. Check PAC lifetime settings. Enable proactive PAC update.",
  },
  12116: {
    title: "Client sent Result TLV indicating failure",
    category: "EAP",
    causes: ["Supplicant reported authentication failure"],
    fix: "Check supplicant logs for the reason it rejected the authentication.",
  },
  12117: {
    title: "EAP-FAST inner method finished with failure",
    category: "EAP",
    causes: ["Inner authentication (GTC/MSCHAP) failed inside EAP-FAST tunnel"],
    fix: "Check inner method failure reason. Usually wrong credentials.",
  },
  12118: {
    title: "EAP-FAST cryptobinding verification failed",
    category: "EAP",
    causes: ["Man-in-the-middle or session mismatch"],
    fix: "Check for network issues. Verify client and server are using same tunnel keys.",
  },
  12120: {
    title: "Neither anonymous nor authenticated provisioning allowed by Allowed Protocols",
    category: "EAP",
    causes: ["PAC provisioning is completely disabled"],
    fix: "Enable anonymous or authenticated PAC provisioning in Allowed Protocols.",
  },
  12122: {
    title: "Client didn't provide suitable ciphers for authenticated PAC provisioning",
    category: "EAP",
    causes: ["Cisco AP requires anonymous PAC provisioning", "Cipher mismatch"],
    fix: "Enable 'Allow Anonymous In-Band PAC Provisioning' in Allowed Protocols.",
  },
  12153: {
    title: "EAP-FAST failed SSL/TLS handshake — client rejected ISE local-certificate",
    category: "EAP",
    causes: ["Supplicant does not trust ISE EAP certificate"],
    fix: "Import ISE EAP certificate's Root CA into the client trust store.",
  },

  // --- PEAP ---
  12303: {
    title: "Failed to negotiate EAP — PEAP not allowed in Allowed Protocols",
    category: "EAP",
    causes: ["PEAP is disabled in selected Allowed Protocols"],
    fix: "Enable PEAP in Allowed Protocols.",
  },
  12306: {
    title: "PEAP authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  12307: {
    title: "PEAP authentication failed",
    category: "EAP",
    causes: ["Inner method failure", "TLS handshake failure", "Certificate validation failure"],
    fix: "Check inner method failure reason. Verify certificates. Check PEAP settings.",
  },
  12309: {
    title: "PEAP handshake failed",
    category: "EAP",
    causes: ["TLS handshake could not complete", "Certificate trust issue", "TLS version mismatch"],
    fix: "Verify supplicant trusts ISE EAP certificate. Check TLS version settings. Review client certificate chain.",
  },
  12310: {
    title: "PEAP full handshake finished successfully",
    category: "EAP",
    causes: [],
    fix: "Informational — TLS tunnel established.",
  },
  12315: {
    title: "PEAP inner method finished with failure",
    category: "EAP",
    causes: ["Wrong credentials inside PEAP tunnel"],
    fix: "Verify user credentials. Check inner EAP method configuration.",
  },
  12316: {
    title: "PEAP version negotiation failed",
    category: "EAP",
    causes: ["Client and ISE cannot agree on PEAP version (v0 vs v1)"],
    fix: "Check PEAP version settings in Allowed Protocols. Ensure supplicant supports the same version.",
  },
  12321: {
    title: "PEAP failed SSL/TLS handshake — client rejected ISE local-certificate",
    category: "EAP",
    causes: [
      "Supplicant does not trust ISE EAP certificate or its Root/Intermediate CA",
      "ISE certificate hostname does not match client expected server name",
    ],
    fix: "Import Root and Intermediate CA certificates into client trusted store. On Windows, check 'Connect to these servers' setting in network adapter security configuration.",
  },
  12322: {
    title: "PEAP failed SSL/TLS handshake after a client alert",
    category: "EAP",
    causes: ["Supplicant sent TLS alert during PEAP handshake"],
    fix: "Check supplicant TLS settings and certificate trust. May indicate cipher mismatch or certificate issue.",
  },

  // --- EAP-TLS ---
  12503: {
    title: "Failed to negotiate EAP — EAP-TLS not enabled in Allowed Protocols",
    category: "EAP",
    causes: ["EAP-TLS disabled in Allowed Protocols"],
    fix: "Enable EAP-TLS in Allowed Protocols.",
  },
  12506: {
    title: "EAP-TLS authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  12507: {
    title: "EAP-TLS authentication failed",
    category: "EAP",
    causes: ["Client certificate validation failure", "User not found in identity store"],
    fix: "Check client certificate, CA trust chain, and identity store lookup.",
  },
  12508: {
    title: "EAP-TLS handshake failed",
    category: "EAP",
    causes: ["TLS handshake failure", "Certificate validation error"],
    fix: "Check certificates on both sides. Verify TLS version compatibility. Check OCSP/CRL configuration.",
  },
  12511: {
    title: "Unexpectedly received TLS alert message — treating as rejection by client",
    category: "EAP",
    causes: [
      "ISE EAP certificate uses wildcard (*) in CommonName field",
      "Client does not trust ISE certificate",
    ],
    fix: "Reissue ISE EAP certificate with specific hostname in CommonName (wildcards OK in SAN). Verify client trusts the CA chain.",
  },
  12513: {
    title: "Could not establish the EAP TLS SSL session",
    category: "EAP",
    causes: ["TLS session establishment failed — cipher or protocol issue"],
    fix: "Check TLS version and cipher settings. Verify certificate compatibility.",
  },
  12514: {
    title: "EAP-TLS failed SSL/TLS handshake — unknown CA in client certificate chain",
    category: "EAP",
    causes: [
      "ISE missing client certificate's Root/Intermediate CA",
      "Certificates not enabled for client authentication in ISE trust store",
    ],
    fix: "Import client's Root and Intermediate CA certificates to Administration > System > Certificates > Trusted Certificates. Enable 'Trust for client authentication and Syslog'.",
  },
  12515: {
    title: "EAP-TLS failed — expired CRL associated with CA in client certificate chain",
    category: "EAP",
    causes: ["CRL for one of the client's CA certificates has expired"],
    fix: "Update the CRL. Or enable 'Bypass CRL Verification if CRL is not Received' in trusted certificate settings.",
  },
  12516: {
    title: "EAP-TLS failed — expired certificate in client certificate chain",
    category: "EAP",
    causes: ["Client certificate or an intermediate CA certificate has expired"],
    fix: "Renew the expired certificate. Optionally enable 'Allow Authentication of expired certificates' for a grace period.",
  },
  12517: {
    title: "EAP-TLS failed — revoked certificate in client certificate chain",
    category: "EAP",
    causes: ["Client certificate appears on CRL or OCSP reports it as revoked"],
    fix: "Issue a new certificate to the client. The revoked certificate cannot be used.",
  },
  12518: {
    title: "EAP-TLS failed — bad certificate in client certificate chain",
    category: "EAP",
    causes: ["Certificate structure is invalid or corrupt"],
    fix: "Re-issue the client certificate from the PKI.",
  },
  12519: {
    title: "EAP-TLS failed — unsupported certificate in client certificate chain",
    category: "EAP",
    causes: [
      "Client certificate missing ClientAuthentication Extended Key Usage (EKU)",
      "Missing Digital Signature key usage",
    ],
    fix: "Reissue certificates from PKI with proper EKU (clientAuth OID 1.3.6.1.5.5.7.3.2) and Key Usage (Digital Signature).",
  },
  12520: {
    title: "EAP-TLS failed SSL/TLS handshake — client rejected ISE local-certificate",
    category: "EAP",
    causes: ["Supplicant does not trust the ISE PSN EAP certificate"],
    fix: "Verify ISE EAP certificate chain. Import the signing CA into the client trust store.",
  },
  12521: {
    title: "EAP-TLS failed SSL/TLS handshake after a client alert",
    category: "EAP",
    causes: ["Client sent TLS alert — usually certificate trust or cipher issue"],
    fix: "Check client TLS settings. Verify certificate trust on both sides.",
  },
  12539: {
    title: "Failed to decrypt the EAP-TLS session ticket received from supplicant",
    category: "EAP",
    causes: ["Stateless Session Resume bug", "Session ticket key mismatch"],
    fix: "Disable Stateless Session Resume. Verify ISE patch level.",
  },

  // --- OCSP/CRL ---
  12552: {
    title: "Conversation with OCSP server ended with failure",
    category: "EAP",
    causes: ["OCSP server unreachable or returned error"],
    fix: "Check OCSP server availability. Verify OCSP responder URL in certificate or ISE configuration.",
  },
  12555: {
    title: "OCSP status of user certificate is revoked",
    category: "EAP",
    causes: ["Certificate has been revoked per OCSP responder"],
    fix: "Issue a new certificate to the user/device.",
  },
  12557: {
    title: "Reject user certificate whose OCSP status is unknown",
    category: "EAP",
    causes: ["OCSP responder returned 'unknown' status and ISE is configured to reject"],
    fix: "Uncheck 'Reject if OCSP returns UNKNOWN status' in certificate settings. Or fix the OCSP responder.",
  },
  12561: {
    title: "Connection to OCSP server failed",
    category: "EAP",
    causes: ["Network connectivity issue to OCSP responder"],
    fix: "Check network path to OCSP server. Verify DNS resolution. Check firewall rules.",
  },
  12816: {
    title: "TLS handshake succeeded",
    category: "EAP",
    causes: [],
    fix: "Informational — TLS tunnel established.",
  },
  12817: {
    title: "TLS handshake failed",
    category: "EAP",
    causes: ["TLS negotiation failed — cipher, version, or certificate issue"],
    fix: "Check TLS version settings, cipher suites, and certificates on both ISE and supplicant.",
  },
  12831: {
    title: "Unable to download CRL",
    category: "CRL",
    causes: ["CRL distribution point unreachable"],
    fix: "Check CRL server availability. Verify CRL URL. Enable 'Bypass CRL Verification if CRL is not Received' as workaround.",
  },
  12856: {
    title: "User certificate was revoked by CRL verification",
    category: "EAP",
    causes: ["Certificate serial number found on CRL"],
    fix: "Issue a new certificate to the user/device.",
  },

  // --- EAP-GTC ---
  12603: {
    title: "Failed to negotiate EAP — EAP-GTC not allowed in Allowed Protocols",
    category: "EAP",
    causes: ["EAP-GTC disabled in Allowed Protocols"],
    fix: "Enable EAP-GTC in Allowed Protocols.",
  },
  12612: {
    title: "EAP-GTC authentication succeeded",
    category: "EAP",
    causes: [],
    fix: "No action needed.",
  },
  12613: {
    title: "EAP-GTC authentication failed",
    category: "EAP",
    causes: ["Wrong password or token code"],
    fix: "Verify user credentials or token code.",
  },
  12854: {
    title: "Cannot authenticate because password was not present or was empty",
    category: "EAP",
    causes: ["Supplicant sent empty password field"],
    fix: "Check supplicant credential configuration.",
  },

  // --- LEAP ---
  12703: {
    title: "Failed to negotiate EAP — LEAP not allowed in Allowed Protocols",
    category: "EAP",
    causes: ["LEAP is disabled (deprecated protocol)"],
    fix: "Enable LEAP in Allowed Protocols if needed. Consider migrating to PEAP or EAP-TLS.",
  },
  12706: {
    title: "LEAP authentication failed",
    category: "EAP",
    causes: ["Wrong credentials"],
    fix: "Verify user credentials. Consider migrating from LEAP to a more secure EAP method.",
  },
};

// ──────────────────────────────────────────────
//  13xxx — TACACS+
// ──────────────────────────────────────────────

const CODES_13XXX = {
  13007: {
    title: "Invalid TACACS+ packet header",
    category: "TACACS",
    causes: ["Malformed TACACS+ packet or shared secret mismatch"],
    fix: "Verify TACACS+ shared secret on NAD and ISE.",
  },
  13011: {
    title: "Invalid TACACS+ request packet — possibly mismatched Shared Secrets",
    category: "TACACS",
    causes: ["TACACS+ shared secret mismatch between NAD and ISE"],
    fix: "Verify TACACS+ shared secret matches on both sides.",
  },
  13017: {
    title: "Received TACACS+ packet from unknown Network Device or AAA Client",
    category: "TACACS",
    causes: ["NAD not configured in ISE for TACACS+"],
    fix: "Add the device to ISE with TACACS+ settings: Administration > Network Resources > Network Devices.",
  },
  13023: {
    title: "Command matched a Deny-Always rule",
    category: "Device-Administration",
    causes: ["Command is explicitly denied by a Deny-Always command set rule"],
    fix: "Review Device Administration > Command Sets. The command is blocked by policy.",
  },
  13025: {
    title: "Command failed to match a Permit rule",
    category: "Device-Administration",
    causes: ["No permit rule matched this command"],
    fix: "Add a permit rule for this command in the appropriate Command Set.",
  },
  13036: {
    title: "Selected Shell Profile is DenyAccess",
    category: "TACACS",
    causes: ["Authorization policy selected the DenyAccess shell profile"],
    fix: "Review Device Administration > Authorization Policy. Update rules to permit this user/device.",
  },
};

// ──────────────────────────────────────────────
//  15xxx — Policy Evaluation & Posture
// ──────────────────────────────────────────────

const CODES_15XXX = {
  15004: {
    title: "Matched rule",
    category: "Policy",
    causes: [],
    fix: "Informational — a policy rule was matched.",
  },
  15005: {
    title: "Matched monitored rule",
    category: "Policy",
    causes: [],
    fix: "Informational — a monitor-mode rule was matched (not enforced).",
  },
  15006: {
    title: "Matched Default Rule",
    category: "Policy",
    causes: ["No specific rule matched; default rule was used"],
    fix: "Review policy rules. If the default rule is too permissive or restrictive, add specific rules.",
  },
  15007: {
    title: "Policy result type did not match expected result",
    category: "Policy",
    causes: ["Policy misconfiguration — result type mismatch"],
    fix: "Check policy rules and result types. Ensure consistency between authentication and authorization policies.",
  },
  15008: {
    title: "Evaluating Service Selection Policy",
    category: "Policy",
    causes: [],
    fix: "Informational — ISE is evaluating which access service to use.",
  },
  15009: {
    title: "Exception Authorization Policy not configured",
    category: "Policy",
    causes: ["No exception authorization rules configured"],
    fix: "Add exception authorization rules if needed in the authorization policy.",
  },
  15010: {
    title: "Identity policy is not configured",
    category: "Policy",
    causes: ["Authentication policy has no identity source configured"],
    fix: "Configure an identity source in the authentication policy.",
  },
  15011: {
    title: "Authorization Policy not configured",
    category: "Policy",
    causes: ["No authorization policy rules defined"],
    fix: "Configure authorization policy rules in Policy > Authorization.",
  },
  15012: {
    title: "Selected Access Service",
    category: "Policy",
    causes: [],
    fix: "Informational — an access service was selected for this request.",
  },
  15013: {
    title: "Selected Identity Source",
    category: "Policy",
    causes: [],
    fix: "Informational — identity source was selected for authentication.",
  },
  15015: {
    title: "Could not find ID Store",
    category: "Policy",
    causes: ["Referenced identity store does not exist or is misconfigured"],
    fix: "Check authentication policy — the referenced identity store name may be incorrect. Verify in Administration > Identity Management > External Identity Sources.",
  },
  15016: {
    title: "Selected Authorization Profile",
    category: "Policy",
    causes: [],
    fix: "Informational — an authorization profile was selected.",
  },
  15019: {
    title: "Could not find selected Authorization Profiles",
    category: "Policy",
    causes: ["Authorization policy references a profile that does not exist"],
    fix: "Check authorization policy. The referenced authorization profile may have been deleted.",
  },
  15022: {
    title: "Could not find selected Access Service",
    category: "Policy",
    causes: ["Service Selection Policy references a missing access service"],
    fix: "Check Service Selection Policy. The referenced access service may have been deleted.",
  },
  15023: {
    title: "Could not match rule",
    category: "Policy",
    causes: ["No policy rule conditions matched this request"],
    fix: "Review policy rules. Add a rule that matches this user/device/context.",
  },
  15024: {
    title: "PAP is not allowed",
    category: "Policy",
    causes: ["PAP authentication is disabled in the Allowed Protocols"],
    fix: "Enable PAP/ASCII in the Allowed Protocols. Or configure the NAD for a different auth protocol.",
  },
  15035: {
    title: "Evaluating Exception Authorization Policy",
    category: "Policy",
    causes: [],
    fix: "Informational.",
  },
  15036: {
    title: "Evaluating Authorization Policy",
    category: "Policy",
    causes: [],
    fix: "Informational — ISE is evaluating authorization rules.",
  },
  15039: {
    title: "Rejected per authorization profile",
    category: "RADIUS",
    causes: [
      "Default authz rule is deny and no matching authz rules for this session",
      "Authorization profile with ACCESS_REJECT was matched",
    ],
    fix: "Check authorization policy rules. The DenyAccess profile was matched. Add an authz rule for this user/group.",
  },
  15041: {
    title: "Evaluating Identity Policy",
    category: "Policy",
    causes: [],
    fix: "Informational.",
  },
  15042: {
    title: "No rule was matched",
    category: "Policy",
    causes: ["No policy rule conditions matched this request"],
    fix: "Review authentication/authorization policy rules. Add a matching rule.",
  },
  15045: {
    title: "CHAP is not allowed",
    category: "Policy",
    causes: ["CHAP disabled in Allowed Protocols"],
    fix: "Enable CHAP in Allowed Protocols or change NAD authentication method.",
  },
  15046: {
    title: "MS-CHAP v1 is not allowed",
    category: "Policy",
    causes: ["MS-CHAPv1 disabled in Allowed Protocols"],
    fix: "Enable MS-CHAPv1 in Allowed Protocols or use MS-CHAPv2.",
  },
  15047: {
    title: "MS-CHAP v2 is not allowed",
    category: "Policy",
    causes: ["MS-CHAPv2 disabled in Allowed Protocols"],
    fix: "Enable MS-CHAPv2 in Allowed Protocols.",
  },
  15048: {
    title: "Queried PIP",
    category: "Policy",
    causes: [],
    fix: "Informational — Policy Information Point was queried for attribute values.",
  },
};

// ──────────────────────────────────────────────
//  22xxx — Authentication Workflow & Identity
// ──────────────────────────────────────────────

const CODES_22XXX = {
  22000: {
    title: "Authentication resulted in internal error",
    category: "Authentication",
    causes: ["ISE internal error during authentication"],
    fix: "Check ISE logs for details. May require ISE restart or support case.",
  },
  22003: {
    title: "Missing attribute for authentication",
    category: "Authentication",
    causes: ["Required attribute not present in RADIUS request"],
    fix: "Verify NAD is sending all required RADIUS attributes (e.g., User-Name, User-Password, Calling-Station-ID).",
  },
  22004: {
    title: "Wrong password",
    category: "Authentication",
    causes: ["Password mismatch"],
    fix: "Verify user password. Reset if needed: cisco-ise internal-user update <user> --user-password <pass>.",
  },
  22007: {
    title: "Username attribute is not present in the authentication request",
    category: "Authentication",
    causes: ["RADIUS request missing User-Name attribute"],
    fix: "Check NAD configuration — ensure it sends User-Name in RADIUS requests.",
  },
  22015: {
    title: "Identity sequence continues to the next IDStore",
    category: "Workflow",
    causes: [],
    fix: "Informational — ISE trying next identity store in the sequence.",
  },
  22016: {
    title: "Identity sequence completed iterating the IDStores",
    category: "Workflow",
    causes: [],
    fix: "Informational — all identity stores in the sequence were checked.",
  },
  22017: {
    title: "Selected Identity Source is DenyAccess",
    category: "Workflow",
    causes: ["Authentication policy is configured to deny access"],
    fix: "Check authentication policy identity source. It is set to DenyAccess.",
  },
  22020: {
    title: "Configuration error: identity source blank",
    category: "Workflow",
    causes: ["Authentication policy has no identity source configured"],
    fix: "Configure an identity source in the authentication policy rule.",
  },
  22024: {
    title: "Detected error while iterating IDStores but continuing per Advanced Option",
    category: "Workflow",
    causes: ["Identity store returned an error but 'Continue' advanced option is set"],
    fix: "Check identity store connectivity. The 'Continue' option masked the error.",
  },
  22025: {
    title: "User or host not found but continuing per Advanced Option",
    category: "Workflow",
    causes: ["User not found in current identity store; trying next per Advanced Options"],
    fix: "Verify user exists in at least one configured identity store.",
  },
  22027: {
    title: "Authentication failed but continuing per Advanced Option",
    category: "Workflow",
    causes: ["Auth failed in current store but 'Continue' advanced option is set"],
    fix: "Check why authentication failed in the first store. Continuing may mask real issues.",
  },
  22028: {
    title: "Authentication failed and the advanced options are ignored",
    category: "Workflow",
    causes: ["Authentication failed and no recovery via advanced options"],
    fix: "Check the specific authentication failure reason. The advanced option 'Continue' does not apply here.",
  },
  22034: {
    title: "Attribute retrieval failed",
    category: "Workflow",
    causes: ["Could not retrieve user/host attributes from identity store"],
    fix: "Check identity store connectivity and attribute mapping configuration.",
  },
  22037: {
    title: "Authentication Passed",
    category: "Workflow",
    causes: [],
    fix: "No action needed.",
  },
  22040: {
    title: "Wrong password or invalid shared secret",
    category: "Authentication",
    causes: [
      "User entered wrong password",
      "Shared RADIUS secret mismatch (for PAP authentication)",
    ],
    fix: "Check user password: cisco-ise internal-user get <user>. Check device shared secret: cisco-ise network-device get <name>.",
  },
  22041: {
    title: "User not found in Internal Identity Store",
    category: "Authentication",
    causes: ["Username does not exist in ISE internal user database"],
    fix: "Add the user: cisco-ise internal-user add --name <user>. Or check if auth policy should point to a different identity store (e.g., AD).",
  },
  22042: {
    title: "Authentication failed — dropping per Advanced Option",
    category: "Workflow",
    causes: ["Auth failed and 'Drop' advanced option is configured"],
    fix: "Check why authentication failed. The request was silently dropped per policy.",
  },
  22043: {
    title: "Current Identity Store does not support the authentication method — skipping",
    category: "Authentication",
    causes: ["Identity store cannot handle the EAP method used"],
    fix: "Check identity store capabilities. E.g., internal store does not support EAP-TLS with external certificates.",
  },
  22044: {
    title: "Identity policy configured for certificate auth but received password auth",
    category: "Workflow",
    causes: ["Mismatch between ISE auth policy and supplicant configuration"],
    fix: "Check authentication policy — identity source expects certificate but supplicant sent password credentials. Reconfigure either the policy or the supplicant.",
  },
  22045: {
    title: "Identity policy configured for password auth but received certificate auth",
    category: "Workflow",
    causes: ["Mismatch between ISE auth policy and supplicant configuration"],
    fix: "Check authentication policy — identity source expects password but supplicant sent certificate credentials.",
  },
  22047: {
    title: "Principal username attribute is missing in client certificate",
    category: "Authentication",
    causes: [
      "Client certificate does not contain the expected attribute (e.g., Subject CN, SAN)",
      "Certificate profile misconfiguration",
      "Bug with EAP-TLS Session Resume / Stateless Session Resume",
    ],
    fix: "Check Certificate Authentication Profile — verify the principal username X.509 attribute. Disable Session Resume as workaround if needed.",
  },
  22048: {
    title: "Client certificate binary is missing",
    category: "Authentication",
    causes: ["Supplicant did not send a client certificate"],
    fix: "Verify supplicant has a valid client certificate installed and is configured to send it.",
  },
  22049: {
    title: "Binary comparison of certificates failed",
    category: "Authentication",
    causes: ["Certificate stored in identity store does not match the one presented"],
    fix: "Re-enroll the client certificate. Verify certificate in the identity store matches.",
  },
  22050: {
    title: "User or host disabled in current IDStore in attribute retrieval mode",
    category: "Workflow",
    causes: ["Account is disabled in the identity store"],
    fix: "Enable the account in the identity store.",
  },
  22053: {
    title: "Unknown user or host — dropping per Advanced Option",
    category: "Workflow",
    causes: ["User not found and 'Drop' advanced option is configured"],
    fix: "Add the user to an identity store. Or change the advanced option to 'Continue' or 'Reject'.",
  },
  22055: {
    title: "Failed to find expected Principal Username X509 Attribute in certificate",
    category: "Authentication",
    causes: ["Certificate does not contain the attribute configured in the Certificate Authentication Profile"],
    fix: "Check Certificate Authentication Profile configuration. Verify the X.509 attribute name matches what the certificate contains.",
  },
  22056: {
    title: "Subject not found in the applicable identity store(s)",
    category: "Workflow",
    causes: [
      "User or device not found in any configured identity store",
      "Authentication policy points to wrong identity store",
      "Missing domain suffix for AD auth (user@domain.com)",
      "MAB — endpoint MAC not in the endpoint database",
    ],
    fix: "Check user exists: cisco-ise internal-user list. Verify auth policy points to correct identity store. For AD, ensure supplicant sends domain suffix. For MAB, add endpoint: cisco-ise endpoint add.",
  },
  22057: {
    title: "The advanced option for failed authentication is used",
    category: "Workflow",
    causes: [],
    fix: "Informational — advanced option processing for failed authentication.",
  },
  22058: {
    title: "The advanced option for unknown user is used",
    category: "Workflow",
    causes: ["User was not found in the identity store and the advanced option is applied"],
    fix: "Check if user should exist. The identity sequence advanced option is handling the unknown user case.",
  },
  22059: {
    title: "The advanced option for process failure is used",
    category: "Workflow",
    causes: ["Identity store returned a processing error and the advanced option is applied"],
    fix: "Check identity store connectivity and health.",
  },
  22060: {
    title: "'Continue' advanced option is configured for failed authentication",
    category: "Workflow",
    causes: [],
    fix: "Informational — ISE will try the next identity store despite the failure.",
  },
  22061: {
    title: "'Reject' advanced option is configured for failed authentication",
    category: "Workflow",
    causes: ["Authentication will be rejected because 'Reject' is the configured option"],
    fix: "If this is unexpected, change the advanced option to 'Continue' in the identity source sequence.",
  },
  22062: {
    title: "'Drop' advanced option is configured for failed authentication",
    category: "Workflow",
    causes: ["Authentication will be silently dropped"],
    fix: "If this is unexpected, change the advanced option. 'Drop' gives the client no feedback.",
  },
  22063: {
    title: "Wrong password",
    category: "Authentication",
    causes: ["Password mismatch in identity store"],
    fix: "Verify and reset password if needed.",
  },
  22064: {
    title: "Authentication method is not supported by any applicable identity store(s)",
    category: "Workflow",
    causes: ["None of the configured identity stores support the authentication protocol used"],
    fix: "Check identity stores in the sequence. E.g., RSA SecurID does not support MSCHAP. Match the auth method to a compatible store.",
  },
};

// ──────────────────────────────────────────────
//  24xxx — External Identity Stores (LDAP, AD, RSA, RADIUS Token, Local)
// ──────────────────────────────────────────────

const CODES_24XXX = {
  // --- LDAP ---
  24000: {
    title: "Connection established with LDAP server",
    category: "External-LDAP",
    causes: [],
    fix: "Informational.",
  },
  24001: {
    title: "Cannot establish connection with LDAP server",
    category: "External-LDAP",
    causes: ["LDAP server unreachable", "DNS resolution failure", "Firewall blocking LDAP port"],
    fix: "Check network connectivity to LDAP server. Verify DNS. Check firewall rules for LDAP port (389/636).",
  },
  24002: {
    title: "Cannot bind connection with administrator credentials",
    category: "External-LDAP",
    causes: ["LDAP bind DN or password incorrect"],
    fix: "Verify the Admin DN and password in Administration > Identity Management > External Identity Sources > LDAP.",
  },
  24003: {
    title: "Cannot bind connection with anonymous credentials",
    category: "External-LDAP",
    causes: ["LDAP server does not allow anonymous binds"],
    fix: "Configure admin credentials for LDAP binding instead of anonymous.",
  },
  24006: {
    title: "User search ended with an error",
    category: "External-LDAP",
    causes: ["LDAP search operation failed"],
    fix: "Check LDAP search base and filter configuration. Verify LDAP connectivity.",
  },
  24008: {
    title: "User not found in LDAP Server",
    category: "External-LDAP",
    causes: ["User does not exist in the configured LDAP search base"],
    fix: "Verify user exists in LDAP. Check search base DN and user object filter.",
  },
  24010: {
    title: "Ambiguous user",
    category: "External-LDAP",
    causes: ["Multiple LDAP entries matched the search — cannot determine which user"],
    fix: "Make the LDAP search filter more specific. Check for duplicate entries.",
  },
  24019: {
    title: "LDAP connection error was encountered",
    category: "External-LDAP",
    causes: ["LDAP connection dropped or timed out"],
    fix: "Check LDAP server availability and network connectivity.",
  },
  24020: {
    title: "User authentication against LDAP Server failed — wrong password",
    category: "External-LDAP",
    causes: ["User entered incorrect password for LDAP authentication"],
    fix: "Verify user credentials. Check LDAP password policy.",
  },
  24021: {
    title: "User authentication ended with an error",
    category: "External-LDAP",
    causes: ["LDAP authentication error — not just wrong password"],
    fix: "Check LDAP server logs. Verify LDAP configuration in ISE.",
  },
  24022: {
    title: "User authentication succeeded",
    category: "External-LDAP",
    causes: [],
    fix: "No action needed.",
  },
  24030: {
    title: "SSL connection error was encountered",
    category: "External-LDAP",
    causes: ["LDAPS certificate validation failure", "TLS handshake error"],
    fix: "Import LDAP server's CA certificate into ISE trust store. Verify LDAPS port (636).",
  },
  24050: {
    title: "Cannot authenticate with LDAP — password not present or empty",
    category: "External-LDAP",
    causes: ["Supplicant sent empty password"],
    fix: "Check supplicant credential configuration.",
  },
  24051: {
    title: "Secure LDAP failed SSL handshake — unknown CA in client certificate chain",
    category: "External-LDAP",
    causes: ["ISE does not trust the LDAP server's certificate CA"],
    fix: "Import the LDAP server's CA certificate into ISE trust store.",
  },

  // --- Generic Identity Store ---
  24100: {
    title: "Some expected attributes not found on subject record — using defaults",
    category: "Generic-ID-Store",
    causes: ["User record missing some configured attributes"],
    fix: "Verify attribute mapping. Check if default values are acceptable.",
  },
  24101: {
    title: "Some retrieved attributes contain multiple values — using defaults",
    category: "Generic-ID-Store",
    causes: ["Multi-valued attribute where single value expected"],
    fix: "Check attribute mapping. ISE uses the first value or default.",
  },

  // --- Local User DB ---
  24201: {
    title: "Internal ID Store successfully connected to database",
    category: "Local-user-DB",
    causes: [],
    fix: "Informational.",
  },
  24202: {
    title: "Internal ID Store could not connect to the database",
    category: "Local-user-DB",
    causes: ["ISE internal database error"],
    fix: "Check ISE application health. May require ISE restart.",
  },
  24203: {
    title: "User need to change password",
    category: "Local-user-DB",
    causes: ["Password change required by policy"],
    fix: "User must change password. Ensure password change is allowed in Allowed Protocols.",
  },
  24206: {
    title: "User disabled",
    category: "Local-user-DB",
    causes: ["User account is disabled in internal identity store"],
    fix: "Enable the user: cisco-ise internal-user update <user> --enable.",
  },
  24207: {
    title: "Host disabled",
    category: "Local-user-DB",
    causes: ["Endpoint is disabled in internal endpoint store"],
    fix: "Enable the endpoint in the ISE endpoint database.",
  },
  24216: {
    title: "The user is not found in the internal users identity store",
    category: "Local-user-DB",
    causes: ["Username does not exist in ISE internal users"],
    fix: "Add the user: cisco-ise internal-user add --name <user>. Or point auth policy to correct identity store.",
  },
  24217: {
    title: "The host is not found in the internal endpoints identity store",
    category: "Local-user-DB",
    causes: ["MAC address not in ISE endpoint database"],
    fix: "Add the endpoint: cisco-ise endpoint add --mac <mac>. Or enable profiling for auto-discovery.",
  },

  // --- Active Directory ---
  24400: {
    title: "Connection to ISE Active Directory agent established successfully",
    category: "External-Active-Directory",
    causes: [],
    fix: "Informational.",
  },
  24401: {
    title: "Could not establish connection with ISE Active Directory agent",
    category: "External-Active-Directory",
    causes: ["AD connector agent is down or unreachable"],
    fix: "Restart the AD connector. Check ISE services status. Verify ISE is joined to AD domain.",
  },
  24402: {
    title: "User authentication against Active Directory succeeded",
    category: "External-Active-Directory",
    causes: [],
    fix: "No action needed.",
  },
  24403: {
    title: "User authentication against Active Directory failed",
    category: "External-Active-Directory",
    causes: ["General AD authentication failure"],
    fix: "Check the specific sub-code (24406-24415) for the exact reason.",
  },
  24404: {
    title: "Active Directory operation failed — invalid input parameter",
    category: "External-Active-Directory",
    causes: ["Malformed request to AD"],
    fix: "Check identity source configuration. Verify username format.",
  },
  24405: {
    title: "Active Directory operation failed — timeout error",
    category: "External-Active-Directory",
    causes: ["AD domain controller did not respond in time"],
    fix: "Check network connectivity to domain controllers. Check DC performance. Verify DNS resolution.",
  },
  24406: {
    title: "User authentication against Active Directory failed — invalid credentials",
    category: "External-Active-Directory",
    causes: ["General credential failure against AD"],
    fix: "Verify user credentials.",
  },
  24407: {
    title: "User authentication against Active Directory failed — user must change password",
    category: "External-Active-Directory",
    causes: ["AD requires password change before next logon"],
    fix: "User must change their AD password. Enable password change in Allowed Protocols if using EAP-MSCHAP.",
  },
  24408: {
    title: "User authentication against Active Directory failed — wrong password",
    category: "External-Active-Directory",
    causes: [
      "User entered wrong password",
      "For PAP, could also be RADIUS shared secret mismatch",
    ],
    fix: "Check user credentials. If using PAP, also verify shared secret on the network device: cisco-ise network-device get <name>.",
  },
  24409: {
    title: "User authentication against Active Directory failed — account disabled",
    category: "External-Active-Directory",
    causes: ["User account is disabled in Active Directory"],
    fix: "Enable the user account in AD (Active Directory Users and Computers).",
  },
  24410: {
    title: "User authentication against Active Directory failed — restricted logon hours",
    category: "External-Active-Directory",
    causes: ["User is attempting to log in outside of allowed hours configured in AD"],
    fix: "Check AD logon hours restriction for this user. Adjust if needed.",
  },
  24411: {
    title: "Change password against Active Directory failed — non-compliant password",
    category: "External-Active-Directory",
    causes: ["New password does not meet AD password complexity requirements"],
    fix: "Password must meet AD complexity requirements (length, complexity, history).",
  },
  24412: {
    title: "User not found in Active Directory",
    category: "External-Active-Directory",
    causes: ["Username does not exist in AD", "Wrong domain specified"],
    fix: "Verify user exists in AD. Check domain suffix (user@domain.com or DOMAIN\\user). Verify ISE AD join point scopes correct OUs.",
  },
  24413: {
    title: "User's domain is not recognized by Active Directory",
    category: "External-Active-Directory",
    causes: ["Domain specified in username is not known to the AD forest"],
    fix: "Verify domain suffix. Check ISE AD join point configuration and domain scope.",
  },
  24414: {
    title: "User authentication against Active Directory failed — account expired",
    category: "External-Active-Directory",
    causes: ["AD user account has passed its expiration date"],
    fix: "Extend or remove the account expiration date in AD.",
  },
  24415: {
    title: "User authentication against Active Directory failed — account locked out",
    category: "External-Active-Directory",
    causes: ["Too many failed password attempts; account is locked in AD"],
    fix: "Unlock the account in AD. Check for automated systems that may be sending wrong passwords.",
  },
  24416: {
    title: "User's Groups retrieval from Active Directory succeeded",
    category: "External-Active-Directory",
    causes: [],
    fix: "Informational.",
  },
  24417: {
    title: "User's Groups retrieval from Active Directory failed",
    category: "External-Active-Directory",
    causes: ["AD group lookup error", "Insufficient permissions"],
    fix: "Verify ISE machine account has permission to read group membership. Check AD connectivity.",
  },
  24418: {
    title: "Machine authentication against Active Directory failed — disabled in configuration",
    category: "External-Active-Directory",
    causes: ["Machine authentication is disabled in ISE AD configuration"],
    fix: "Enable machine authentication in the AD identity source settings if machine auth is needed.",
  },
  24419: {
    title: "User's Attributes retrieval from Active Directory failed",
    category: "External-Active-Directory",
    causes: ["Could not retrieve user attributes from AD"],
    fix: "Check AD connector permissions. Verify attribute names in ISE AD configuration.",
  },
  24420: {
    title: "User's Attributes retrieval from Active Directory succeeded",
    category: "External-Active-Directory",
    causes: [],
    fix: "Informational.",
  },
  24422: {
    title: "ISE has confirmed previous successful machine authentication for user in AD",
    category: "External-Active-Directory",
    causes: [],
    fix: "Informational — Machine Access Restriction (MAR) cache hit.",
  },
  24423: {
    title: "ISE has not been able to confirm previous successful machine authentication",
    category: "External-Active-Directory",
    causes: ["No cached machine authentication for this machine", "MAR cache timeout"],
    fix: "Ensure machine authentication occurs before user authentication. Check MAR cache timer settings.",
  },
  24427: {
    title: "Access to Active Directory failed",
    category: "External-Active-Directory",
    causes: ["General AD connectivity failure"],
    fix: "Check ISE AD join status. Verify network connectivity to domain controllers. Check DNS.",
  },
  24428: {
    title: "Connection related error in LRPC, LDAP, or KERBEROS",
    category: "External-Active-Directory",
    causes: ["Low-level AD communication failure"],
    fix: "Check network connectivity. Verify DNS. Check ISE AD join status. Restart AD connector if needed.",
  },
  24429: {
    title: "Could not establish connection with Active Directory",
    category: "External-Active-Directory",
    causes: ["AD domain controller unreachable", "DNS issue", "Firewall blocking"],
    fix: "Verify DC is reachable. Check DNS SRV records. Check firewall rules for LDAP (389/636), Kerberos (88), MSRPC (135).",
  },
  24436: {
    title: "Machine Lookup in Active Directory failed",
    category: "External-Active-Directory",
    causes: ["Machine account not found or lookup error"],
    fix: "Verify machine account exists in AD. Check if ISE is joined to the correct domain.",
  },
  24437: {
    title: "Machine not found in Active Directory",
    category: "External-Active-Directory",
    causes: ["Machine hostname does not match any AD computer account"],
    fix: "Verify the machine is joined to AD. Check the host/ prefix in the EAP identity.",
  },
  24441: {
    title: "Account not permitted to log on using the current workstation",
    category: "External-Active-Directory",
    causes: ["AD 'Log On To' restriction limits which workstations the user can use"],
    fix: "Check AD user properties > 'Log On To' settings. Add the workstation or remove the restriction.",
  },
  24446: {
    title: "Active Directory domain controller is unreachable",
    category: "External-Active-Directory",
    causes: ["No DC responding", "Network partition", "DNS failure"],
    fix: "Verify DC availability. Check DNS resolution. Check network connectivity from ISE node.",
  },
  24447: {
    title: "ISE machine account in Active Directory is disabled, deleted, or reset",
    category: "External-Active-Directory",
    causes: ["ISE's own AD machine account has been tampered with"],
    fix: "Re-join ISE to the AD domain. Check AD for the ISE machine account status.",
  },
  24460: {
    title: "Multiple occurrences of the user name in Active Directory",
    category: "External-Active-Directory",
    causes: ["Ambiguous user — multiple AD accounts matched"],
    fix: "Ensure username is unique. Use UPN format (user@domain.com) to disambiguate.",
  },
  24461: {
    title: "Could not locate the user in Active Directory using User Lookup",
    category: "External-Active-Directory",
    causes: ["User Lookup failed to find the account"],
    fix: "Verify user exists in AD. Check ISE AD identity resolution settings and scope.",
  },
  24465: {
    title: "ISE is not joined to an Active Directory Domain Controller",
    category: "External-Active-Directory",
    causes: ["ISE node has not been joined to AD"],
    fix: "Join ISE to AD: Administration > Identity Management > External Identity Sources > Active Directory > Join.",
  },
  24466: {
    title: "ISE Active Directory agent is down",
    category: "External-Active-Directory",
    causes: ["AD connector process is not running"],
    fix: "Restart AD connector via ISE CLI or re-join ISE to AD.",
  },
  24470: {
    title: "Machine authentication against Active Directory is successful",
    category: "External-Active-Directory",
    causes: [],
    fix: "No action needed.",
  },
  24484: {
    title: "Machine auth against AD failed — machine password expired",
    category: "External-Active-Directory",
    causes: ["Machine account password has expired in AD"],
    fix: "Reset the machine account password in AD. Rejoin the machine to the domain.",
  },
  24485: {
    title: "Machine auth against AD failed — wrong password",
    category: "External-Active-Directory",
    causes: ["Machine account credential mismatch"],
    fix: "Rejoin the machine to the AD domain to reset machine credentials.",
  },
  24486: {
    title: "Machine auth against AD failed — machine account disabled",
    category: "External-Active-Directory",
    causes: ["Computer account is disabled in AD"],
    fix: "Enable the computer account in Active Directory.",
  },
  24489: {
    title: "Machine auth against AD failed — machine account expired",
    category: "External-Active-Directory",
    causes: ["Computer account has expired in AD"],
    fix: "Re-enable or recreate the computer account in AD.",
  },
  24490: {
    title: "Machine auth against AD failed — machine account locked out",
    category: "External-Active-Directory",
    causes: ["Computer account is locked out in AD"],
    fix: "Unlock the computer account in AD.",
  },
  24493: {
    title: "ISE has problems communicating with AD using its machine credentials",
    category: "External-Active-Directory",
    causes: ["ISE's own machine account credential issue"],
    fix: "Re-join ISE to the AD domain to refresh machine credentials.",
  },
  24494: {
    title: "Active Directory DNS servers are not available",
    category: "External-Active-Directory",
    causes: ["ISE cannot reach AD DNS servers"],
    fix: "Verify ISE DNS settings point to AD-integrated DNS servers. Check network connectivity.",
  },
  24495: {
    title: "Active Directory servers are not available",
    category: "External-Active-Directory",
    causes: ["No AD domain controllers responding"],
    fix: "Check DC availability. Verify DNS SRV records. Check network connectivity from ISE.",
  },

  // --- RSA SecurID ---
  24500: {
    title: "Authenticating user against the RSA SecurID Server",
    category: "External-RSA-SecurID-Server",
    causes: [],
    fix: "Informational.",
  },
  24503: {
    title: "Cannot establish a session with the RSA SecurID Server",
    category: "External-RSA-SecurID-Server",
    causes: ["RSA server unreachable or configuration error"],
    fix: "Check RSA SecurID server connectivity. Verify RSA agent configuration in ISE.",
  },
  24505: {
    title: "User authentication has succeeded (RSA SecurID)",
    category: "External-RSA-SecurID-Server",
    causes: [],
    fix: "No action needed.",
  },
  24508: {
    title: "User authentication failed (RSA SecurID)",
    category: "External-RSA-SecurID-Server",
    causes: ["Wrong token code", "PIN incorrect", "Token out of sync"],
    fix: "Verify token code. Re-sync token if needed. Check RSA server logs.",
  },
  24544: {
    title: "RSA agent initialization failed",
    category: "External-RSA-SecurID-Server",
    causes: ["RSA agent configuration error"],
    fix: "Check RSA agent configuration in ISE. Re-import sdconf.rec if needed.",
  },
  24547: {
    title: "RSA request timeout expired — session cancelled",
    category: "External-RSA-SecurID-Server",
    causes: ["RSA server did not respond in time"],
    fix: "Check RSA server availability. Increase timeout if needed.",
  },

  // --- RADIUS Token ---
  24608: {
    title: "RADIUS token identity store failed due to wrong input",
    category: "Radius-Token",
    causes: ["Invalid input to RADIUS token server"],
    fix: "Check RADIUS token server configuration in ISE.",
  },
  24611: {
    title: "RADIUS token server configuration error",
    category: "Radius-Token",
    causes: ["Misconfigured RADIUS token identity store"],
    fix: "Verify RADIUS token server settings in ISE: IP, port, shared secret.",
  },
  24612: {
    title: "Authentication against the RADIUS token server succeeded",
    category: "Radius-Token",
    causes: [],
    fix: "No action needed.",
  },
  24613: {
    title: "Authentication against the RADIUS token server failed",
    category: "Radius-Token",
    causes: ["Wrong token code or credentials"],
    fix: "Verify credentials. Check RADIUS token server shared secret.",
  },
  24616: {
    title: "RADIUS token identity store received timeout error",
    category: "Radius-Token",
    causes: ["RADIUS token server did not respond"],
    fix: "Check network connectivity to token server. Verify server address and port.",
  },
};

// ──────────────────────────────────────────────
//  Other Notable Code Ranges
// ──────────────────────────────────────────────

const CODES_OTHER = {
  // --- Admin Login (51xxx) ---
  51000: {
    title: "Administrator authentication failed",
    category: "Administrator-Login",
    causes: ["Admin login failure — various reasons"],
    fix: "Check admin credentials. See specific sub-code (51005-51022) for details.",
  },
  51005: {
    title: "Administrator authentication failed — account disabled",
    category: "Administrator-Login",
    causes: ["Admin account is disabled"],
    fix: "Re-enable the admin account in Administration > System > Admin Access > Administrators.",
  },
  51007: {
    title: "Authentication failed — account disabled due to password expiration",
    category: "Administrator-Login",
    causes: ["Admin password has expired"],
    fix: "Reset admin password via ISE CLI.",
  },
  51008: {
    title: "Administrator authentication failed — account disabled due to excessive failed attempts",
    category: "Administrator-Login",
    causes: ["Too many failed login attempts locked the admin account"],
    fix: "Wait for lockout to expire or reset via ISE CLI: application reset-passwd ise <admin-name>.",
  },
  51009: {
    title: "Authentication failed — ISE Runtime is not running",
    category: "Administrator-Login",
    causes: ["ISE application services not fully started"],
    fix: "Wait for ISE services to start. Check: show application status ise.",
  },
  51020: {
    title: "Administrator authentication failed — login username does not exist",
    category: "Administrator-Login",
    causes: ["Admin username not found"],
    fix: "Verify admin username. Create if needed: Administration > System > Admin Access.",
  },
  51021: {
    title: "Administrator authentication failed — wrong password",
    category: "Administrator-Login",
    causes: ["Incorrect admin password"],
    fix: "Reset admin password via ISE CLI if needed.",
  },
};

// ──────────────────────────────────────────────
//  Combined Map
// ──────────────────────────────────────────────

const FAILURE_MAP = {
  ...CODES_5XXX,
  ...CODES_11XXX,
  ...CODES_12XXX,
  ...CODES_13XXX,
  ...CODES_15XXX,
  ...CODES_22XXX,
  ...CODES_24XXX,
  ...CODES_OTHER,
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

// Lookup by category
function getCodesByCategory(category) {
  return Object.entries(FAILURE_MAP)
    .filter(([, v]) => v.category === category)
    .map(([code, v]) => ({ code: parseInt(code), ...v }));
}

// Get all failure codes (non-informational, i.e., codes that have causes)
function getFailureCodes() {
  return Object.entries(FAILURE_MAP)
    .filter(([, v]) => v.causes && v.causes.length > 0)
    .map(([code, v]) => ({ code: parseInt(code), ...v }));
}

module.exports = { FAILURE_MAP, matchFailure, getCodesByCategory, getFailureCodes };
