/**
 * Board membership tools for PLANKA MCP server.
 */
import {
  createBoardMembership,
  updateBoardMembership,
  deleteBoardMembership,
} from "../operations/board-memberships.js";
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

export const modifyBoardMembersTool = defineTool("modify", {
  name: "planka_modify_board_members",
  description:
    "Add a user to a board or update their board role. Requires project manager permissions.",
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
      boardMembershipId: {
        type: "string",
        description: "Board membership ID (required for update)",
      },
      userId: {
        type: "string",
        description: "User ID to add (required for create)",
      },
      role: {
        type: "string",
        enum: ["editor", "viewer"],
        description: "Board role",
      },
      canComment: {
        type: "boolean",
        description: "Whether the user can comment on cards",
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update";
    boardId?: string;
    boardMembershipId?: string;
    userId?: string;
    role?: "editor" | "viewer";
    canComment?: boolean;
  }) => {
    try {
      if (params.action === "create") {
        if (!params.boardId || !params.userId || !params.role) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: boardId, userId, and role are required for create action",
              },
            ],
            isError: true,
          };
        }

        const membership = await createBoardMembership({
          boardId: params.boardId,
          userId: params.userId,
          role: params.role,
          canComment: params.canComment,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  boardMembership: {
                    id: membership.id,
                    boardId: membership.boardId,
                    userId: membership.userId,
                    role: membership.role,
                    canComment: membership.canComment,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.boardMembershipId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: boardMembershipId is required for update action",
            },
          ],
          isError: true,
        };
      }

      const updates: Record<string, unknown> = {};
      if (params.role !== undefined) updates.role = params.role;
      if (params.canComment !== undefined) updates.canComment = params.canComment;

      const membership = await updateBoardMembership(
        params.boardMembershipId,
        updates
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                boardMembership: {
                  id: membership.id,
                  role: membership.role,
                  canComment: membership.canComment,
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

export const deleteBoardMemberTool = defineTool("delete", {
  name: "planka_delete_board_member",
  description: "Remove a user from a board.",
  inputSchema: {
    type: "object" as const,
    properties: {
      boardMembershipId: {
        type: "string",
        description: "Board membership ID to delete",
      },
    },
    required: ["boardMembershipId"],
  },
  handler: async (params: { boardMembershipId: string }) => {
    try {
      await deleteBoardMembership(params.boardMembershipId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Board membership ${params.boardMembershipId} deleted`,
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

export const boardMembershipTools = [
  modifyBoardMembersTool,
  deleteBoardMemberTool,
];
