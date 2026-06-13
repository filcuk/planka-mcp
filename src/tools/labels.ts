/**
 * Label tools for PLANKA MCP server.
 */
import {
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
} from "../operations/labels.js";
import { LabelColorSchema } from "../schemas/entities.js";
import { PlankaError } from "../errors.js";
import { defineTool } from "./types.js";

const validColors = LabelColorSchema.options.join(", ");

function handleError(error: unknown) {
  if (error instanceof PlankaError) {
    return {
      content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
  throw error;
}

export const modifyLabelsTool = defineTool("modify", {
  name: "planka_modify_labels",
  description: "Create or update labels on a board.",
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
      labelId: {
        type: "string",
        description: "Label ID (required for update)",
      },
      name: {
        type: "string",
        description: "Label name",
      },
      color: {
        type: "string",
        description: `Label color. Valid colors: ${validColors}`,
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update";
    boardId?: string;
    labelId?: string;
    name?: string;
    color?: string;
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
        if (!params.color) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: color is required for create action",
              },
            ],
            isError: true,
          };
        }

        const colorParse = LabelColorSchema.safeParse(params.color);
        if (!colorParse.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Invalid color '${params.color}'. Valid colors: ${validColors}`,
              },
            ],
            isError: true,
          };
        }

        const label = await createLabel({
          boardId: params.boardId,
          name: params.name,
          color: colorParse.data,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  label: {
                    id: label.id,
                    name: label.name,
                    color: label.color,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.labelId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: labelId is required for update action",
            },
          ],
          isError: true,
        };
      }

      const updates: Record<string, unknown> = {};
      if (params.name !== undefined) updates.name = params.name;
      if (params.color !== undefined) {
        const colorParse = LabelColorSchema.safeParse(params.color);
        if (!colorParse.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Invalid color '${params.color}'. Valid colors: ${validColors}`,
              },
            ],
            isError: true,
          };
        }
        updates.color = colorParse.data;
      }

      const label = await updateLabel(params.labelId, updates);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                label: {
                  id: label.id,
                  name: label.name,
                  color: label.color,
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

export const deleteLabelTool = defineTool("delete", {
  name: "planka_delete_label",
  description: "Delete a label from a board.",
  inputSchema: {
    type: "object" as const,
    properties: {
      labelId: {
        type: "string",
        description: "Label ID to delete",
      },
    },
    required: ["labelId"],
  },
  handler: async (params: { labelId: string }) => {
    try {
      await deleteLabel(params.labelId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Label ${params.labelId} deleted`,
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

export const addCardLabelsTool = defineTool("modify", {
  name: "planka_add_card_labels",
  description: "Add labels to a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Label IDs to add",
      },
    },
    required: ["cardId", "labelIds"],
  },
  handler: async (params: { cardId: string; labelIds: string[] }) => {
    try {
      let added = 0;
      for (const labelId of params.labelIds) {
        try {
          await addLabelToCard({ cardId: params.cardId, labelId });
          added++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!message.includes("already")) {
            throw error;
          }
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                cardId: params.cardId,
                labelsAdded: added,
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

export const removeCardLabelsTool = defineTool("delete", {
  name: "planka_remove_card_labels",
  description: "Remove labels from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Label IDs to remove",
      },
    },
    required: ["cardId", "labelIds"],
  },
  handler: async (params: { cardId: string; labelIds: string[] }) => {
    try {
      for (const labelId of params.labelIds) {
        try {
          await removeLabelFromCard(params.cardId, labelId);
        } catch {
          // Ignore if label not on card
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                cardId: params.cardId,
                labelsRemoved: params.labelIds.length,
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

export const labelTools = [
  modifyLabelsTool,
  deleteLabelTool,
  addCardLabelsTool,
  removeCardLabelsTool,
];
