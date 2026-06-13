/**
 * Tool policy helpers for client-side disable lists and server-side delete gating.
 */
import type { Tool } from "../tools/types.js";

const TRUTHY_VALUES = new Set(["true", "1", "yes"]);

/**
 * Whether delete-category tools may execute on the server.
 * Set PLANKA_ALLOW_DESTRUCTION=true (or 1/yes) to allow destructive actions.
 */
export function isDestructionAllowed(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const value = env.PLANKA_ALLOW_DESTRUCTION?.trim().toLowerCase();
  return value !== undefined && TRUTHY_VALUES.has(value);
}

/**
 * Tool names that are off by default — disable these in MCP client config.
 */
export function getDefaultDisabledToolNames(allTools: Tool[]): string[] {
  return allTools
    .filter((tool) => !tool.defaultEnabled)
    .map((tool) => tool.name)
    .sort();
}

/**
 * Whether a delete-category tool call should be rejected server-side.
 */
export function isDeleteToolBlocked(
  tool: Tool,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return tool.category === "delete" && !isDestructionAllowed(env);
}

export function getDeleteToolBlockMessage(toolName: string): string {
  return (
    `Delete tool "${toolName}" is blocked server-side. ` +
    "Set PLANKA_ALLOW_DESTRUCTION=true to enable destructive actions."
  );
}
