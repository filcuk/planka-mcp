# PLANKA MCP Server

A Model Context Protocol (MCP) server for [PLANKA](https://planka.app) kanban boards, purpose-built for Claude and other AI agents.

## Features

- Full PLANKA 2.0 API support
- Type-safe with Zod validation
- Optimized for agent workflows (combined operations, sensible defaults)
- 13 tools covering cards, tasks, labels, comments, and lists

## Installation

```bash
npm install @filcuk/planka-mcp
```

Or run directly:

```bash
npx @filcuk/planka-mcp
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PLANKA_BASE_URL` | Yes | Your PLANKA server URL |
| `PLANKA_AGENT_EMAIL` | Yes | Agent user email |
| `PLANKA_AGENT_PASSWORD` | Yes | Agent user password |

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Claude Code

Add to `~/.claude.json`:

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
| `planka_get_board` | Get a board with all cards, lists, and labels |

### Cards

| Tool | Description |
|------|-------------|
| `planka_create_card` | Create a card (optionally with tasks) |
| `planka_update_card` | Update card properties |
| `planka_move_card` | Move card to different list/position |
| `planka_get_card` | Get card details with tasks/comments |
| `planka_delete_card` | Delete a card |

### Tasks

| Tool | Description |
|------|-------------|
| `planka_create_tasks` | Add tasks (checklist items) to a card |
| `planka_update_task` | Update task name or completion |
| `planka_delete_task` | Delete a task |

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

### Lists

| Tool | Description |
|------|-------------|
| `planka_manage_lists` | Create/update/delete lists |

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

## PLANKA 2.0 Compatibility

This server is designed for PLANKA 2.0 and handles the API differences from 1.x:

- Card creation includes required `type` field
- Label endpoints use `/card-labels` path
- Optional fields handled gracefully

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
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol
- [Design Document](./DESIGN.md) - Technical design details
