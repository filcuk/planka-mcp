# PLANKA MCP Server

The most complete Model Context Protocol (MCP) server for [PLANKA](https://planka.app) kanban boards.
Forked from [gogogadgetbytes/planka-mcp](https://github.com/gogogadgetbytes/planka-mcp).

## Features

- **Most complete** v2 API support (v2.0.1)
- **Type-safe** with Zod validation
- **Optimized** for agent workflows: combined operations, sensible defaults
- **Safe-by-default**: risky tools are disabled in the default MCP client config and delete tools are blocked server-side
- **API key authentication** by default, with email/password fallback and automatic terms acceptance on first credential login
- **40 tools** covering cards, tasks, labels, comments, lists, notifications, members, attachments, custom fields, projects, boards, and discovery
- Includes example agent rules

## Setup

Run directly:
```bash
npx @filcuk/planka-mcp
```

Install:
```bash
npm install @filcuk/planka-mcp
```

## Server Configuration

### Authentication

The server prefers **`PLANKA_API_KEY`** (recommended for agents). If no API key is set, it falls back to **`PLANKA_AGENT_EMAIL`** and **`PLANKA_AGENT_PASSWORD`**.

#### Generate an API key

Use a dedicated Planka user for your agent (not your personal account). The agent user must already exist and have accepted terms if your instance requires them.

**Option 1 — Planka admin UI (Planka v2+)**

1. Log in to Planka as an **admin**.
2. Open **Users** in the admin area.
3. Select the agent user.
4. Generate an API key from the user's API key actions.
5. Copy the key immediately — Planka shows the full key **only once**.

**Option 2 — REST API**

1. Log in as an admin and obtain a JWT (or use an existing admin session).
2. Find the agent user's ID (for example via `GET /api/users`).
3. Create a key:

```bash
curl -X POST "https://planka.example.com/api/users/USER_ID/api-key" \
  -H "Authorization: Bearer ADMIN_JWT"
```

4. Copy `included.apiKey` from the JSON response. It cannot be retrieved again later.

To rotate or revoke a key, use the same user management UI or update the user via the Planka API.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PLANKA_BASE_URL` | Yes | Your PLANKA server URL |
| `PLANKA_API_KEY` | Recommended | Agent API key (`X-Api-Key` header). Preferred over credentials. |
| `PLANKA_AGENT_EMAIL` | Fallback | Agent user email (used when `PLANKA_API_KEY` is not set) |
| `PLANKA_AGENT_PASSWORD` | Fallback | Agent user password (used when `PLANKA_API_KEY` is not set) |
| `PLANKA_TERMS_LANGUAGE` | No | Language for automatic terms acceptance on first credential login (default: `en-US`) |
| `PLANKA_ALLOW_DESTRUCTION` | No | Set to `true`, `1`, or `yes` to allow delete-category tools to run server-side (default: blocked) |

### MCP Configuration

```json
{
  "mcpServers": {
    "planka": {
      "command": "npx",
      "args": ["@filcuk/planka-mcp"],
      "env": {
        "PLANKA_BASE_URL": "https://planka.example.com",
        "PLANKA_API_KEY": "your-api-key",
        "PLANKA_AGENT_EMAIL": "",
        "PLANKA_AGENT_PASSWORD": "",
        "PLANKA_ALLOW_DESTRUCTION": "false"
      },
      "disabledTools": [
        "planka_clear_custom_field_value",
        "planka_delete_attachment",
        "planka_delete_board",
        "planka_delete_board_member",
        "planka_delete_card",
        "planka_delete_comment",
        "planka_delete_label",
        "planka_delete_list",
        "planka_delete_project",
        "planka_delete_task",
        "planka_delete_task_list",
        "planka_modify_boards",
        "planka_modify_projects",
        "planka_remove_card_labels",
        "planka_remove_card_members"
      ]
    }
  }
}
```

- **`disabledTools`** in your MCP client config keeps delete tools out of the agent's tool list by default, but they remain visible in the editor so you can enable them when needed.
- **`PLANKA_ALLOW_DESTRUCTION`** controls server-side fallback that rejects delete-category tool calls even if the client enables them, unless explicitely allowed.
- `PLANKA_API_KEY` is used by default with fallback on `PLANKA_AGENT_EMAIL` / `PLANKA_AGENT_PASSWORD`. The server will log in automatically and accept terms on first use when required.

## Available Tools

**Default** column: **On** = enabled in the default MCP client config; **Off** = disabled in `disabledTools` by default; **Blocked** = delete-category tool blocked server-side unless `PLANKA_ALLOW_DESTRUCTION=true` (also off in `disabledTools` by default).

### Navigation

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_structure` | Get projects, boards, and lists hierarchy | On |
| `planka_get_board` | Get a board with cards, labels, members, and custom fields | On |

### Projects & boards

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_projects` | Create or update projects | Off |
| `planka_delete_project` | Delete an empty project | Blocked |
| `planka_modify_boards` | Create or update boards | Off |
| `planka_delete_board` | Delete a board and all its contents | Blocked |

### Cards

| Tool | Description | Default |
|------|-------------|---------|
| `planka_create_card` | Create a card (optionally with tasks) | On |
| `planka_update_card` | Update card properties, subscription, stopwatch | On |
| `planka_move_card` | Move card to different list/position | On |
| `planka_get_card` | Get card details with tasks, comments, members, attachments | On |
| `planka_search_cards` | Search/filter cards in a list (with cursor pagination) | On |
| `planka_delete_card` | Delete a card | Blocked |

### Tasks

| Tool | Description | Default |
|------|-------------|---------|
| `planka_create_tasks` | Add tasks (checklist items) to a card | On |
| `planka_update_task` | Update task name, completion, position, assignee, linked card | On |
| `planka_modify_task_lists` | Create or update named checklists on a card | On |
| `planka_delete_task` | Delete a task | Blocked |
| `planka_delete_task_list` | Delete a checklist and all its tasks | Blocked |

### Labels

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_labels` | Create or update board labels | On |
| `planka_add_card_labels` | Add labels to a card | On |
| `planka_delete_label` | Delete a board label | Blocked |
| `planka_remove_card_labels` | Remove labels from a card | Blocked |

### Comments

| Tool | Description | Default |
|------|-------------|---------|
| `planka_add_comment` | Add a comment to a card | On |
| `planka_get_comments` | Get all comments on a card | On |
| `planka_modify_comment` | Update a comment | On |
| `planka_delete_comment` | Delete a comment | Blocked |

### Notifications

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_notifications` | Get unread notifications for the agent user | On |
| `planka_mark_notifications_read` | Mark one or all notifications as read | On |

### Lists

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_lists` | Create or update lists | On |
| `planka_delete_list` | Delete a list | Blocked |

### Members

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_board_members` | List board users with roles and membership IDs | On |
| `planka_add_card_members` | Add users to a card | On |
| `planka_modify_board_members` | Add or update board memberships | On |
| `planka_remove_card_members` | Remove users from a card | Blocked |
| `planka_delete_board_member` | Remove a user from a board | Blocked |

### Attachments

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_attachment` | Get attachment metadata; download file content as base64 (max 5 MB) | On |
| `planka_modify_attachments` | Create or update link/file attachments (including link URL updates) | On |
| `planka_delete_attachment` | Delete an attachment | Blocked |

### Custom Fields

| Tool | Description | Default |
|------|-------------|---------|
| `planka_set_custom_field_value` | Set a custom field value by name | On |
| `planka_clear_custom_field_value` | Clear a custom field value | Blocked |

### Discovery

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_actions` | Get activity history for a board or card | On |

## Examples

### Cursor rules

Agents work best with explicit guardrails: which board to use, what they must not delete, and how cards should be placed. Copy the example rule into your project and customize the placeholders.

1. Copy [`examples/cursor-rule-planka-scope.mdc`](./examples/cursor-rule-planka-scope.mdc) to `.cursor/rules/` in the workspace where you use Planka.
2. Replace `YOUR_BOARD_ID`, `YOUR_BOARD_NAME`, and `YOUR_MCP_SERVER` with your values (find the board ID via `planka_get_structure` or `planka_get_board`).
3. Adjust the **Forbidden actions** and **Card placement** sections to match your workflow.

## Development

```bash
# Clone
git clone https://github.com/filcuk/planka-mcp.git
cd planka-mcp

# Run
npm install
npm run build
npm test
npm start
```

## Links

- [PLANKA](https://planka.app) - The kanban board
- [PLANKA Swagger](https://plankanban.github.io/planka/swagger-ui/swagger.json) - API reference
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol
- [Design Document](./DESIGN.md) - Technical design details
