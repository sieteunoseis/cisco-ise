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

## Read-Only Protection

Clusters can be configured as read-only:

```bash
cisco-ise config add prod --host <host> --username <user> --password '<ss:ID:password>' --read-only --insecure
```

Write operations on read-only clusters require typing a random word to confirm (interactive TTY only). Non-interactive environments are blocked entirely.
