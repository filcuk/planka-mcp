/**
 * Comment operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Comment, User } from "../schemas/entities.js";
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CreateCommentInput,
  UpdateCommentInput,
} from "../schemas/requests.js";
import { CommentResponse, CommentsResponse } from "../schemas/responses.js";

export interface CommentWithAuthor extends Comment {
  author?: Pick<User, "id" | "name" | "username">;
}

/**
 * Add a comment to a card.
 */
export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const validated = CreateCommentSchema.parse(input);

  const response = await plankaClient.post<unknown>(
    `/api/cards/${validated.cardId}/comments`,
    {
      text: validated.text,
    }
  );

  const parsed = CommentResponse.parse(response);
  return parsed.item;
}

/**
 * Update a comment's text.
 */
export async function updateComment(
  commentId: string,
  input: UpdateCommentInput
): Promise<Comment> {
  const validated = UpdateCommentSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/comments/${commentId}`,
    validated
  );

  const parsed = CommentResponse.parse(response);
  return parsed.item;
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId: string): Promise<void> {
  await plankaClient.delete(`/api/comments/${commentId}`);
}

/**
 * Get comments for a card via GET /api/cards/{cardId}/comments.
 * Optionally paginate with beforeId.
 */
export async function getCommentsForCard(
  cardId: string,
  beforeId?: string
): Promise<CommentWithAuthor[]> {
  const params = new URLSearchParams();
  if (beforeId) {
    params.set("beforeId", beforeId);
  }
  const query = params.toString();
  const path = `/api/cards/${cardId}/comments${query ? `?${query}` : ""}`;

  const response = await plankaClient.get<unknown>(path);
  const parsed = CommentsResponse.parse(response);

  const usersById = new Map(
    (parsed.included?.users as User[] | undefined)?.map((user) => [
      user.id,
      user,
    ]) ?? []
  );

  return parsed.items.map((comment) => {
    const user = comment.userId ? usersById.get(comment.userId) : undefined;
    return {
      ...comment,
      author: user
        ? { id: user.id, name: user.name, username: user.username }
        : undefined,
    };
  });
}
