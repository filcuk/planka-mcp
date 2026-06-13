/**
 * Card membership operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { CardMembership } from "../schemas/entities.js";
import { AddCardMemberSchema, AddCardMemberInput } from "../schemas/requests.js";
import { CardMembershipResponse } from "../schemas/responses.js";
import { getCard } from "./cards.js";

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

/**
 * Set card members (add and/or remove).
 */
export async function setCardMembers(
  cardId: string,
  addUserIds?: string[],
  removeUserIds?: string[]
): Promise<void> {
  if (removeUserIds && removeUserIds.length > 0) {
    for (const userId of removeUserIds) {
      try {
        await removeCardMember(cardId, userId);
      } catch {
        // Ignore if member not on card
      }
    }
  }

  if (addUserIds && addUserIds.length > 0) {
    const cardDetails = await getCard(cardId);
    const existingUserIds = new Set(
      cardDetails.cardMemberships.map((membership) => membership.userId)
    );

    for (const userId of addUserIds) {
      if (existingUserIds.has(userId)) {
        continue;
      }
      try {
        await addCardMember({ cardId, userId });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("already")) {
          throw error;
        }
      }
    }
  }
}
