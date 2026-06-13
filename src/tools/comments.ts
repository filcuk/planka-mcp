/**
 * Comment tools for PLANKA MCP server.
 */
import {
  createComment,
  getCommentsForCard,
  updateComment,
  deleteComment,
} from "../operations/comments.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_add_comment
 * Add a comment to a card.
 */
export const addCommentTool = {
  name: "planka_add_comment",
  description:
    "Add a comment to a card. Use this for status updates, notes, or agent activity logs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      text: {
        type: "string",
        description: "Comment text (markdown supported)",
      },
    },
    required: ["cardId", "text"],
  },
  handler: async (params: { cardId: string; text: string }) => {
    try {
      const comment = await createComment({
        cardId: params.cardId,
        text: params.text,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                comment: {
                  id: comment.id,
                  text: comment.text,
                  createdAt: comment.createdAt,
                },
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
 * Tool: planka_get_comments
 * Get all comments on a card.
 */
export const getCommentsTool = {
  name: "planka_get_comments",
  description: "Get all comments on a card.",
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
      const comments = await getCommentsForCard(params.cardId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                cardId: params.cardId,
                commentCount: comments.length,
                comments: comments.map((comment) => ({
                  id: comment.id,
                  text: comment.text,
                  createdAt: comment.createdAt,
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
 * Tool: planka_manage_comments
 * Update or delete comments on a card.
 */
export const manageCommentsTool = {
  name: "planka_manage_comments",
  description: "Update or delete a comment on a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["update", "delete"],
        description: "Action to perform",
      },
      commentId: {
        type: "string",
        description: "The comment ID",
      },
      text: {
        type: "string",
        description: "New comment text (required for update)",
      },
    },
    required: ["action", "commentId"],
  },
  handler: async (params: {
    action: "update" | "delete";
    commentId: string;
    text?: string;
  }) => {
    try {
      if (params.action === "update") {
        if (!params.text) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: text is required for update action",
              },
            ],
            isError: true,
          };
        }

        const comment = await updateComment(params.commentId, {
          text: params.text,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  comment: {
                    id: comment.id,
                    text: comment.text,
                    updatedAt: comment.updatedAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      await deleteComment(params.commentId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Comment ${params.commentId} deleted`,
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

export const commentTools = [
  addCommentTool,
  getCommentsTool,
  manageCommentsTool,
];
