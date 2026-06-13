/**
 * Navigation tools for PLANKA MCP server.
 */
import { getStructure } from "../operations/projects.js";
import { getBoardWithTaskCounts } from "../operations/boards.js";
import { formatCustomFields } from "../lib/custom-fields.js";
import { defineTool } from "./types.js";

function isSystemList(type: string): boolean {
  return type === "archive" || type === "trash";
}

function shouldIncludeList(
  list: { name: string | null; type: string },
  includeSystemLists?: boolean
): boolean {
  if (includeSystemLists) {
    return true;
  }
  return list.name !== null && !isSystemList(list.type);
}

/**
 * Tool: planka_get_structure
 * Get the full project/board/list hierarchy.
 */
export const getStructureTool = defineTool("read", {
  name: "planka_get_structure",
  description:
    "Get the full project/board/list structure. Use this to understand what projects and boards exist before working with cards.",
  inputSchema: {
    type: "object" as const,
    properties: {
      projectId: {
        type: "string",
        description: "Optional: Get structure for a specific project only",
      },
      includeSystemLists: {
        type: "boolean",
        description:
          "Include archive and trash lists (default: false)",
      },
    },
  },
  handler: async (params: {
    projectId?: string;
    includeSystemLists?: boolean;
  }) => {
    const structure = await getStructure(params.projectId);

    const formatted = structure.map((project) => ({
      project: {
        id: project.project.id,
        name: project.project.name,
      },
      boards: project.boards.map((b) => ({
        id: b.board.id,
        name: b.board.name,
        lists: b.lists
          .filter((list) => shouldIncludeList(list, params.includeSystemLists))
          .map((list) => ({
            id: list.id,
            name: list.name,
            type: list.type,
          })),
      })),
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  },
});

/**
 * Tool: planka_get_board
 * Get a board with all its lists, cards, and labels.
 */
export const getBoardTool = defineTool("read", {
  name: "planka_get_board",
  description:
    "Get a board with all its lists, cards, labels, members, and custom field values.",
  inputSchema: {
    type: "object" as const,
    properties: {
      boardId: {
        type: "string",
        description: "The board ID",
      },
      includeTaskCounts: {
        type: "boolean",
        description: "Include task completion counts for each card",
        default: true,
      },
      includeMembers: {
        type: "boolean",
        description: "Include card member names on each card",
        default: false,
      },
      includeSystemLists: {
        type: "boolean",
        description: "Include archive and trash lists",
        default: false,
      },
    },
    required: ["boardId"],
  },
  handler: async (params: {
    boardId: string;
    includeTaskCounts?: boolean;
    includeMembers?: boolean;
    includeSystemLists?: boolean;
  }) => {
    const details = await getBoardWithTaskCounts(params.boardId);

    const cardsByList = new Map<string, typeof details.cards>();
    for (const card of details.cards) {
      const listCards = cardsByList.get(card.listId) || [];
      listCards.push(card);
      cardsByList.set(card.listId, listCards);
    }

    const labelById = new Map(details.labels.map((l) => [l.id, l]));
    const userById = new Map(details.users.map((u) => [u.id, u]));

    const labelsByCard = new Map<string, string[]>();
    for (const cardLabel of details.cardLabels) {
      const labels = labelsByCard.get(cardLabel.cardId) || [];
      const label = labelById.get(cardLabel.labelId);
      if (label) {
        labels.push(label.name || label.color);
      }
      labelsByCard.set(cardLabel.cardId, labels);
    }

    const membersByCard = new Map<string, string[]>();
    for (const membership of details.cardMemberships) {
      const members = membersByCard.get(membership.cardId) || [];
      const user = userById.get(membership.userId);
      if (user) {
        members.push(user.name);
      }
      membersByCard.set(membership.cardId, members);
    }

    const customFieldsByCard = new Map<string, ReturnType<typeof formatCustomFields>>();
    for (const card of details.cards) {
      const groups = details.customFieldGroups.filter(
        (group) => group.cardId === card.id || group.boardId === card.boardId
      );
      const values = details.customFieldValues.filter(
        (value) => value.cardId === card.id
      );
      if (values.length > 0) {
        customFieldsByCard.set(
          card.id,
          formatCustomFields(groups, details.customFields, values)
        );
      }
    }

    const formatted = {
      board: {
        id: details.board.id,
        name: details.board.name,
      },
      labels: details.labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
      lists: details.lists
        .filter((list) => shouldIncludeList(list, params.includeSystemLists))
        .map((list) => {
          const listCards = (cardsByList.get(list.id) || []).sort(
            (a, b) => a.position - b.position
          );
          return {
            id: list.id,
            name: list.name,
            type: list.type,
            cards: listCards.map((card) => {
              const cardData: Record<string, unknown> = {
                id: card.id,
                name: card.name,
              };

              if (card.description) {
                cardData.description =
                  card.description.length > 100
                    ? card.description.substring(0, 100) + "..."
                    : card.description;
              }

              if (card.dueDate) {
                cardData.dueDate = card.dueDate;
              }

              if (card.isClosed) {
                cardData.isClosed = card.isClosed;
              }

              if (card.isDueCompleted) {
                cardData.isDueCompleted = card.isDueCompleted;
              }

              const cardLabels = labelsByCard.get(card.id);
              if (cardLabels && cardLabels.length > 0) {
                cardData.labels = cardLabels;
              }

              if (params.includeMembers) {
                const members = membersByCard.get(card.id);
                if (members && members.length > 0) {
                  cardData.members = members;
                }
              }

              const customFields = customFieldsByCard.get(card.id);
              if (customFields && customFields.length > 0) {
                cardData.customFields = customFields.map((field) => ({
                  name: field.name,
                  value: field.value,
                }));
              }

              if (params.includeTaskCounts !== false && card.taskCount > 0) {
                cardData.tasks = `${card.completedTaskCount}/${card.taskCount}`;
              }

              return cardData;
            }),
          };
        }),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  },
});

export const navigationTools = [getStructureTool, getBoardTool];
