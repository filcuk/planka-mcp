/**
 * Card operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import {
  Card,
  TaskList,
  Task,
  Comment,
  Label,
  CardLabel,
  Attachment,
  CardMembership,
  User,
  CustomFieldGroup,
  CustomField,
  CustomFieldValue,
} from "../schemas/entities.js";
import {
  CreateCardSchema,
  UpdateCardSchema,
  MoveCardSchema,
  SearchCardsSchema,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  SearchCardsInput,
} from "../schemas/requests.js";
import { CardResponse, CardsResponse, CardIncludedSchema } from "../schemas/responses.js";

/**
 * Card details with all related entities.
 */
export interface CardDetails {
  card: Card;
  taskLists: TaskList[];
  tasks: Task[];
  comments: Comment[];
  labels: Label[];
  cardLabels: CardLabel[];
  attachments: Attachment[];
  cardMemberships: CardMembership[];
  users: User[];
  customFieldGroups: CustomFieldGroup[];
  customFields: CustomField[];
  customFieldValues: CustomFieldValue[];
}

/**
 * Create a new card in a list.
 */
export async function createCard(input: CreateCardInput): Promise<Card> {
  const validated = CreateCardSchema.parse(input);

  const response = await plankaClient.post<unknown>(
    `/api/lists/${validated.listId}/cards`,
    {
      name: validated.name,
      description: validated.description,
      position: validated.position,
      type: validated.type,
      dueDate: validated.dueDate,
    }
  );

  const parsed = CardResponse.parse(response);
  return parsed.item;
}

/**
 * Get a card by ID with all related entities.
 */
export async function getCard(cardId: string): Promise<CardDetails> {
  const response = await plankaClient.get<unknown>(`/api/cards/${cardId}`);
  const parsed = CardResponse.parse(response);
  const included = CardIncludedSchema.parse(
    (response as Record<string, unknown>).included || {}
  );

  return {
    card: parsed.item,
    taskLists: (included.taskLists || []).sort((a, b) => a.position - b.position),
    tasks: (included.tasks || []).sort((a, b) => a.position - b.position),
    comments: (included.comments || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    labels: included.labels || [],
    cardLabels: included.cardLabels || [],
    attachments: included.attachments || [],
    cardMemberships: included.cardMemberships || [],
    users: included.users || [],
    customFieldGroups: included.customFieldGroups || [],
    customFields: included.customFields || [],
    customFieldValues: included.customFieldValues || [],
  };
}

/**
 * Update a card's properties.
 */
export async function updateCard(
  cardId: string,
  input: UpdateCardInput
): Promise<Card> {
  const validated = UpdateCardSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/cards/${cardId}`,
    validated
  );

  const parsed = CardResponse.parse(response);
  return parsed.item;
}

/**
 * Move a card to a different list/position.
 */
export async function moveCard(input: MoveCardInput): Promise<Card> {
  const validated = MoveCardSchema.parse(input);

  const updatePayload: Record<string, unknown> = {
    listId: validated.listId,
    position: validated.position,
  };

  if (validated.boardId) {
    updatePayload.boardId = validated.boardId;
  }

  const response = await plankaClient.patch<unknown>(
    `/api/cards/${validated.cardId}`,
    updatePayload
  );

  const parsed = CardResponse.parse(response);
  return parsed.item;
}

/**
 * Delete a card.
 */
export async function deleteCard(cardId: string): Promise<void> {
  await plankaClient.delete(`/api/cards/${cardId}`);
}

/**
 * Search cards in a list with optional filters.
 */
export async function searchCards(input: SearchCardsInput): Promise<CardDetails[]> {
  const validated = SearchCardsSchema.parse(input);
  const params = new URLSearchParams();

  if (validated.search) {
    params.set("search", validated.search);
  }
  if (validated.labelIds && validated.labelIds.length > 0) {
    params.set("labelIds", validated.labelIds.join(","));
  }
  if (validated.userIds && validated.userIds.length > 0) {
    params.set("userIds", validated.userIds.join(","));
  }

  const query = params.toString();
  const path = `/api/lists/${validated.listId}/cards${query ? `?${query}` : ""}`;
  const response = await plankaClient.get<unknown>(path);
  const parsed = CardsResponse.parse(response);
  const included = CardIncludedSchema.parse(
    (response as Record<string, unknown>).included || {}
  );

  return parsed.items.map((card) => ({
    card,
    taskLists: (included.taskLists || []).filter((tl) => tl.cardId === card.id),
    tasks: (included.tasks || []).filter((task) =>
      (included.taskLists || []).some(
        (tl) => tl.id === task.taskListId && tl.cardId === card.id
      )
    ),
    comments: [],
    labels: included.labels || [],
    cardLabels: (included.cardLabels || []).filter((cl) => cl.cardId === card.id),
    attachments: (included.attachments || []).filter((a) => a.cardId === card.id),
    cardMemberships: (included.cardMemberships || []).filter(
      (cm) => cm.cardId === card.id
    ),
    users: included.users || [],
    customFieldGroups: (included.customFieldGroups || []).filter(
      (g) => g.cardId === card.id || g.boardId === card.boardId
    ),
    customFields: included.customFields || [],
    customFieldValues: (included.customFieldValues || []).filter(
      (v) => v.cardId === card.id
    ),
  }));
}
