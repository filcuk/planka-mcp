/**
 * Attachment tools for PLANKA MCP server.
 */
import {
  createLinkAttachment,
  createFileAttachment,
  updateAttachment,
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

export const modifyAttachmentsTool = defineTool("modify", {
  name: "planka_modify_attachments",
  description:
    "Create or update attachments on a card. Prefer link attachments for URLs; use file type for small artifacts (base64, max 5 MB).",
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
        description: "Card ID (required for create)",
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
        description: "Link URL (required for link type)",
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
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.attachmentId || !params.name) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: attachmentId and name are required for update action",
            },
          ],
          isError: true,
        };
      }

      const attachment = await updateAttachment(params.attachmentId, {
        name: params.name,
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
                  url: getAttachmentUrl(attachment),
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

export const attachmentTools = [modifyAttachmentsTool, deleteAttachmentTool];
