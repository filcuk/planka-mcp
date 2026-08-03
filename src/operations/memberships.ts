/**
 * Card membership operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { CardMembership } from "../schemas/entities.js";
import { AddCardMemberSchema, AddCardMemberInput } from "../schemas/requests.js";
import { CardMembershipResponse } from "../schemas/responses.js";

/**
 * Add a user to a card.
 */
export async function addCardMember(input: AddCardMemberInput): Promise<CardMembership> {
  const validated = AddCardMemberSchema.parse(input);

  const response = await plankaClient.post<unknown>(
    `/api/cards/${validated.cardId}/card-memberships`,
    { userId: validated.userId }
  );

  const parsed = CardMembershipResponse.parse(response);
  return parsed.item;
}

/**
 * Remove a user from a card.
 */
export async function removeCardMember(
  cardId: string,
  userId: string
): Promise<void> {
  await plankaClient.delete(
    `/api/cards/${cardId}/card-memberships/userId:${userId}`
  );
}
