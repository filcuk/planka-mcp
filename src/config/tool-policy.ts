/**
 * Tool metadata helpers for client-side disable lists (e.g. Cursor mcp.json).
 */
import type { Tool } from "../tools/types.js";

/**
 * Tool names that are off by default — disable these in MCP client config.
 */
export function getDefaultDisabledToolNames(allTools: Tool[]): string[] {
  return allTools
    .filter((tool) => !tool.defaultEnabled)
    .map((tool) => tool.name)
    .sort();
}
