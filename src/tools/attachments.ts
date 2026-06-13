/**
 * Attachment tools for PLANKA MCP server.
 */
import {
  createLinkAttachment,
  updateAttachment,
  deleteAttachment,
} from "../operations/attachments.js";
import { getAttachmentUrl } from "../lib/attachments.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_manage_attachments
 * Create, update, or delete link attachments on a card.
 */
export const manageAttachmentsTool = {
  name: "planka_manage_attachments",
  description:
    "Create, update, or delete link attachments on a card (URLs to docs, PRs, tickets, etc.).",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "update", "delete"],
        description: "Action to perform",
      },
      cardId: {
        type: "string",
        description: "Card ID (required for create)",
      },
      attachmentId: {
        type: "string",
        description: "Attachment ID (required for update/delete)",
      },
      name: {
        type: "string",
        description: "Attachment display name",
      },
      url: {
        type: "string",
        description: "Link URL (required for create)",
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update" | "delete";
    cardId?: string;
    attachmentId?: string;
    name?: string;
    url?: string;
  }) => {
    try {
      switch (params.action) {
        case "create": {
          if (!params.cardId || !params.name || !params.url) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: cardId, name, and url are required for create action",
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

        case "update": {
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
        }

        case "delete": {
          if (!params.attachmentId) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: attachmentId is required for delete action",
                },
              ],
              isError: true,
            };
          }

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
        }

        default:
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Unknown action '${params.action}'`,
              },
            ],
            isError: true,
          };
      }
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

export const attachmentTools = [manageAttachmentsTool];
