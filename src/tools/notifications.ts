/**
 * Notification tools for PLANKA MCP server.
 */
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../operations/notifications.js";
import { NotificationType } from "../schemas/entities.js";
import { PlankaError } from "../errors.js";
import { defineTool } from "./types.js";

const NOTIFICATION_TYPE_DESCRIPTION =
  "Filter by notification type. Omit to return all unread notifications.";

function formatNotificationData(data: Record<string, unknown>) {
  const formatted: Record<string, unknown> = {};

  const card = data.card;
  if (card && typeof card === "object" && "name" in card) {
    formatted.cardName = (card as { name?: string }).name;
  }

  if (typeof data.text === "string") {
    formatted.text = data.text;
  }

  const fromList = data.fromList;
  if (fromList && typeof fromList === "object" && "name" in fromList) {
    formatted.fromList = (fromList as { name?: string }).name;
  }

  const toList = data.toList;
  if (toList && typeof toList === "object" && "name" in toList) {
    formatted.toList = (toList as { name?: string }).name;
  }

  return Object.keys(formatted).length > 0 ? formatted : data;
}

/**
 * Tool: planka_get_notifications
 * Get unread notifications for the agent user.
 */
export const getNotificationsTool = defineTool("read", {
  name: "planka_get_notifications",
  description:
    "Get unread notifications for the agent user. Use this to see @mentions, new comments, card moves, and card membership changes. Returns only unread notifications.",
  inputSchema: {
    type: "object" as const,
    properties: {
      types: {
        type: "array",
        items: {
          type: "string",
          enum: ["moveCard", "commentCard", "addMemberToCard", "mentionInComment"],
        },
        description: NOTIFICATION_TYPE_DESCRIPTION,
      },
    },
  },
  handler: async (params: { types?: NotificationType[] }) => {
    try {
      const notifications = await getNotifications({ types: params.types });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                unreadCount: notifications.length,
                notifications: notifications.map((notification) => ({
                  id: notification.id,
                  type: notification.type,
                  cardId: notification.cardId,
                  boardId: notification.boardId,
                  commentId: notification.commentId,
                  createdAt: notification.createdAt,
                  creator: notification.creator,
                  data: formatNotificationData(notification.data),
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
});

/**
 * Tool: planka_mark_notifications_read
 * Mark one or all notifications as read.
 */
export const markNotificationsReadTool = defineTool("modify", {
  name: "planka_mark_notifications_read",
  description:
    "Mark notifications as read after handling them. Pass notificationId for one notification, or markAll=true to clear the entire inbox.",
  inputSchema: {
    type: "object" as const,
    properties: {
      notificationId: {
        type: "string",
        description: "ID of a single notification to mark as read",
      },
      markAll: {
        type: "boolean",
        description: "Mark all unread notifications as read",
      },
    },
  },
  handler: async (params: { notificationId?: string; markAll?: boolean }) => {
    try {
      if (params.markAll) {
        const notifications = await markAllNotificationsRead();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  markedReadCount: notifications.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.notificationId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Provide notificationId or set markAll to true",
            },
          ],
          isError: true,
        };
      }

      const notification = await markNotificationRead(params.notificationId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                notification: {
                  id: notification.id,
                  type: notification.type,
                  isRead: notification.isRead,
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
});

export const notificationTools = [getNotificationsTool, markNotificationsReadTool];
