/**
 * Tool type definitions and metadata helpers.
 */
export type ToolCategory = "read" | "modify" | "delete";

/**
 * Tool type definition.
 */
export interface Tool {
  name: string;
  description: string;
  category: ToolCategory;
  defaultEnabled: boolean;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (params: unknown) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
}

type ToolHandlerResult = Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}>;

type ToolDefinition<P = unknown> = {
  name: string;
  description: string;
  inputSchema: Tool["inputSchema"];
  handler: (params: P) => ToolHandlerResult;
};

/**
 * Attach category metadata used for safe-by-default gating.
 */
export function defineTool<P = unknown>(
  category: ToolCategory,
  tool: ToolDefinition<P>
): Tool {
  return {
    ...tool,
    handler: tool.handler as Tool["handler"],
    category,
    defaultEnabled: category !== "delete",
  };
}
