/**
 * Board operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import {
  Board,
  List,
  Card,
  Label,
  CardLabel,
  BoardMembership,
  TaskList,
  Task,
  User,
  CardMembership,
  CustomFieldGroup,
  CustomField,
  CustomFieldValue,
} from "../schemas/entities.js";
import { BoardResponse, BoardIncludedSchema } from "../schemas/responses.js";
import {
  CreateBoardSchema,
  UpdateBoardSchema,
  CreateBoardInput,
  UpdateBoardInput,
} from "../schemas/requests.js";

/**
 * Full board details with all included entities.
 */
export interface BoardDetails {
  board: Board;
  lists: List[];
  cards: Card[];
  labels: Label[];
  cardLabels: CardLabel[];
  cardMemberships: CardMembership[];
  boardMemberships: BoardMembership[];
  taskLists: TaskList[];
  tasks: Task[];
  users: User[];
  customFieldGroups: CustomFieldGroup[];
  customFields: CustomField[];
  customFieldValues: CustomFieldValue[];
}

/**
 * Card with computed task counts.
 */
export interface CardWithTaskCounts extends Card {
  taskCount: number;
  completedTaskCount: number;
}

/**
 * Get a board by ID with all included entities.
 */
export async function getBoard(boardId: string): Promise<BoardDetails> {
  const response = await plankaClient.get<unknown>(`/api/boards/${boardId}`);
  const parsed = BoardResponse.parse(response);
  const included = BoardIncludedSchema.parse(
    (response as Record<string, unknown>).included || {}
  );

  return {
    board: parsed.item,
    lists: (included.lists || []).sort(
      (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
    ),
    cards: included.cards || [],
    labels: (included.labels || []).sort((a, b) => a.position - b.position),
    cardLabels: included.cardLabels || [],
    cardMemberships: included.cardMemberships || [],
    boardMemberships: included.boardMemberships || [],
    taskLists: (included.taskLists || []).sort((a, b) => a.position - b.position),
    tasks: included.tasks || [],
    users: included.users || [],
    customFieldGroups: included.customFieldGroups || [],
    customFields: included.customFields || [],
    customFieldValues: included.customFieldValues || [],
  };
}

/**
 * Board member with membership metadata.
 */
export interface BoardMemberInfo {
  id: string;
  name: string;
  username?: string;
  boardMembershipId: string;
  role: "editor" | "viewer";
  canComment?: boolean;
}

/**
 * Get board members (users with board access and membership details).
 */
export async function getBoardMembers(
  boardId: string
): Promise<BoardMemberInfo[]> {
  const details = await getBoard(boardId);
  const membershipByUserId = new Map(
    (details.boardMemberships || []).map((membership) => [
      membership.userId,
      membership,
    ])
  );

  return details.users.map((user) => {
    const membership = membershipByUserId.get(user.id);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      boardMembershipId: membership?.id ?? "",
      role: membership?.role ?? "viewer",
      canComment: membership?.canComment,
    };
  });
}

/**
 * Get a board with cards enriched with task counts.
 */
export async function getBoardWithTaskCounts(
  boardId: string
): Promise<{
  board: Board;
  lists: List[];
  cards: CardWithTaskCounts[];
  labels: Label[];
  cardLabels: CardLabel[];
  cardMemberships: CardMembership[];
  users: User[];
  customFieldGroups: CustomFieldGroup[];
  customFields: CustomField[];
  customFieldValues: CustomFieldValue[];
}> {
  const details = await getBoard(boardId);

  const taskListToCard = new Map<string, string>();
  for (const taskList of details.taskLists) {
    taskListToCard.set(taskList.id, taskList.cardId);
  }

  const taskCountsByCard = new Map<
    string,
    { total: number; completed: number }
  >();

  for (const task of details.tasks) {
    const cardId = taskListToCard.get(task.taskListId);
    if (!cardId) continue;

    const counts = taskCountsByCard.get(cardId) || {
      total: 0,
      completed: 0,
    };
    counts.total++;
    if (task.isCompleted) {
      counts.completed++;
    }
    taskCountsByCard.set(cardId, counts);
  }

  const cardsWithCounts: CardWithTaskCounts[] = details.cards.map((card) => {
    const counts = taskCountsByCard.get(card.id) || { total: 0, completed: 0 };
    return {
      ...card,
      taskCount: counts.total,
      completedTaskCount: counts.completed,
    };
  });

  return {
    board: details.board,
    lists: details.lists,
    cards: cardsWithCounts,
    labels: details.labels,
    cardLabels: details.cardLabels,
    cardMemberships: details.cardMemberships,
    users: details.users,
    customFieldGroups: details.customFieldGroups,
    customFields: details.customFields,
    customFieldValues: details.customFieldValues,
  };
}

/**
 * Create a board in a project.
 */
export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const validated = CreateBoardSchema.parse(input);

  const formData = new FormData();
  formData.append("name", validated.name);
  formData.append("position", String(validated.position));

  const response = await plankaClient.postForm<unknown>(
    `/api/projects/${validated.projectId}/boards`,
    formData
  );

  const parsed = BoardResponse.parse(response);
  return parsed.item;
}

/**
 * Update a board's settings.
 */
export async function updateBoard(
  boardId: string,
  input: UpdateBoardInput
): Promise<Board> {
  const validated = UpdateBoardSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/boards/${boardId}`,
    validated
  );

  const parsed = BoardResponse.parse(response);
  return parsed.item;
}

/**
 * Delete a board and all its contents.
 */
export async function deleteBoard(boardId: string): Promise<void> {
  await plankaClient.delete(`/api/boards/${boardId}`);
}

/**
 * Get cards for a specific list on a board.
 */
export async function getCardsForList(
  boardId: string,
  listId: string
): Promise<Card[]> {
  const details = await getBoard(boardId);
  return details.cards
    .filter((card) => card.listId === listId)
    .sort((a, b) => a.position - b.position);
}
