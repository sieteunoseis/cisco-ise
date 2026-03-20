---
name: cisco-ise-cli
description: Use when managing Cisco ISE via the cisco-ise CLI — endpoints, guests, network devices, sessions, RADIUS/TACACS monitoring, and identity management operations.
---

# cisco-ise CLI

CLI for Cisco ISE (Identity Services Engine) 3.1+ targeting day-to-day operations and troubleshooting.

## Setup

Configure a cluster (one-time):

```bash
cisco-ise config add <name> --host <host> --username <user> --password '<ss:ID:password>' --insecure
cisco-ise config test
```

Or use environment variables:

```bash
export CISCO_ISE_HOST=<host>
export CISCO_ISE_USERNAME=<user>
export CISCO_ISE_PASSWORD=<password>
```

Secret Server references are supported: `<ss:ID:field>` (requires ss-cli).

## Command Groups

| Command | Description |
|---------|-------------|
| `config` | Manage ISE cluster configurations (add/use/list/show/remove/test/update/clear-cache) |
| `endpoint` | Manage endpoints (list/search/add/update/delete, CSV bulk) |
| `guest` | Manage guest users (list/search/create/extend/suspend/reinstate/delete/portals) |
| `network-device` | Manage NADs (list/search/get/add/update/delete) |
| `session` | Active sessions (list/search/disconnect/reauth) |
| `radius` | RADIUS monitoring (failures with human-readable reasons, live polling) |
| `tacacs` | TACACS+ monitoring (failures/live/command-sets/profiles) |
| `identity-group` | List identity groups (--type endpoint/user) |
| `auth-profile` | List/get authorization profiles |
| `trustsec` | TrustSec SGTs and SGACLs (read-only) |
| `deployment` | ISE deployment nodes and status (read-only) |

## Common Workflows

### List all endpoints

```bash
cisco-ise endpoint list --insecure
cisco-ise endpoint search --mac AA:BB:CC:DD:EE:FF --insecure
```

### Add an endpoint (with dry-run)

```bash
cisco-ise endpoint add --mac AA:BB:CC:DD:EE:FF --group "Profiled" --dry-run --insecure
cisco-ise endpoint add --csv endpoints.csv --insecure
```

### Check RADIUS authentication failures

```bash
cisco-ise radius failures --last 1h --insecure
cisco-ise radius failures --last 30m --user jdoe --insecure
```

### Live RADIUS monitoring

```bash
cisco-ise radius live --insecure
```

### Manage guest users

```bash
cisco-ise guest portals --insecure
cisco-ise guest create --first "John" --last "Doe" --email "john@example.com" --portal "Sponsored Guest Portal (default)" --insecure
cisco-ise guest list --insecure
```

### Check active sessions

```bash
cisco-ise session list --insecure
cisco-ise session search --mac E2:7C:7E:5B:F0:E0 --insecure
cisco-ise session disconnect E2:7C:7E:5B:F0:E0 --insecure
```

### Manage network devices

```bash
cisco-ise network-device list --insecure
cisco-ise network-device add --name "switch01" --ip 10.0.0.1 --radius-secret '<ss:ID:radius-secret>' --insecure
```

### View deployment info

```bash
cisco-ise deployment nodes --insecure
cisco-ise deployment status --insecure
```

## MAC Address Formats

Any common format is accepted and automatically normalized:
- `AA:BB:CC:DD:EE:FF` (colon-separated)
- `AA-BB-CC-DD-EE-FF` (dash-separated)
- `AABB.CCDD.EEFF` (Cisco dot notation)
- `aabbccddeeff` (bare hex)

## Output Formats

- `--format table` (default) — human-readable
- `--format json` — for scripting/parsing
- `--format toon` — token-efficient for AI agents (recommended)
- `--format csv` — for spreadsheets

## Key Flags

- `--insecure` — required for self-signed ISE certs (most environments)
- `--dry-run` — show HTTP method, URL, and payload without executing
- `--read-only` — block all write operations (human-in-the-loop confirmation)
- `--cluster <name>` — target a specific cluster
- `--no-cache` — bypass 5-minute response cache
- `--debug` — enable verbose logging
- `--no-audit` — disable audit trail logging

## RADIUS Troubleshooting Workflow

When a user reports a connectivity or authentication problem, follow this workflow. Always use `--format json` so you can parse results programmatically.

### Step 1: Identify the device

Get the MAC address from the user, or find it from active sessions:

```bash
cisco-ise session list --format json
cisco-ise session search --mac <mac> --format json
cisco-ise session search --user <username> --format json
```

### Step 2: Run troubleshoot

```bash
cisco-ise radius troubleshoot --mac <mac> --last 1d --format json
```

This returns the full auth history with: pass/fail, matched policy rules, failure reasons, auth protocol, VLAN assignment, and ISE server.

### Step 3: Analyze and correlate

Based on the troubleshoot output, run follow-up commands:

**If auth is failing — check the user:**
```bash
cisco-ise internal-user get <username> --format json
```
- Is `enabled` false? → `cisco-ise internal-user update <user> --enable`
- Is the user missing? → `cisco-ise internal-user add --user-name <user> --user-password <pass> --group <group>`

**If NAD not found (11007) — check network device:**
```bash
cisco-ise network-device list --format json
```
- Is the device missing? → `cisco-ise network-device add --name <name> --ip <ip> --radius-secret <secret>`

**If shared secret mismatch (11036, 22040) — verify NAD config:**
```bash
cisco-ise network-device get <device-name> --format json
```
- Check `authenticationSettings.radiusSharedSecret` matches the device config.

**If CoA failing (5417, 11213) — check CoA port:**
```bash
cisco-ise network-device get <device-name> --format json
```
- Check `coaPort`. Cisco uses 1700, RFC standard is 3799. UniFi uses 3799.

**If certificate rejected (12520) — check deployment:**
```bash
cisco-ise deployment nodes --format json
```
- Verify EAP certificate. Client must trust the signing CA.

**If authorization denied (15039) — check policy:**
```bash
cisco-ise auth-profile list --format json
cisco-ise identity-group list --format json
```
- User may not match any authorization rule. Check group membership.

### Step 4: Verify the fix

After making changes, ask the user to reconnect, then re-run:
```bash
cisco-ise radius troubleshoot --mac <mac> --last 30m
```
Confirm the latest auth shows PASS.

### Step 5: Common failure code reference

| Code | Issue | Quick Fix |
|------|-------|-----------|
| 5411 | EAP timeout — no client response | Check supplicant config, certificate trust |
| 5417 | CoA failed | Check NAD CoA port and shared secret |
| 11007 | NAD not found | Add NAD: `cisco-ise network-device add` |
| 11036 | Invalid Message-Authenticator | Shared secret mismatch — update NAD |
| 12520 | Client rejected ISE cert | Install CA cert on client or fix ISE EAP cert |
| 15039 | Rejected by authz profile | Add authorization rule for this user/group |
| 22040 | Wrong password or shared secret | Reset password or fix shared secret |
| 22056 | User not found | Add user or check auth policy identity store |
| 22061 | User disabled | `cisco-ise internal-user update <user> --enable` |
| 24408 | AD auth failed — wrong password | Check AD credentials, also check shared secret if PAP |

The CLI has 311 ISE failure codes mapped in `cli/utils/failure-reasons.js` with causes and remediation. The `radius troubleshoot` command outputs these automatically.

## Internal User Management

```bash
cisco-ise internal-user list
cisco-ise internal-user get <name>
cisco-ise internal-user add --user-name <name> --user-password <pass> --group <group>
cisco-ise internal-user update <name> --enable|--disable|--group <group>|--user-password <pass>
cisco-ise internal-user delete <name>
```

## Read-Only Protection

Clusters can be configured as read-only:

```bash
cisco-ise config add prod --host <host> --username <user> --password '<ss:ID:password>' --read-only --insecure
```

Write operations on read-only clusters require typing a random word to confirm (interactive TTY only). Non-interactive environments are blocked entirely.
