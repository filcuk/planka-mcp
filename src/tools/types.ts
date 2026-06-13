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
  /** When false, disable this tool in MCP client config (e.g. disabledTools). */
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

type DefineToolOptions = {
  defaultEnabled?: boolean;
};

/**
 * Attach category metadata. Delete tools default to defaultEnabled=false.
 */
export function defineTool<P = unknown>(
  category: ToolCategory,
  tool: ToolDefinition<P>,
  options?: DefineToolOptions
): Tool {
  return {
    ...tool,
    handler: tool.handler as Tool["handler"],
    category,
    defaultEnabled: options?.defaultEnabled ?? category !== "delete",
  };
}
