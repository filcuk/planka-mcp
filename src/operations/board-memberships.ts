/**
 * Board membership operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { BoardMembership } from "../schemas/entities.js";
import {
  CreateBoardMembershipSchema,
  UpdateBoardMembershipSchema,
  CreateBoardMembershipInput,
  UpdateBoardMembershipInput,
} from "../schemas/requests.js";
import { BoardMembershipResponse } from "../schemas/responses.js";

/**
 * Add a user to a board with a role.
 */
export async function createBoardMembership(
  input: CreateBoardMembershipInput
): Promise<BoardMembership> {
  const validated = CreateBoardMembershipSchema.parse(input);

  const response = await plankaClient.post<unknown>(
    `/api/boards/${validated.boardId}/board-memberships`,
    {
      userId: validated.userId,
      role: validated.role,
      canComment: validated.canComment,
    }
  );

  const parsed = BoardMembershipResponse.parse(response);
  return parsed.item;
}

/**
 * Update a board membership's role or comment permission.
 */
export async function updateBoardMembership(
  boardMembershipId: string,
  input: UpdateBoardMembershipInput
): Promise<BoardMembership> {
  const validated = UpdateBoardMembershipSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/board-memberships/${boardMembershipId}`,
    validated
  );

  const parsed = BoardMembershipResponse.parse(response);
  return parsed.item;
}

/**
 * Remove a user from a board.
 */
export async function deleteBoardMembership(
  boardMembershipId: string
): Promise<void> {
  await plankaClient.delete(`/api/board-memberships/${boardMembershipId}`);
}
