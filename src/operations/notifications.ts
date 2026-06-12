/**
 * Notification operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Notification, NotificationType, User } from "../schemas/entities.js";
import {
  NotificationResponse,
  NotificationsResponse,
} from "../schemas/responses.js";

export interface NotificationWithCreator extends Notification {
  creator?: Pick<User, "id" | "name" | "username">;
}

export interface GetNotificationsOptions {
  types?: NotificationType[];
}

/**
 * Get unread notifications for the authenticated agent user.
 */
export async function getNotifications(
  options: GetNotificationsOptions = {}
): Promise<NotificationWithCreator[]> {
  const response = await plankaClient.get<unknown>("/api/notifications");
  const parsed = NotificationsResponse.parse(response);

  const usersById = new Map(
    (parsed.included?.users as User[] | undefined)?.map((user) => [user.id, user]) ?? []
  );

  let notifications = parsed.items.map((notification) => {
    const creator = notification.creatorUserId
      ? usersById.get(notification.creatorUserId)
      : undefined;

    return {
      ...notification,
      creator: creator
        ? {
            id: creator.id,
            name: creator.name,
            username: creator.username,
          }
        : undefined,
    };
  });

  if (options.types && options.types.length > 0) {
    const allowedTypes = new Set(options.types);
    notifications = notifications.filter((notification) =>
      allowedTypes.has(notification.type)
    );
  }

  return notifications;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const response = await plankaClient.patch<unknown>(
    `/api/notifications/${notificationId}`,
    { isRead: true }
  );

  const parsed = NotificationResponse.parse(response);
  return parsed.item;
}

/**
 * Mark all notifications as read for the authenticated agent user.
 */
export async function markAllNotificationsRead(): Promise<Notification[]> {
  const response = await plankaClient.post<unknown>("/api/notifications/read-all", {});
  const parsed = NotificationsResponse.parse(response);
  return parsed.items;
}
