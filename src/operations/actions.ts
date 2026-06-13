/**
 * Action (activity log) operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Action, User } from "../schemas/entities.js";
import { ActionsResponse } from "../schemas/responses.js";

export interface ActionWithUser extends Action {
  user?: Pick<User, "id" | "name" | "username">;
}

export interface GetActionsOptions {
  boardId?: string;
  cardId?: string;
  beforeId?: string;
}

/**
 * Get activity actions for a board or card.
 */
export async function getActions(
  options: GetActionsOptions
): Promise<ActionWithUser[]> {
  if (!options.boardId && !options.cardId) {
    throw new Error("Either boardId or cardId is required");
  }

  const params = new URLSearchParams();
  if (options.beforeId) {
    params.set("beforeId", options.beforeId);
  }
  const query = params.toString();

  const path = options.cardId
    ? `/api/cards/${options.cardId}/actions${query ? `?${query}` : ""}`
    : `/api/boards/${options.boardId}/actions${query ? `?${query}` : ""}`;

  const response = await plankaClient.get<unknown>(path);
  const parsed = ActionsResponse.parse(response);

  const usersById = new Map(
    (parsed.included?.users as User[] | undefined)?.map((user) => [
      user.id,
      user,
    ]) ?? []
  );

  return parsed.items.map((action) => {
    const user = action.userId ? usersById.get(action.userId) : undefined;
    return {
      ...action,
      user: user
        ? { id: user.id, name: user.name, username: user.username }
        : undefined,
    };
  });
}
