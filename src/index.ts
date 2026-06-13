#!/usr/bin/env node
/**
 * PLANKA MCP Server
 *
 * A Model Context Protocol server for PLANKA kanban boards.
 * Provides tools for managing projects, boards, cards, tasks, labels, comments, and notifications.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getToolDefinitions, resolveToolCall } from "./tools/index.js";
import { PlankaError, PlankaConfigError } from "./errors.js";
import { CONFIG_HELP_TEXT } from "./config/client-config.js";

/**
 * Main entry point.
 */
async function main() {
  // Create the MCP server
  const server = new Server(
    {
      name: "planka-mcp",
      version: "1.3.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getToolDefinitions(),
    };
  });

  // Handler for tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const resolved = resolveToolCall(name);
    if ("error" in resolved) {
      return {
        content: [{ type: "text", text: resolved.error }],
        isError: true,
      };
    }

    const { tool } = resolved;
    try {
      const result = await tool.handler(args || {});
      return result;
    } catch (error) {
      // Handle configuration errors specifically
      if (error instanceof PlankaConfigError) {
        return {
          content: [
            {
              type: "text",
              text: `Configuration error: ${error.message}\n\n${CONFIG_HELP_TEXT}`,
            },
          ],
          isError: true,
        };
      }

      // Handle other PLANKA errors
      if (error instanceof PlankaError) {
        return {
          content: [
            {
              type: "text",
              text: `PLANKA error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }

      // Log unexpected errors and return generic message
      console.error(`Error in tool ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup (to stderr so it doesn't interfere with MCP protocol)
  console.error("PLANKA MCP server started");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
