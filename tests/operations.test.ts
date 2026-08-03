import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ActionSchema,
  CommentSchema,
} from "../src/schemas/entities.js";
import { PlankaNotFoundError } from "../src/errors.js";

const { mockGet, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../src/client.js", () => ({
  plankaClient: {
    get: mockGet,
    post: vi.fn(),
    patch: vi.fn(),
    delete: mockDelete,
    postForm: vi.fn(),
    getBinary: vi.fn(),
  },
}));

import { getCommentsForCard } from "../src/operations/comments.js";
import { getBoardMembers } from "../src/operations/boards.js";
import { removeCardLabelsTool } from "../src/tools/labels.js";
import { removeCardMembersTool } from "../src/tools/memberships.js";

describe("CommentSchema", () => {
  it("parses a comment with null userId", () => {
    const parsed = CommentSchema.parse({
      id: "comment-1",
      cardId: "card-1",
      userId: null,
      text: "Orphan comment",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: null,
    });
    expect(parsed.userId).toBeNull();
  });
});

describe("ActionSchema looseEnum", () => {
  it("accepts an unknown action type without failing", () => {
    const parsed = ActionSchema.parse({
      id: "action-1",
      boardId: "board-1",
      cardId: "card-1",
      userId: "user-1",
      type: "futurePlankaAction",
      data: {},
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: null,
    });
    expect(parsed.type).toBe("futurePlankaAction");
  });
});

describe("getCommentsForCard", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockDelete.mockReset();
  });

  it("requests GET /api/cards/{id}/comments", async () => {
    mockGet.mockResolvedValue({
      items: [
        {
          id: "comment-1",
          cardId: "card-1",
          userId: "user-1",
          text: "Hello",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: null,
        },
      ],
      included: {
        users: [
          {
            id: "user-1",
            name: "Ada",
            username: "ada",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    const comments = await getCommentsForCard("card-1");

    expect(mockGet).toHaveBeenCalledWith("/api/cards/card-1/comments");
    expect(comments).toHaveLength(1);
    expect(comments[0].author).toEqual({
      id: "user-1",
      name: "Ada",
      username: "ada",
    });
  });

  it("appends beforeId for pagination", async () => {
    mockGet.mockResolvedValue({ items: [], included: { users: [] } });

    await getCommentsForCard("card-1", "comment-99");

    expect(mockGet).toHaveBeenCalledWith(
      "/api/cards/card-1/comments?beforeId=comment-99"
    );
  });
});

describe("getBoardMembers", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("excludes users without a board membership", async () => {
    mockGet.mockResolvedValue({
      item: {
        id: "board-1",
        projectId: "project-1",
        name: "Board",
        position: 65536,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      included: {
        lists: [],
        cards: [],
        labels: [],
        cardLabels: [],
        cardMemberships: [],
        boardMemberships: [
          {
            id: "bm-1",
            boardId: "board-1",
            userId: "user-member",
            role: "editor",
            canComment: null,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        taskLists: [],
        tasks: [],
        users: [
          {
            id: "user-member",
            name: "Member",
            username: "member",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "user-outsider",
            name: "Outsider",
            username: "outsider",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        attachments: [],
        customFieldGroups: [],
        customFields: [],
        customFieldValues: [],
      },
    });

    const members = await getBoardMembers("board-1");

    expect(members).toEqual([
      {
        id: "user-member",
        name: "Member",
        username: "member",
        boardMembershipId: "bm-1",
        role: "editor",
        canComment: null,
      },
    ]);
  });
});

describe("remove tools success counts", () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it("counts actual label removals and reports failures", async () => {
    mockDelete
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new PlankaNotFoundError("Resource", "label-missing"));

    const result = await removeCardLabelsTool.handler({
      cardId: "card-1",
      labelIds: ["label-ok", "label-missing"],
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.labelsRemoved).toBe(1);
    expect(payload.success).toBe(true);
    expect(payload.failures).toHaveLength(1);
    expect(payload.failures[0].labelId).toBe("label-missing");
    expect(result.isError).toBeUndefined();
  });

  it("sets isError when every member removal fails", async () => {
    mockDelete.mockRejectedValue(
      new PlankaNotFoundError("Resource", "user-missing")
    );

    const result = await removeCardMembersTool.handler({
      cardId: "card-1",
      userIds: ["user-a", "user-b"],
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.membersRemoved).toBe(0);
    expect(payload.success).toBe(false);
    expect(payload.failures).toHaveLength(2);
    expect(result.isError).toBe(true);
  });
});
