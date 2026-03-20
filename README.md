# cisco-ise

[![npm version](https://img.shields.io/npm/v/cisco-ise.svg)](https://www.npmjs.com/package/cisco-ise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/cisco-ise.svg)](https://nodejs.org)
[![Skills](https://img.shields.io/badge/skills.sh-cisco--ise--cli-blue)](https://skills.sh/sieteunoseis/cisco-ise)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

CLI for Cisco ISE (Identity Services Engine) 3.1+ — day-to-day operations and troubleshooting via ERS, OpenAPI, and MNT APIs.

## Installation

```bash
npm install -g cisco-ise
```

Or run without installing:

```bash
npx cisco-ise --help
```

### AI Agent Skills

```bash
npx skills add sieteunoseis/cisco-ise
```

## Quick Start

```bash
# Add a cluster
cisco-ise config add lab --host 10.0.0.1 --username admin --password '<ss:ID:password>' --insecure

# Test connection
cisco-ise config test

# List endpoints
cisco-ise endpoint list

# Check RADIUS failures
cisco-ise radius failures --last 1h
```

## Commands

| Command | Description |
|---------|-------------|
| `config` | Manage cluster configurations (add/use/list/show/remove/test/update/clear-cache) |
| `endpoint` | Manage endpoints (list/search/add/update/delete, CSV bulk import) |
| `guest` | Manage guest users (list/search/create/extend/suspend/reinstate/delete/portals) |
| `network-device` | Manage network access devices (list/search/get/add/update/delete) |
| `session` | Active sessions (list/search/disconnect/reauth via CoA) |
| `radius` | RADIUS monitoring (failures with human-readable reasons, live polling) |
| `tacacs` | TACACS+ monitoring (failures/live/command-sets/profiles) |
| `identity-group` | List identity groups (--type endpoint/user) |
| `auth-profile` | List/get authorization profiles |
| `trustsec` | TrustSec SGTs and SGACLs (read-only) |
| `deployment` | ISE deployment nodes and status (read-only) |

## Configuration

### Config file

```bash
cisco-ise config add prod --host ise.example.com --username admin --password '<ss:ID:password>' --insecure --read-only
cisco-ise config add lab --host 10.0.0.1 --username admin --password '<ss:ID:password>' --insecure
cisco-ise config use lab
cisco-ise config list
```

Config stored in `~/.cisco-ise/config.json` (mode 0600).

### Environment variables

```bash
export CISCO_ISE_HOST=<host>
export CISCO_ISE_USERNAME=<user>
export CISCO_ISE_PASSWORD=<password>
```

### Secret Server (ss-cli)

Passwords can reference Delinea Secret Server:

```bash
cisco-ise config add prod --host ise.example.com --username admin --password '<ss:1234:password>' --insecure
```

### Precedence

CLI flags > environment variables > config file.

## MAC Address Formats

Any common format is accepted and automatically normalized to `AA:BB:CC:DD:EE:FF`:

- `AA:BB:CC:DD:EE:FF` — colon-separated
- `AA-BB-CC-DD-EE-FF` — dash-separated
- `AABB.CCDD.EEFF` — Cisco dot notation
- `aabbccddeeff` — bare hex

## Endpoint Management

```bash
# List all endpoints
cisco-ise endpoint list
cisco-ise endpoint list --limit 50 --format json

# Search by MAC or group
cisco-ise endpoint search --mac AA:BB:CC:DD:EE:FF
cisco-ise endpoint search --group "Profiled"

# Add endpoint
cisco-ise endpoint add --mac AA:BB:CC:DD:EE:FF --group "Unknown" --description "Test device"

# Bulk import from CSV
cisco-ise endpoint add --csv endpoints.csv

# Update and delete
cisco-ise endpoint update AA:BB:CC:DD:EE:FF --group "Profiled"
cisco-ise endpoint delete AA:BB:CC:DD:EE:FF
```

## Guest User Management

```bash
# List portals and guests
cisco-ise guest portals
cisco-ise guest list

# Create a guest
cisco-ise guest create --first "John" --last "Doe" --email "john@example.com" --portal "Sponsored Guest Portal (default)"

# Manage guest lifecycle
cisco-ise guest extend <id> --duration 1d
cisco-ise guest suspend <id>
cisco-ise guest reinstate <id>
cisco-ise guest delete <id>
```

## Session Management

```bash
# List active sessions
cisco-ise session list
cisco-ise session search --mac E2:7C:7E:5B:F0:E0
cisco-ise session search --user jdoe

# CoA operations
cisco-ise session disconnect E2:7C:7E:5B:F0:E0
cisco-ise session reauth E2:7C:7E:5B:F0:E0
```

## RADIUS & TACACS+ Monitoring

```bash
# RADIUS failures with human-readable reasons
cisco-ise radius failures --last 1h
cisco-ise radius failures --last 30m --user jdoe

# Live RADIUS monitoring (Ctrl+C to stop)
cisco-ise radius live

# TACACS+
cisco-ise tacacs failures --last 2h
cisco-ise tacacs command-sets
cisco-ise tacacs profiles
```

## Network Devices

```bash
cisco-ise network-device list
cisco-ise network-device search --name "switch"
cisco-ise network-device add --name "switch01" --ip 10.0.0.1 --radius-secret '<ss:ID:radius-secret>'
cisco-ise network-device delete "switch01"
```

## Read-Only Protection

Clusters marked `--read-only` require typing a random word before any write operation:

```bash
cisco-ise config add prod --host ise.example.com --username admin --password '<ss:ID:password>' --read-only --insecure
```

Non-interactive environments are blocked entirely.

## Dry Run

Preview write operations without executing:

```bash
cisco-ise endpoint add --mac AA:BB:CC:DD:EE:FF --group "Unknown" --dry-run
# Output: DRY RUN — no changes made
#         POST https://ise.example.com:9060/ers/config/endpoint
#         { ... payload ... }
```

## Output Formats

```bash
cisco-ise endpoint list --format table   # default, human-readable
cisco-ise endpoint list --format json    # for scripting
cisco-ise endpoint list --format csv     # for spreadsheets
cisco-ise endpoint list --format toon    # token-efficient for AI agents
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--format <type>` | Output format: table, json, toon, csv |
| `--host <host>` | ISE hostname or IP |
| `--username <user>` | ISE username |
| `--password <pass>` | ISE password |
| `--cluster <name>` | Use a named cluster |
| `--insecure` | Skip TLS certificate verification |
| `--read-only` | Block write operations |
| `--dry-run` | Show what would happen without executing |
| `--no-audit` | Disable audit logging |
| `--no-cache` | Bypass response cache |
| `--debug` | Enable debug logging |

## RADIUS Troubleshooting

```bash
# Full auth history for a device
cisco-ise radius auth-log --mac 9A:0A:95:8F:AF:4F --last 1d

# Detailed troubleshooting with failure analysis and remediation
cisco-ise radius troubleshoot --mac 9A:0A:95:8F:AF:4F
```

The `troubleshoot` command shows:
- Device summary (user, protocol, TLS, policy match, VLAN assignment)
- Auth timeline with pass/fail and matched authorization rules
- Failure analysis with causes and fix commands from 311 mapped ISE error codes

## AI Agent Skills

This CLI is designed for both humans and AI agents. Install the [skills.sh](https://skills.sh) skill to give AI agents ISE troubleshooting capabilities:

```bash
npx skills add sieteunoseis/cisco-ise
```

The skill teaches agents the full RADIUS troubleshooting workflow — from identifying a device to diagnosing failures and suggesting fixes using CLI commands.

### Agent-Safe Deployment

For production ISE, create a read-only ISE admin account (**ERS Operator** role) for agents. This is the only unbypassable protection — the ISE server rejects all write API calls regardless of what the client does.

| Account | ISE Role | Used By |
|---------|----------|---------|
| `cli-reader` | ERS Operator + MNT Admin | AI agents (read + troubleshoot) |
| `cli-admin` | ERS Admin + `--read-only` flag | Humans (writes need TTY confirmation) |

See the [skill documentation](https://skills.sh/sieteunoseis/cisco-ise) for the full data exposure matrix and scoping guide.

## ISE API Details

- **ERS API** (port 9060) — endpoints, groups, network devices, guests, auth profiles, TrustSec
- **OpenAPI** (port 443) — deployment, policy sets
- **MNT API** (port 443) — sessions, CoA, RADIUS/TACACS auth logs

ERS must be enabled in ISE Admin > Settings > ERS Settings.

## Funding

If this tool is useful to you, consider supporting development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

## License

MIT
