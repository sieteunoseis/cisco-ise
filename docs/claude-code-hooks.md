# Claude Code Hooks for cisco-ise

[Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) let you enforce guardrails when AI agents use the CLI. The examples below block write operations so Claude can only read from ISE.

## Block Write Operations

Add this to your `~/.claude/settings.json` (global) or `.claude/settings.json` (project-level) under `hooks.PreToolUse`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?cisco-ise .*(add|update|delete|create|extend|suspend|reinstate) '; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: cisco-ise write operation. Use --read-only or get explicit user approval.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

### What it blocks

| Command                                         | Blocked | Why                     |
| ----------------------------------------------- | ------- | ----------------------- |
| `cisco-ise endpoint list`                       | No      | Read operation          |
| `cisco-ise endpoint get <id>`                   | No      | Read operation          |
| `cisco-ise guest list`                          | No      | Read operation          |
| `cisco-ise session list`                        | No      | Read operation          |
| `cisco-ise endpoint add --data '{...}'`         | **Yes** | Creates a resource      |
| `cisco-ise endpoint update <id> --data '{...}'` | **Yes** | Modifies a resource     |
| `cisco-ise endpoint delete <id>`                | **Yes** | Deletes a resource      |
| `cisco-ise guest create --data '{...}'`         | **Yes** | Creates a guest account |
| `cisco-ise guest extend <id>`                   | **Yes** | Modifies guest expiry   |
| `cisco-ise guest suspend <id>`                  | **Yes** | Suspends guest access   |
| `cisco-ise guest reinstate <id>`                | **Yes** | Reinstates guest access |
| `cisco-ise guest delete <id>`                   | **Yes** | Deletes a guest account |

### Alternative: Use the built-in `--read-only` flag

The CLI has a native `--read-only` flag that blocks all write operations:

```bash
cisco-ise --read-only endpoint add --data '{...}'
# Error: Write operations are blocked in read-only mode
```

You can enforce this globally by adding a hook that requires `--read-only`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?cisco-ise ' && ! echo \"$cmd\" | grep -q '\\-\\-read-only'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: cisco-ise must be run with --read-only. Retry with the flag.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

## Audit Logging

All cisco-ise operations are logged to `~/.cisco-ise/audit.jsonl` by default. This provides a record of every command run by Claude or any other agent.
