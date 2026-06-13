/**
 * Tool enablement policy for safe-by-default destructive operations.
 */
import type { Tool } from "../tools/types.js";

const TRUTHY = new Set(["true", "1", "yes"]);

/**
 * Whether delete-category tools are enabled via PLANKA_ENABLE_DESTRUCTIVE.
 */
export function isDestructiveEnabled(): boolean {
  const value = process.env.PLANKA_ENABLE_DESTRUCTIVE?.trim().toLowerCase();
  return value !== undefined && TRUTHY.has(value);
}

export const DESTRUCTIVE_DISABLED_MESSAGE =
  "Tool disabled. Set PLANKA_ENABLE_DESTRUCTIVE=true to enable delete tools.";

/**
 * Returns tools that should be advertised and callable.
 */
export function getEnabledTools(allTools: Tool[]): Tool[] {
  if (isDestructiveEnabled()) {
    return allTools;
  }
  return allTools.filter((tool) => tool.defaultEnabled);
}

/**
 * Whether a tool is currently enabled.
 */
export function isToolEnabled(tool: Tool): boolean {
  return tool.defaultEnabled || isDestructiveEnabled();
}
