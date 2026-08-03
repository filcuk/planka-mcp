import { describe, expect, it } from "vitest";
import { formatCardDetails } from "../src/lib/format-card.js";
import type { CardDetails } from "../src/operations/cards.js";

function baseDetails(overrides: Partial<CardDetails> = {}): CardDetails {
  return {
    card: {
      id: "card-1",
      boardId: "board-1",
      listId: "list-1",
      name: "Card",
      description: null,
      position: 65536,
      type: "project",
      dueDate: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    taskLists: [],
    tasks: [],
    labels: [],
    cardLabels: [],
    attachments: [],
    cardMemberships: [],
    users: [],
    customFieldGroups: [],
    customFields: [],
    customFieldValues: [],
    ...overrides,
  };
}

describe("formatCardDetails", () => {
  it("emits label names and colors when labels are supplied", () => {
    const formatted = formatCardDetails(
      baseDetails({
        labels: [
          {
            id: "label-1",
            boardId: "board-1",
            name: "Bug",
            color: "berry-red",
            position: 65536,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "label-2",
            boardId: "board-1",
            name: null,
            color: "lagoon-blue",
            position: 131072,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        cardLabels: [
          {
            id: "cl-1",
            cardId: "card-1",
            labelId: "label-1",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "cl-2",
            cardId: "card-1",
            labelId: "label-2",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );

    expect(formatted.labels).toEqual([
      { id: "label-1", name: "Bug", color: "berry-red" },
      { id: "label-2", name: null, color: "lagoon-blue" },
    ]);
  });

  it("keeps name and color keys as null when label metadata is missing", () => {
    const formatted = formatCardDetails(
      baseDetails({
        cardLabels: [
          {
            id: "cl-1",
            cardId: "card-1",
            labelId: "label-unknown",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );

    expect(formatted.labels).toEqual([
      { id: "label-unknown", name: null, color: null },
    ]);
  });
});
