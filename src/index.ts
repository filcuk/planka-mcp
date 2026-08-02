#!/usr/bin/env node
/**
 * PLANKA MCP Server (stdio transport)
 *
 * A Model Context Protocol server for PLANKA kanban boards.
 * Provides tools for managing projects, boards, cards, tasks, labels, comments, and notifications.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPlankaServer } from "./server.js";

async function main() {
  const server = createPlankaServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("PLANKA MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
