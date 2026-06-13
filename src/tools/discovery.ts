/**
 * Action and search tools for PLANKA MCP server.
 */
import { getActions } from "../operations/actions.js";
import { searchCards } from "../operations/cards.js";
import { formatCardDetails } from "../lib/format-card.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_get_actions
 * Get activity history for a board or card.
 */
export const getActionsTool = {
  name: "planka_get_actions",
  description:
    "Get activity history (moves, member changes, task completions) for a board or card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      boardId: {
        type: "string",
        description: "Board ID (provide boardId or cardId)",
      },
      cardId: {
        type: "string",
        description: "Card ID (provide boardId or cardId)",
      },
      beforeId: {
        type: "string",
        description: "Pagination cursor — return actions before this ID",
      },
    },
  },
  handler: async (params: {
    boardId?: string;
    cardId?: string;
    beforeId?: string;
  }) => {
    try {
      if (!params.boardId && !params.cardId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Provide boardId or cardId",
            },
          ],
          isError: true,
        };
      }

      const actions = await getActions({
        boardId: params.boardId,
        cardId: params.cardId,
        beforeId: params.beforeId,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                actionCount: actions.length,
                actions: actions.map((action) => ({
                  id: action.id,
                  type: action.type,
                  cardId: action.cardId,
                  createdAt: action.createdAt,
                  user: action.user,
                  data: action.data,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof PlankaError) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
      throw error;
    }
  },
};

/**
 * Tool: planka_search_cards
 * Search and filter cards in a list.
 */
export const searchCardsTool = {
  name: "planka_search_cards",
  description:
    "Search cards in a list by text, labels, or assigned users. Useful for large boards.",
  inputSchema: {
    type: "object" as const,
    properties: {
      listId: {
        type: "string",
        description: "The list ID to search within",
      },
      search: {
        type: "string",
        description: "Text search term",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Filter by label IDs",
      },
      userIds: {
        type: "array",
        items: { type: "string" },
        description: "Filter by member or task assignee user IDs",
      },
    },
    required: ["listId"],
  },
  handler: async (params: {
    listId: string;
    search?: string;
    labelIds?: string[];
    userIds?: string[];
  }) => {
    try {
      const results = await searchCards({
        listId: params.listId,
        search: params.search,
        labelIds: params.labelIds,
        userIds: params.userIds,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                listId: params.listId,
                matchCount: results.length,
                cards: results.map((details) => ({
                  id: details.card.id,
                  name: details.card.name,
                  listId: details.card.listId,
                  labels: formatCardDetails(details).labels,
                  members: formatCardDetails(details).members,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof PlankaError) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
      throw error;
    }
  },
};

export const discoveryTools = [getActionsTool, searchCardsTool];
