# cisco-ise Roadmap

## Phase 1: Core CLI

- Config management (multi-cluster, ss-cli, read-only protection)
- Endpoint commands (list, search, add, update, delete, bulk CSV)
- Guest commands (create, extend, suspend, reinstate, delete, portals)
- Network device commands (list, search, add, update, delete)
- Session commands (list, search, disconnect, reauth/CoA)
- RADIUS commands (failures with human-readable reasons, live polling)
- TACACS commands (failures, live polling, command sets, profiles)
- Read-only groups: identity-group, auth-profile, trustsec, deployment
- MAC address normalization (any format accepted)
- Identifier resolution (MACs/names → ISE UUIDs internally)
- Response caching (5min TTL, per-cluster)
- Rate limiting (exponential backoff on 429)
- Pagination (auto-paginate with --limit safety)
- Dry-run for all write operations
- Human-in-the-loop random word confirmation for read-only clusters
- Output formats: table, json, toon, csv
- Audit trail (JSONL with rotation)
- skills.sh skill for AI agents
- update-notifier

## Phase 2: Analysis & Bulk Provisioning

- `cisco-ise apply --file setup.yaml [--dry-run]` — config-driven bulk operations
- YAML/JSON files define multiple operations (endpoints, groups, NADs)
- Sequential execution with rollback on failure
- Bulk delete and bulk update via CSV
- Interactive REPL mode with autocomplete

## Phase 3: Advanced Integration

- ISE pxGrid integration for real-time context sharing
- Webhook/event triggers
- Policy set management
- Cross-platform reporting (combine with cisco-axl, cisco-dime data)
