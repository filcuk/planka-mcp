/**
 * List tools for PLANKA MCP server.
 */
import { createList, updateList, deleteList } from "../operations/lists.js";
import { ListColorSchema } from "../schemas/entities.js";
import { PlankaError } from "../errors.js";
import { defineTool } from "./types.js";

const validListColors = ListColorSchema.options.join(", ");

function handleError(error: unknown) {
  if (error instanceof PlankaError) {
    return {
      content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
  throw error;
}

export const modifyListsTool = defineTool("modify", {
  name: "planka_modify_lists",
  description: "Create or update lists on a board.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "update"],
        description: "Action to perform",
      },
      boardId: {
        type: "string",
        description: "Board ID (required for create)",
      },
      listId: {
        type: "string",
        description: "List ID (required for update)",
      },
      name: {
        type: "string",
        description: "List name",
      },
      position: {
        type: "number",
        description: "List position",
      },
      type: {
        type: "string",
        enum: ["active", "closed", "archive", "trash"],
        description:
          "List type (defaults to active for normal kanban columns)",
      },
      color: {
        type: ["string", "null"],
        description: `List color. Valid colors: ${validListColors}`,
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update";
    boardId?: string;
    listId?: string;
    name?: string;
    position?: number;
    type?: "active" | "closed" | "archive" | "trash";
    color?: string | null;
  }) => {
    try {
      if (params.action === "create") {
        if (!params.boardId) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: boardId is required for create action",
              },
            ],
            isError: true,
          };
        }
        if (!params.name) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: name is required for create action",
              },
            ],
            isError: true,
          };
        }

        const list = await createList({
          boardId: params.boardId,
          name: params.name,
          type: params.type,
          position: params.position,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  list: {
                    id: list.id,
                    name: list.name,
                    type: list.type,
                    position: list.position,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.listId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: listId is required for update action",
            },
          ],
          isError: true,
        };
      }

      const updates: Record<string, unknown> = {};
      if (params.name !== undefined) updates.name = params.name;
      if (params.position !== undefined) updates.position = params.position;
      if (params.type !== undefined) updates.type = params.type;
      if (params.color !== undefined) {
        if (params.color === null) {
          updates.color = null;
        } else {
          const colorParse = ListColorSchema.safeParse(params.color);
          if (!colorParse.success) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: Invalid color '${params.color}'. Valid colors: ${validListColors}`,
                },
              ],
              isError: true,
            };
          }
          updates.color = colorParse.data;
        }
      }

      const list = await updateList(params.listId, updates);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                list: {
                  id: list.id,
                  name: list.name,
                  type: list.type,
                  position: list.position,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  },
});

export const deleteListTool = defineTool("delete", {
  name: "planka_delete_list",
  description: "Delete a list from a board. This cannot be undone.",
  inputSchema: {
    type: "object" as const,
    properties: {
      listId: {
        type: "string",
        description: "List ID to delete",
      },
    },
    required: ["listId"],
  },
  handler: async (params: { listId: string }) => {
    try {
      await deleteList(params.listId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `List ${params.listId} deleted`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  },
});

export const listTools = [modifyListsTool, deleteListTool];
