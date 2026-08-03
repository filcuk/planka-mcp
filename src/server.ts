/**
 * Shared MCP server factory for PLANKA kanban boards.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getToolDefinitions, resolveToolCall } from "./tools/index.js";
import { PlankaError, PlankaConfigError } from "./errors.js";
import { CONFIG_HELP_TEXT } from "./config/client-config.js";

export const SERVER_NAME = "planka-mcp";
export const SERVER_VERSION = "1.5.0";

/**
 * Create and configure the PLANKA MCP server with tool handlers.
 */
export function createPlankaServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getToolDefinitions(),
    };
  });

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

  return server;
}
