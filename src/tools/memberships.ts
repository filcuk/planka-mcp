/**
 * Membership tools for PLANKA MCP server.
 */
import { getBoardMembers } from "../operations/boards.js";
import { addCardMember, removeCardMember } from "../operations/memberships.js";
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

export const getBoardMembersTool = defineTool("read", {
  name: "planka_get_board_members",
  description:
    "List board members with roles and membership IDs. Use this to find user IDs for assigning people to cards or boards.",
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
      return handleError(error);
    }
  },
});

export const addCardMembersTool = defineTool("modify", {
  name: "planka_add_card_members",
  description: "Add users as members on a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      userIds: {
        type: "array",
        items: { type: "string" },
        description: "User IDs to add as card members",
      },
    },
    required: ["cardId", "userIds"],
  },
  handler: async (params: { cardId: string; userIds: string[] }) => {
    try {
      let added = 0;
      for (const userId of params.userIds) {
        try {
          await addCardMember({ cardId: params.cardId, userId });
          added++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!message.toLowerCase().includes("already")) {
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
                membersAdded: added,
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

export const removeCardMembersTool = defineTool("delete", {
  name: "planka_remove_card_members",
  description: "Remove users from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      userIds: {
        type: "array",
        items: { type: "string" },
        description: "User IDs to remove from the card",
      },
    },
    required: ["cardId", "userIds"],
  },
  handler: async (params: { cardId: string; userIds: string[] }) => {
    try {
      for (const userId of params.userIds) {
        try {
          await removeCardMember(params.cardId, userId);
        } catch {
          // Ignore if member not on card
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
                membersRemoved: params.userIds.length,
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

export const membershipTools = [
  getBoardMembersTool,
  addCardMembersTool,
  removeCardMembersTool,
];
