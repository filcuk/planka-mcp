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

export const addCommentTool = defineTool("modify", {
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
      return handleError(error);
    }
  },
});

export const getCommentsTool = defineTool("read", {
  name: "planka_get_comments",
  description:
    "Get comments on a card. Supports cursor pagination via beforeId.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      beforeId: {
        type: "string",
        description: "Pagination cursor — return comments before this ID",
      },
    },
    required: ["cardId"],
  },
  handler: async (params: { cardId: string; beforeId?: string }) => {
    try {
      const comments = await getCommentsForCard(params.cardId, params.beforeId);

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
                  updatedAt: comment.updatedAt,
                  author: comment.author,
                })),
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

export const modifyCommentTool = defineTool("modify", {
  name: "planka_modify_comment",
  description: "Update a comment on a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      commentId: {
        type: "string",
        description: "The comment ID",
      },
      text: {
        type: "string",
        description: "New comment text",
      },
    },
    required: ["commentId", "text"],
  },
  handler: async (params: { commentId: string; text: string }) => {
    try {
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
    } catch (error) {
      return handleError(error);
    }
  },
});

export const deleteCommentTool = defineTool("delete", {
  name: "planka_delete_comment",
  description: "Delete a comment from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      commentId: {
        type: "string",
        description: "The comment ID to delete",
      },
    },
    required: ["commentId"],
  },
  handler: async (params: { commentId: string }) => {
    try {
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
      return handleError(error);
    }
  },
});

export const commentTools = [
  addCommentTool,
  getCommentsTool,
  modifyCommentTool,
  deleteCommentTool,
];
