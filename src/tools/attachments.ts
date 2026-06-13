/**
 * Attachment tools for PLANKA MCP server.
 */
import {
  createLinkAttachment,
  createFileAttachment,
  updateAttachment,
  downloadAttachment,
  deleteAttachment,
} from "../operations/attachments.js";
import { getAttachmentUrl } from "../lib/attachments.js";
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

export const getAttachmentTool = defineTool("read", {
  name: "planka_get_attachment",
  description:
    "Get attachment metadata for a card. For file attachments, optionally download content as base64 (max 5 MB). Link attachments return their external URL.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "Card ID that owns the attachment",
      },
      attachmentId: {
        type: "string",
        description: "Attachment ID",
      },
      includeContent: {
        type: "boolean",
        description:
          "For file attachments, download content as base64 (default: false)",
      },
    },
    required: ["cardId", "attachmentId"],
  },
  handler: async (params: {
    cardId: string;
    attachmentId: string;
    includeContent?: boolean;
  }) => {
    try {
      const attachment = await downloadAttachment({
        cardId: params.cardId,
        attachmentId: params.attachmentId,
        includeContent: params.includeContent,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, attachment }, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  },
});

export const modifyAttachmentsTool = defineTool("modify", {
  name: "planka_modify_attachments",
  description:
    "Create or update attachments on a card. Prefer link attachments for URLs; use file type for small artifacts (base64, max 5 MB). Updating a link URL recreates the attachment with a new ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "update"],
        description: "Action to perform",
      },
      cardId: {
        type: "string",
        description:
          "Card ID (required for create; required for update when changing URL)",
      },
      attachmentId: {
        type: "string",
        description: "Attachment ID (required for update)",
      },
      attachmentType: {
        type: "string",
        enum: ["link", "file"],
        description: "Attachment type for create (default: link)",
      },
      name: {
        type: "string",
        description: "Attachment display name",
      },
      url: {
        type: "string",
        description: "Link URL (required for link create; optional on update)",
      },
      fileBase64: {
        type: "string",
        description: "Base64-encoded file content (required for file type)",
      },
      mimeType: {
        type: "string",
        description: "MIME type for file attachments (optional)",
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update";
    cardId?: string;
    attachmentId?: string;
    attachmentType?: "link" | "file";
    name?: string;
    url?: string;
    fileBase64?: string;
    mimeType?: string;
  }) => {
    try {
      if (params.action === "create") {
        const attachmentType = params.attachmentType ?? "link";

        if (!params.cardId || !params.name) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: cardId and name are required for create action",
              },
            ],
            isError: true,
          };
        }

        if (attachmentType === "link") {
          if (!params.url) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: url is required for link attachments",
                },
              ],
              isError: true,
            };
          }

          const attachment = await createLinkAttachment({
            cardId: params.cardId,
            name: params.name,
            url: params.url,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    success: true,
                    attachment: {
                      id: attachment.id,
                      name: attachment.name,
                      type: attachment.type,
                      url: getAttachmentUrl(attachment),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (!params.fileBase64) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: fileBase64 is required for file attachments",
              },
            ],
            isError: true,
          };
        }

        const attachment = await createFileAttachment({
          cardId: params.cardId,
          name: params.name,
          fileBase64: params.fileBase64,
          mimeType: params.mimeType,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  attachment: {
                    id: attachment.id,
                    name: attachment.name,
                    type: attachment.type,
                    url: getAttachmentUrl(attachment),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.attachmentId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: attachmentId is required for update action",
            },
          ],
          isError: true,
        };
      }

      if (!params.name && !params.url) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: at least one of name or url is required for update action",
            },
          ],
          isError: true,
        };
      }

      if (params.url && !params.cardId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: cardId is required when updating attachment URLs",
            },
          ],
          isError: true,
        };
      }

      const previousAttachmentId = params.attachmentId;
      const attachment = await updateAttachment(
        params.attachmentId,
        {
          name: params.name,
          url: params.url,
        },
        { cardId: params.cardId }
      );

      const response: Record<string, unknown> = {
        success: true,
        attachment: {
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          url: getAttachmentUrl(attachment),
        },
      };

      if (params.url && attachment.id !== previousAttachmentId) {
        response.note =
          "Link URL updates recreate the attachment; use the new attachment ID going forward.";
        response.previousAttachmentId = previousAttachmentId;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  },
});

export const deleteAttachmentTool = defineTool("delete", {
  name: "planka_delete_attachment",
  description: "Delete an attachment from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      attachmentId: {
        type: "string",
        description: "Attachment ID to delete",
      },
    },
    required: ["attachmentId"],
  },
  handler: async (params: { attachmentId: string }) => {
    try {
      await deleteAttachment(params.attachmentId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Attachment ${params.attachmentId} deleted`,
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

export const attachmentTools = [
  getAttachmentTool,
  modifyAttachmentsTool,
  deleteAttachmentTool,
];
