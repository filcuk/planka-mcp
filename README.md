# PLANKA MCP Server

The most complete Model Context Protocol (MCP) server for [PLANKA](https://planka.app) kanban boards.
Forked from [gogogadgetbytes/planka-mcp](https://github.com/gogogadgetbytes/planka-mcp).

## Features

- **Most complete** v2 API support (v2.0.1)
- **Type-safe** with Zod validation
- **Optimized** for agent workflows: combined operations, sensible defaults
- **Safe-by-default**: all tools are advertised; risky tools are disabled in the default MCP client config via `disabledTools`
- **Automatic terms acceptance** on first login when the Planka instance requires it
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

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PLANKA_BASE_URL` | Yes | Your PLANKA server URL |
| `PLANKA_AGENT_EMAIL` | Yes | Agent user email |
| `PLANKA_AGENT_PASSWORD` | Yes | Agent user password |
| `PLANKA_TERMS_LANGUAGE` | No | Language for terms acceptance on first login (default: `en-US`) |

### MCP Configuration

All tools are registered with the MCP client. Disable risky tools in your MCP client config rather than hiding them server-side — this keeps them visible in the editor so you can enable them when needed.

```json
{
  "mcpServers": {
    "planka": {
      "command": "npx",
      "args": ["@filcuk/planka-mcp"],
      "env": {
        "PLANKA_BASE_URL": "https://planka.example.com",
        "PLANKA_AGENT_EMAIL": "agent@example.com",
        "PLANKA_AGENT_PASSWORD": "your-password"
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

Remove tools from `disabledTools` to enable them for your agent.

## Available Tools

The **Default** column reflects recommended client-side settings. Delete and project/board management tools are off by default.

### Navigation

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_structure` | Get projects, boards, and lists hierarchy | On |
| `planka_get_board` | Get a board with cards, labels, members, and custom fields | On |

### Projects & boards

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_projects` | Create or update projects | Off |
| `planka_delete_project` | Delete an empty project | Off |
| `planka_modify_boards` | Create or update boards | Off |
| `planka_delete_board` | Delete a board and all its contents | Off |

### Cards

| Tool | Description | Default |
|------|-------------|---------|
| `planka_create_card` | Create a card (optionally with tasks) | On |
| `planka_update_card` | Update card properties, subscription, stopwatch | On |
| `planka_move_card` | Move card to different list/position | On |
| `planka_get_card` | Get card details with tasks, comments, members, attachments | On |
| `planka_search_cards` | Search/filter cards in a list (with cursor pagination) | On |
| `planka_delete_card` | Delete a card | Off |

### Tasks

| Tool | Description | Default |
|------|-------------|---------|
| `planka_create_tasks` | Add tasks (checklist items) to a card | On |
| `planka_update_task` | Update task name, completion, position, assignee, linked card | On |
| `planka_modify_task_lists` | Create or update named checklists on a card | On |
| `planka_delete_task` | Delete a task | Off |
| `planka_delete_task_list` | Delete a checklist and all its tasks | Off |

### Labels

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_labels` | Create or update board labels | On |
| `planka_add_card_labels` | Add labels to a card | On |
| `planka_delete_label` | Delete a board label | Off |
| `planka_remove_card_labels` | Remove labels from a card | Off |

### Comments

| Tool | Description | Default |
|------|-------------|---------|
| `planka_add_comment` | Add a comment to a card | On |
| `planka_get_comments` | Get all comments on a card | On |
| `planka_modify_comment` | Update a comment | On |
| `planka_delete_comment` | Delete a comment | Off |

### Notifications

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_notifications` | Get unread notifications for the agent user | On |
| `planka_mark_notifications_read` | Mark one or all notifications as read | On |

### Lists

| Tool | Description | Default |
|------|-------------|---------|
| `planka_modify_lists` | Create or update lists | On |
| `planka_delete_list` | Delete a list | Off |

### Members

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_board_members` | List board users with roles and membership IDs | On |
| `planka_add_card_members` | Add users to a card | On |
| `planka_modify_board_members` | Add or update board memberships | On |
| `planka_remove_card_members` | Remove users from a card | Off |
| `planka_delete_board_member` | Remove a user from a board | Off |

### Attachments

| Tool | Description | Default |
|------|-------------|---------|
| `planka_get_attachment` | Get attachment metadata; download file content as base64 (max 5 MB) | On |
| `planka_modify_attachments` | Create or update link/file attachments (including link URL updates) | On |
| `planka_delete_attachment` | Delete an attachment | Off |

### Custom Fields

| Tool | Description | Default |
|------|-------------|---------|
| `planka_set_custom_field_value` | Set a custom field value by name | On |
| `planka_clear_custom_field_value` | Clear a custom field value | Off |

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
