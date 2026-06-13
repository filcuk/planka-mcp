/**
 * Membership tools for PLANKA MCP server.
 */
import { getBoardMembers } from "../operations/boards.js";
import { setCardMembers } from "../operations/memberships.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_get_board_members
 * List users with access to a board.
 */
export const getBoardMembersTool = {
  name: "planka_get_board_members",
  description:
    "List board members (users with access). Use this to find user IDs for assigning people to cards.",
  inputSchema: {
    type: "object" as const,
    properties: {
      boardId: {
        type: "string",
        description: "The board ID",
      },
    },
    required: ["boardId"],
  },
  handler: async (params: { boardId: string }) => {
    try {
      const members = await getBoardMembers(params.boardId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                boardId: params.boardId,
                memberCount: members.length,
                members,
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
 * Tool: planka_set_card_members
 * Add or remove members on a card.
 */
export const setCardMembersTool = {
  name: "planka_set_card_members",
  description: "Add or remove users assigned to a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      addUserIds: {
        type: "array",
        items: { type: "string" },
        description: "User IDs to add as card members",
      },
      removeUserIds: {
        type: "array",
        items: { type: "string" },
        description: "User IDs to remove from the card",
      },
    },
    required: ["cardId"],
  },
  handler: async (params: {
    cardId: string;
    addUserIds?: string[];
    removeUserIds?: string[];
  }) => {
    try {
      await setCardMembers(
        params.cardId,
        params.addUserIds,
        params.removeUserIds
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                cardId: params.cardId,
                membersAdded: params.addUserIds?.length || 0,
                membersRemoved: params.removeUserIds?.length || 0,
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

export const membershipTools = [getBoardMembersTool, setCardMembersTool];
