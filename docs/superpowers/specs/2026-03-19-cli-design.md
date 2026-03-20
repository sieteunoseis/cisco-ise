# cisco-ise CLI Design Spec

**Date:** 2026-03-19
**Status:** Approved
**Author:** sieteunoseis + Claude

## Overview

CLI-only tool for Cisco ISE (Identity Services Engine) 3.1+ targeting day-to-day operations and troubleshooting. No library layer — commands call ISE ERS (port 9060) and OpenAPI (port 443) directly. Follows established patterns from cisco-axl and cisco-dime CLIs.

## Target ISE Version

ISE 3.1+ (both ERS and OpenAPI available)

## MAC Address Normalization

The CLI accepts MAC addresses in any common format and normalizes internally to ISE's preferred `XX:XX:XX:XX:XX:XX` format:

- `AA:BB:CC:DD:EE:FF` (colon-separated)
- `AA-BB-CC-DD-EE-FF` (dash-separated)
- `AABB.CCDD.EEFF` (Cisco dot notation)
- `aabbccddeeff` (bare)

Users never need to remember ISE's preferred format — just paste whatever they have.

## Identifier Resolution

Commands use human-friendly identifiers, not ISE internal UUIDs:

- **Endpoints** — identified by MAC address. CLI resolves to ISE UUID internally via ERS filter.
- **Network devices** — identified by name or IP. CLI resolves via ERS search.
- **Guest users** — identified by name or ISE UUID. `guest list` shows both for reference.
- **Identity groups** — identified by name. CLI resolves to group UUID via ERS lookup.
- **Auth profiles, SGTs, SGACLs** — identified by name.

The `--format json` output always includes the ISE UUID for scripting use cases.

## Command Structure

Domain-grouped commands. Each command group maps to an ISE operational domain.

### Command Groups

| Command Group | Purpose | Write Operations |
|---|---|---|
| `config` | Cluster management, defaults, ss-cli | N/A |
| `endpoint` | MAC allow/deny, identity groups, profiling | add, update, delete |
| `guest` | Guest user CRUD, portal operations | create, extend, suspend, reinstate, delete |
| `network-device` | NADs (switches, WLCs, APs) | add, update, delete |
| `session` | Active sessions, disconnect, CoA | disconnect, reauth |
| `radius` | Auth failures, live logs | read-only |
| `tacacs` | TACACS+ failures, live logs, command sets, profiles | read-only |
| `identity-group` | List endpoint & user groups | read-only |
| `auth-profile` | Authorization profiles | read-only |
| `trustsec` | SGTs, SGACLs | read-only |
| `deployment` | Node status, services, HA | read-only |
| `version` | Print CLI version | N/A |

### Endpoint Commands

```bash
cisco-ise endpoint list
cisco-ise endpoint search --mac AA:BB:CC:DD:EE:FF
cisco-ise endpoint search --mac AABB.CCDD.EEFF       # any MAC format works
cisco-ise endpoint search --group "IOT_Devices"
cisco-ise endpoint add --mac AA:BB:CC:DD:EE:FF --group "IOT_Devices" --description "Lobby printer"
cisco-ise endpoint update AA:BB:CC:DD:EE:FF --group "Printers"
cisco-ise endpoint delete AA:BB:CC:DD:EE:FF
cisco-ise endpoint add --csv endpoints.csv
cisco-ise endpoint list --format csv > export.csv
cisco-ise endpoint add --mac AA:BB:CC:DD:EE:FF --group "IOT_Devices" --dry-run
```

CSV import format: columns match flag names (`mac,group,description`). First row is headers.

### Guest Commands

```bash
cisco-ise guest list
cisco-ise guest search --name "John Doe"
cisco-ise guest search --status active
cisco-ise guest create --first "John" --last "Doe" --email "john@example.com" --portal "Sponsored_Guest"
cisco-ise guest create --csv guests.csv --portal "Sponsored_Guest"
cisco-ise guest extend <id> --duration 24h
cisco-ise guest suspend <id>
cisco-ise guest reinstate <id>
cisco-ise guest delete <id>
cisco-ise guest portals
```

`--duration` uses the same flexible time parser as `--last` (`24h`, `2d`, `30m`).

### Session Commands

```bash
cisco-ise session list
cisco-ise session search --mac AA:BB:CC:DD:EE:FF
cisco-ise session search --user "jdoe"
cisco-ise session search --nas "switch01"
cisco-ise session disconnect <id>
cisco-ise session reauth <id>
```

`session disconnect` and `session reauth` use CoA (Change of Authorization) via the MNT API (`/admin/API/mnt/CoA/Disconnect` and `/admin/API/mnt/CoA/Reauth`).

### RADIUS Commands

```bash
cisco-ise radius failures --last 30m
cisco-ise radius failures --last 2h --user "jdoe"
cisco-ise radius failures --last 1d --nas "switch01"
cisco-ise radius live
```

`radius failures` includes human-readable failure reasons by mapping error codes via `/admin/API/mnt/FailureReasons`. Output shows the failure reason text, not just the numeric code.

`radius live` polls the MNT API at 5-second intervals and prints new auth events as they arrive. Runs until interrupted (Ctrl+C). Uses `/admin/API/mnt/Session/ActiveList`.

### TACACS Commands

```bash
cisco-ise tacacs failures --last 30m
cisco-ise tacacs failures --last 2h --user "netadmin"
cisco-ise tacacs failures --last 1d --nas "router01"
cisco-ise tacacs live
cisco-ise tacacs command-sets
cisco-ise tacacs profiles
```

`tacacs live` follows the same polling pattern as `radius live`.

### Network Device & Infrastructure Commands

```bash
# Network devices (NADs)
cisco-ise network-device list
cisco-ise network-device search --name "switch01"
cisco-ise network-device search --ip "10.0.0.1"
cisco-ise network-device get switch01
cisco-ise network-device add --name "switch01" --ip 10.0.0.1 --radius-secret "shared123"
cisco-ise network-device update switch01 --ip 10.0.0.2
cisco-ise network-device delete switch01

# Identity groups (read-only, for discovery)
cisco-ise identity-group list
cisco-ise identity-group list --type endpoint
cisco-ise identity-group list --type user

# Authorization profiles (read-only, for discovery)
cisco-ise auth-profile list
cisco-ise auth-profile get "Permit_Access"

# TrustSec (read-only, for discovery)
cisco-ise trustsec sgt list
cisco-ise trustsec sgacl list

# Deployment info (read-only)
cisco-ise deployment nodes
cisco-ise deployment status
```

### Config Commands

```bash
cisco-ise config add <name> --host <h> --username <u> --password <p> [--insecure] [--read-only]
cisco-ise config use <name>
cisco-ise config list
cisco-ise config show
cisco-ise config remove <name>
cisco-ise config test
cisco-ise config update <name> [--host <h>] [--username <u>] [--password <p>] [--insecure] [--read-only | --no-read-only]
cisco-ise config clear-cache
cisco-ise config clear-cache --cluster prod
```

`config test` verifies connectivity by calling `GET /ers/config/endpoint?size=1` (ERS) and `GET /api/v1/deployment/node` (OpenAPI). Reports which APIs are accessible.

`config clear-cache` clears cache for the active cluster by default, or a specific cluster with `--cluster`.

## Global Flags

```
--format table|json|toon|csv    (default: table)
--cluster <name>                (use specific cluster)
--host <host>                   (override config)
--username <user>               (override config)
--password <pass>               (override config)
--insecure                      (skip TLS verification)
--read-only                     (block writes, in addition to config-level)
--dry-run                       (show API call and payload, no execution)
--no-audit                      (disable audit logging)
--no-cache                      (bypass response cache)
--debug                         (enable debug logging)
```

Global flags work anywhere on the command line (no `enablePositionalOptions`). Commands use `optsWithGlobals()` to merge global and local options.

`--no-cache` and `--dry-run` are ISE-specific additions not present in sibling CLIs, justified by ISE's slow API responses and the safety-critical nature of ISE write operations.

## Configuration & Auth

### Precedence

CLI flags > env vars > config file

### Environment Variables

```
CISCO_ISE_HOST
CISCO_ISE_USERNAME
CISCO_ISE_PASSWORD
CISCO_ISE_CONFIG_DIR    (override ~/.cisco-ise/)
```

### Config File

`~/.cisco-ise/config.json` (0600 permissions)

```json
{
  "activeCluster": "lab",
  "clusters": {
    "lab": {
      "host": "ise01.automate.builders",
      "username": "cli-admin",
      "password": "...",
      "insecure": true,
      "readOnly": false
    },
    "prod": {
      "host": "<ss:12345:host>",
      "username": "<ss:12345:username>",
      "password": "<ss:12345:password>",
      "readOnly": true
    }
  }
}
```

ss-cli `<ss:ID:field>` placeholders resolved at runtime if ss-cli is installed.

Passwords without ss-cli are stored in plaintext. The CLI does not warn about this — same behavior as sibling CLIs. Users concerned about credential security should use ss-cli placeholders.

## Read-Only Protection

When a cluster has `readOnly: true` in config (or `--read-only` flag is used), all write operations (add, update, delete, disconnect, CoA, suspend) are blocked.

### Human-in-the-Loop Confirmation

To prevent AI agents from bypassing read-only protection (since they have file system access to edit the config), write operations on read-only clusters require interactive confirmation with a random word:

```
⚠ This cluster is configured as read-only.
To proceed, type "rainbow" to confirm: _
```

- Random word generated from a built-in list of simple, unambiguous words
- Different word every time (not cached, not predictable)
- Non-interactive sessions (no TTY) fail immediately with clear error
- Audit log records the confirmation word used
- No override flag exists — to permanently unlock writes, change the config with `cisco-ise config update <name> --no-read-only`

## Dry Run

`--dry-run` on any write operation shows the HTTP method, URL, and request payload without executing:

```
DRY RUN — no changes made
POST https://ise01.automate.builders:9060/ers/config/endpoint
{
  "ERSEndPoint": {
    "mac": "AA:BB:CC:DD:EE:FF",
    "groupId": "abc123-...",
    "description": "Lobby printer"
  }
}
```

## Response Caching

ISE APIs are slow. Responses are cached automatically.

- Cache stored at `~/.cisco-ise/cache/`
- Default TTL: 5 minutes
- Cached per-cluster, keyed by endpoint URL + query params
- Write operations invalidate all caches in the same command group (e.g., `endpoint add` invalidates all `endpoint list/search` caches)
- `--no-cache` flag bypasses cache for a single command
- `cisco-ise config clear-cache` clears cached data for the active cluster (or `--cluster` for a specific one)

## Rate Limiting

Built-in automatic handling, no user-facing commands:

- Exponential backoff on 429 responses (3 retries max)
- Default 10 req/sec global limit
- Progress indicator when waiting: `Rate limited, retrying in 4s...`

## Pagination

`list` commands auto-paginate by default, fetching all results across pages. Flags for control:

- `--limit <n>` — stop after N results (default: unlimited)
- `--page <n>` — fetch a specific page only
- `--page-size <n>` — results per page (default: 100, ISE max)

For large deployments (100k+ endpoints), `--limit` prevents accidentally fetching everything.

## Output Formats

Same formatters as cisco-axl and cisco-dime:

- **table** (default) — cli-table3
- **json** — raw JSON output
- **toon** — @toon-format/toon
- **csv** — csv-stringify

## Error Handling

Errors print to stderr with actionable messages. Exit code 1 on failure, 0 on success.

Pattern: `Error: <what happened>. <what to do about it>.`

Examples:
- `Error: Connection refused on port 9060. Verify ERS is enabled in ISE admin (Administration > Settings > ERS Settings).`
- `Error: 401 Unauthorized. Check credentials with: cisco-ise config test`
- `Error: Endpoint AA:BB:CC:DD:EE:FF not found. Use cisco-ise endpoint list to see available endpoints.`

## Audit Trail

`~/.cisco-ise/audit.jsonl` — logs all operations with timestamp, cluster, command, duration, status. Never logs credentials. Write operations log the action and target. Read-only confirmations log the word used. Rotation at 10MB.

## ISE API Details

### ERS API (port 9060)

Used for CRUD on: endpoints, guest users, network devices, identity groups, authorization profiles, TrustSec SGTs/SGACLs, TACACS command sets, TACACS profiles.

- Basic auth
- JSON request/response (`Accept: application/json`, `Content-Type: application/json`)
- Pagination: `?size=100&page=1`
- Filtering: `?filter=name.CONTAINS.value`

### OpenAPI v1 (port 443)

Used for: deployment info, node status, sessions, licensing, certificates.

- Basic auth
- JSON request/response
- Path: `/api/v1/...`

### MNT API (port 443)

Used for: active sessions, RADIUS/TACACS live logs, failure reasons, CoA operations.

- Basic auth
- XML responses (parsed to JSON for CLI output using `fast-xml-parser`)
- Path: `/admin/API/mnt/...`
- Key endpoints:
  - `/admin/API/mnt/Session/ActiveList` — active sessions
  - `/admin/API/mnt/AuthStatus/MACAddress/<mac>/<seconds>/<numberOfRecords>` — auth history
  - `/admin/API/mnt/FailureReasons` — failure code to human-readable reason mapping
  - `/admin/API/mnt/CoA/Disconnect/<server>/<mac>` — session disconnect
  - `/admin/API/mnt/CoA/Reauth/<server>/<mac>` — session reauth

## File Structure

```
cisco-ise/
├── bin/
│   └── cisco-ise.js              # CLI entry point
├── cli/
│   ├── index.js                  # Commander program setup, global flags
│   ├── commands/
│   │   ├── config.js
│   │   ├── endpoint.js
│   │   ├── guest.js
│   │   ├── session.js
│   │   ├── radius.js
│   │   ├── tacacs.js
│   │   ├── network-device.js
│   │   ├── identity-group.js
│   │   ├── auth-profile.js
│   │   ├── trustsec.js
│   │   └── deployment.js
│   ├── formatters/
│   │   ├── table.js
│   │   ├── json.js
│   │   ├── toon.js
│   │   └── csv.js
│   └── utils/
│       ├── config.js             # Config read/write, ss-cli resolution
│       ├── connection.js         # Precedence logic (flags > env > config)
│       ├── api.js                # HTTP client, caching, rate limiting
│       ├── audit.js              # JSONL audit trail
│       ├── output.js             # Format dispatch, error printing
│       ├── time.js               # Flexible time parser (30m, 2h, 1d)
│       ├── mac.js                # MAC address normalization
│       ├── confirm.js            # Read-only word confirmation
│       └── wordlist.js           # Random word generator
├── skills/
│   └── cisco-ise-cli/
│       └── SKILL.md
└── package.json
```

## Dependencies

| Package | Purpose |
|---|---|
| `commander` | CLI framework |
| `axios` | HTTP client (ERS + OpenAPI) |
| `fast-xml-parser` | MNT API XML response parsing |
| `cli-table3` | Table output |
| `@toon-format/toon` | TOON output |
| `csv-stringify` | CSV output |
| `csv-parse` | CSV import (bulk operations) |
| `update-notifier` | Version check |

## Future Scope (Phase 2)

- **Config-driven bulk provisioning** — `cisco-ise apply --file setup.yaml [--dry-run]` for repeatable deployments. YAML/JSON file defines multiple operations (endpoints, groups, network devices) executed sequentially with rollback on failure.
- Interactive REPL mode with autocomplete
- Webhook/event triggers
- Policy set management (currently assumes policies are already configured)
- ISE pxGrid integration for real-time context sharing
