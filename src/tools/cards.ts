/**
 * Card tools for PLANKA MCP server.
 */
import {
  createCard,
  getCard,
  updateCard,
  moveCard,
  deleteCard,
} from "../operations/cards.js";
import { createTasks } from "../operations/tasks.js";
import { addLabelToCard } from "../operations/labels.js";
import { formatCardDetails } from "../lib/format-card.js";
import { PlankaError } from "../errors.js";
import { defineTool } from "./types.js";

function handleError(error: unknown) {
  if (error instanceof PlankaError) {
    return {
      content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
  throw error;
}

export const createCardTool = defineTool("modify", {
  name: "planka_create_card",
  description:
    "Create a new card on a board. Optionally add tasks (checklist items) at the same time.",
  inputSchema: {
    type: "object" as const,
    properties: {
      listId: {
        type: "string",
        description: "The list to create the card in",
      },
      name: {
        type: "string",
        description: "Card title",
      },
      type: {
        type: "string",
        enum: ["project", "story"],
        description: 'Card type (default: "project")',
      },
      description: {
        type: "string",
        description: "Card description (markdown supported)",
      },
      position: {
        type: "number",
        description: "Position in the list (lower = higher; default: end of list)",
      },
      tasks: {
        type: "array",
        items: { type: "string" },
        description: "Optional: Task names to add as a checklist",
      },
      dueDate: {
        type: "string",
        description: "Due date in ISO format",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Optional: Label IDs to attach",
      },
    },
    required: ["listId", "name"],
  },
  handler: async (params: {
    listId: string;
    name: string;
    type?: "project" | "story";
    description?: string;
    position?: number;
    tasks?: string[];
    dueDate?: string;
    labelIds?: string[];
  }) => {
    try {
      const card = await createCard({
        listId: params.listId,
        name: params.name,
        type: params.type,
        description: params.description,
        position: params.position,
        dueDate: params.dueDate,
      });

      if (params.tasks && params.tasks.length > 0) {
        await createTasks({
          cardId: card.id,
          tasks: params.tasks.map((name) => ({ name })),
        });
      }

      let labelsAttached = 0;
      const labelErrors: string[] = [];
      if (params.labelIds && params.labelIds.length > 0) {
        for (const labelId of params.labelIds) {
          try {
            await addLabelToCard({ cardId: card.id, labelId });
            labelsAttached++;
          } catch {
            labelErrors.push(labelId);
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
                card: {
                  id: card.id,
                  name: card.name,
                  listId: card.listId,
                  type: card.type,
                  position: card.position,
                },
                tasksCreated: params.tasks?.length || 0,
                labelsAttached,
                ...(labelErrors.length > 0 && { labelErrors }),
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

export const getCardTool = defineTool("read", {
  name: "planka_get_card",
  description:
    "Get full details of a card including tasks, comments, labels, attachments, members, and custom fields.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
    },
    required: ["cardId"],
  },
  handler: async (params: { cardId: string }) => {
    try {
      const details = await getCard(params.cardId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(formatCardDetails(details), null, 2),
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  },
});

export const updateCardTool = defineTool("modify", {
  name: "planka_update_card",
  description:
    "Update a card's properties (name, description, due date, closed state, subscription, stopwatch, cover attachment).",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      name: {
        type: "string",
        description: "New card title",
      },
      description: {
        type: ["string", "null"],
        description: "New description (null to clear)",
      },
      dueDate: {
        type: ["string", "null"],
        description: "New due date (null to clear)",
      },
      isDueCompleted: {
        type: ["boolean", "null"],
        description: "Mark due date as complete/incomplete",
      },
      isClosed: {
        type: "boolean",
        description: "Mark card as closed/open",
      },
      isSubscribed: {
        type: "boolean",
        description: "Subscribe or unsubscribe the current user to card updates",
      },
      stopwatch: {
        type: ["object", "null"],
        description:
          "Time tracking state: { startedAt: ISO string, total: seconds }. Pass null to clear.",
        properties: {
          startedAt: { type: "string" },
          total: { type: "number" },
        },
      },
      type: {
        type: "string",
        enum: ["project", "story"],
        description: "Card type",
      },
      coverAttachmentId: {
        type: ["string", "null"],
        description: "Attachment ID to use as card cover (null to clear)",
      },
    },
    required: ["cardId"],
  },
  handler: async (params: {
    cardId: string;
    name?: string;
    description?: string | null;
    dueDate?: string | null;
    isDueCompleted?: boolean | null;
    isClosed?: boolean;
    isSubscribed?: boolean;
    stopwatch?: { startedAt: string; total: number } | null;
    type?: "project" | "story";
    coverAttachmentId?: string | null;
  }) => {
    try {
      const { cardId, ...updates } = params;

      const filteredUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) filteredUpdates.name = updates.name;
      if (updates.description !== undefined)
        filteredUpdates.description = updates.description;
      if (updates.dueDate !== undefined)
        filteredUpdates.dueDate = updates.dueDate;
      if (updates.isDueCompleted !== undefined)
        filteredUpdates.isDueCompleted = updates.isDueCompleted;
      if (updates.isClosed !== undefined)
        filteredUpdates.isClosed = updates.isClosed;
      if (updates.isSubscribed !== undefined)
        filteredUpdates.isSubscribed = updates.isSubscribed;
      if (updates.stopwatch !== undefined)
        filteredUpdates.stopwatch = updates.stopwatch;
      if (updates.type !== undefined) filteredUpdates.type = updates.type;
      if (updates.coverAttachmentId !== undefined)
        filteredUpdates.coverAttachmentId = updates.coverAttachmentId;

      const card = await updateCard(cardId, filteredUpdates);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                card: {
                  id: card.id,
                  name: card.name,
                  description: card.description,
                  dueDate: card.dueDate,
                  isDueCompleted: card.isDueCompleted,
                  isClosed: card.isClosed,
                  isSubscribed: card.isSubscribed,
                  stopwatch: card.stopwatch,
                  coverAttachmentId: card.coverAttachmentId,
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

export const moveCardTool = defineTool("modify", {
  name: "planka_move_card",
  description:
    "Move a card to a different list or position. Use this for workflow transitions (e.g., 'To Do' -> 'In Progress').",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      listId: {
        type: "string",
        description: "Target list ID",
      },
      boardId: {
        type: "string",
        description: "Target board ID (for cross-board moves)",
      },
      position: {
        type: "number",
        description:
          "Position in the list (lower = higher). Default: end of list",
      },
    },
    required: ["cardId", "listId"],
  },
  handler: async (params: {
    cardId: string;
    listId: string;
    boardId?: string;
    position?: number;
  }) => {
    try {
      const card = await moveCard({
        cardId: params.cardId,
        listId: params.listId,
        boardId: params.boardId,
        position: params.position ?? 65536,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                card: {
                  id: card.id,
                  name: card.name,
                  listId: card.listId,
                  boardId: card.boardId,
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

export const deleteCardTool = defineTool("delete", {
  name: "planka_delete_card",
  description: "Permanently delete a card. This cannot be undone.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID to delete",
      },
    },
    required: ["cardId"],
  },
  handler: async (params: { cardId: string }) => {
    try {
      await deleteCard(params.cardId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Card ${params.cardId} deleted`,
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

export const cardTools = [
  createCardTool,
  getCardTool,
  updateCardTool,
  moveCardTool,
  deleteCardTool,
];
