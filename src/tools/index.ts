/**
 * Tool registry for PLANKA MCP server.
 */
import { navigationTools } from "./navigation.js";
import { cardTools } from "./cards.js";
import { taskTools } from "./tasks.js";
import { labelTools } from "./labels.js";
import { commentTools } from "./comments.js";
import { notificationTools } from "./notifications.js";
import { listTools } from "./lists.js";
import { membershipTools } from "./memberships.js";
import { attachmentTools } from "./attachments.js";
import { customFieldTools } from "./custom-fields.js";
import { discoveryTools } from "./discovery.js";
import { boardMembershipTools } from "./board-memberships.js";
import { projectBoardTools } from "./projects-boards.js";
import type { Tool, ToolCategory } from "./types.js";
import {
  getDeleteToolBlockMessage,
  isDeleteToolBlocked,
} from "../config/tool-policy.js";

export type { Tool, ToolCategory };

/**
 * All registered tools.
 */
export const allTools: Tool[] = [
  ...navigationTools,
  ...projectBoardTools,
  ...cardTools,
  ...taskTools,
  ...labelTools,
  ...commentTools,
  ...notificationTools,
  ...listTools,
  ...membershipTools,
  ...boardMembershipTools,
  ...attachmentTools,
  ...customFieldTools,
  ...discoveryTools,
];

/**
 * Get a tool by name.
 */
export function getTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name);
}

/**
 * Get all tool definitions (for MCP listTools).
 * All tools are advertised; disable risky ones in MCP client config (see README).
 */
export function getToolDefinitions() {
  return allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Resolve a tool call by name.
 */
export function resolveToolCall(name: string):
  | { tool: Tool }
  | { error: string } {
  const tool = getTool(name);
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }

  if (isDeleteToolBlocked(tool)) {
    return { error: getDeleteToolBlockMessage(tool.name) };
  }

  return { tool };
}

// Re-export individual tool groups
export { navigationTools } from "./navigation.js";
export { projectBoardTools } from "./projects-boards.js";
export { cardTools } from "./cards.js";
export { taskTools } from "./tasks.js";
export { labelTools } from "./labels.js";
export { commentTools } from "./comments.js";
export { notificationTools } from "./notifications.js";
export { listTools } from "./lists.js";
export { membershipTools } from "./memberships.js";
export { boardMembershipTools } from "./board-memberships.js";
export { attachmentTools } from "./attachments.js";
export { customFieldTools } from "./custom-fields.js";
export { discoveryTools } from "./discovery.js";
