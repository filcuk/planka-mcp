# PLANKA MCP Server

The most complete Model Context Protocol (MCP) server for [PLANKA](https://planka.app) kanban boards.
Forked from [gogogadgetbytes/planka-mcp](https://github.com/gogogadgetbytes/planka-mcp).

## Features

- Most complete v2 API support
- Type-safe with Zod validation
- Optimized for agent workflows (combined operations, sensible defaults)
- 25 tools covering cards, tasks, labels, comments, lists, notifications, members, attachments, custom fields, and discovery

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

### MCP Configuration

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
      }
    }
  }
}
```

## Available Tools

### Navigation

| Tool | Description |
|------|-------------|
| `planka_get_structure` | Get projects, boards, and lists hierarchy |
| `planka_get_board` | Get a board with cards, labels, members, and custom fields |

### Cards

| Tool | Description |
|------|-------------|
| `planka_create_card` | Create a card (optionally with tasks) |
| `planka_update_card` | Update card properties |
| `planka_move_card` | Move card to different list/position |
| `planka_get_card` | Get card details with tasks, comments, members, attachments |
| `planka_delete_card` | Delete a card |
| `planka_search_cards` | Search/filter cards in a list |

### Tasks

| Tool | Description |
|------|-------------|
| `planka_create_tasks` | Add tasks (checklist items) to a card |
| `planka_update_task` | Update task name, completion, position, or assignee |
| `planka_delete_task` | Delete a task |
| `planka_manage_task_lists` | Create or delete named checklists on a card |

### Labels

| Tool | Description |
|------|-------------|
| `planka_manage_labels` | Create/update/delete board labels |
| `planka_set_card_labels` | Add/remove labels from a card |

### Comments

| Tool | Description |
|------|-------------|
| `planka_add_comment` | Add a comment to a card |
| `planka_get_comments` | Get all comments on a card |
| `planka_manage_comments` | Update or delete a comment |

### Notifications

| Tool | Description |
|------|-------------|
| `planka_get_notifications` | Get unread notifications for the agent user |
| `planka_mark_notifications_read` | Mark one or all notifications as read |

### Lists

| Tool | Description |
|------|-------------|
| `planka_manage_lists` | Create/update/delete lists |

### Members

| Tool | Description |
|------|-------------|
| `planka_get_board_members` | List board users (for assigning to cards) |
| `planka_set_card_members` | Add/remove users on a card |

### Attachments

| Tool | Description |
|------|-------------|
| `planka_manage_attachments` | Create/update/delete link attachments |

### Custom Fields

| Tool | Description |
|------|-------------|
| `planka_set_custom_field_values` | Set or clear custom field values by name |

### Discovery

| Tool | Description |
|------|-------------|
| `planka_get_actions` | Get activity history for a board or card |

## Usage Examples

### Get board structure

```
Use planka_get_structure to see all projects and boards
```

### Create a card with tasks

```
Use planka_create_card with:
- listId: "abc123"
- name: "Implement feature X"
- tasks: ["Research", "Design", "Implement", "Test"]
```

### Move card through workflow

```
Use planka_move_card to move card from "To Do" to "In Progress"
```

### Check for @mentions

```
Use planka_get_notifications with types: ["mentionInComment"] to see unread mentions
```

## Cursor rules (agent scope)

Agents work best with explicit guardrails: which board to use, what they must not delete, and how cards should be placed. Copy the example rule into your project and customize the placeholders.

1. Copy [`examples/cursor-rule-planka-scope.mdc`](./examples/cursor-rule-planka-scope.mdc) to `.cursor/rules/` in the workspace where you use Planka.
2. Replace `YOUR_BOARD_ID`, `YOUR_BOARD_NAME`, and `YOUR_MCP_SERVER` with your values (find the board ID via `planka_get_structure` or `planka_get_board`).
3. Adjust the **Forbidden actions** and **Card placement** sections to match your workflow.


## Development

```bash
# Clone
git clone https://github.com/filcuk/planka-mcp.git
cd planka-mcp

# Install
npm install

# Build
npm run build

# Test
npm test
```

## License

MIT

## Links

- [PLANKA](https://planka.app) - The kanban board
- [PLANKA Swagger](https://plankanban.github.io/planka/swagger-ui/swagger.json) - API reference
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol
- [Design Document](./DESIGN.md) - Technical design details
- [Cursor rule example](./examples/cursor-rule-planka-scope.mdc) - Agent scope and guardrails template
