import { describe, expect, it } from "vitest";
import {
  CreateCardSchema,
  UpdateCardSchema,
  UpdateListSchema,
  UpdateTaskSchema,
  UpdateTaskListSchema,
  SearchCardsSchema,
  CreateFileAttachmentSchema,
} from "../src/schemas/requests.js";
import { CardSchema, StopwatchSchema } from "../src/schemas/entities.js";
import { resolveCustomFieldIds } from "../src/lib/custom-fields.js";
import { getAttachmentUrl } from "../src/lib/attachments.js";
import { decodeBase64ToBlob } from "../src/operations/attachments.js";

describe("CreateCardSchema", () => {
  it("defaults card type to project", () => {
    const parsed = CreateCardSchema.parse({
      listId: "list-1",
      name: "Test card",
    });
    expect(parsed.type).toBe("project");
  });

  it("accepts story card type", () => {
    const parsed = CreateCardSchema.parse({
      listId: "list-1",
      name: "Story",
      type: "story",
    });
    expect(parsed.type).toBe("story");
  });

  it("accepts optional position", () => {
    const parsed = CreateCardSchema.parse({
      listId: "list-1",
      name: "Test card",
      position: 0,
    });
    expect(parsed.position).toBe(0);
  });
});

describe("UpdateCardSchema", () => {
  it("maps agent-friendly closed and due fields", () => {
    const parsed = UpdateCardSchema.parse({
      isClosed: true,
      isDueCompleted: false,
      coverAttachmentId: "att-1",
    });
    expect(parsed.isClosed).toBe(true);
    expect(parsed.isDueCompleted).toBe(false);
    expect(parsed.coverAttachmentId).toBe("att-1");
  });

  it("accepts subscription and stopwatch fields", () => {
    const parsed = UpdateCardSchema.parse({
      isSubscribed: true,
      stopwatch: { startedAt: "2024-01-01T00:00:00.000Z", total: 120 },
    });
    expect(parsed.isSubscribed).toBe(true);
    expect(parsed.stopwatch?.total).toBe(120);
  });
});

describe("CardSchema", () => {
  it("parses Planka 2.0 card response fields", () => {
    const parsed = CardSchema.parse({
      id: "card-1",
      boardId: "board-1",
      listId: "list-1",
      name: "Card",
      description: null,
      position: 65536,
      type: "project",
      dueDate: null,
      isDueCompleted: false,
      isClosed: true,
      listChangedAt: "2024-01-02T00:00:00.000Z",
      coverAttachmentId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    expect(parsed.isClosed).toBe(true);
    expect(parsed.isDueCompleted).toBe(false);
    expect(parsed.listChangedAt).toBe("2024-01-02T00:00:00.000Z");
  });
});

describe("UpdateListSchema", () => {
  it("accepts list color updates", () => {
    const parsed = UpdateListSchema.parse({ color: "lagoon-blue" });
    expect(parsed.color).toBe("lagoon-blue");
  });

  it("accepts list type updates", () => {
    const parsed = UpdateListSchema.parse({ type: "closed" });
    expect(parsed.type).toBe("closed");
  });
});

describe("UpdateTaskSchema", () => {
  it("accepts assignee and position", () => {
    const parsed = UpdateTaskSchema.parse({
      assigneeUserId: "user-1",
      position: 131072,
    });
    expect(parsed.assigneeUserId).toBe("user-1");
    expect(parsed.position).toBe(131072);
  });

  it("accepts linkedCardId", () => {
    const parsed = UpdateTaskSchema.parse({ linkedCardId: "card-2" });
    expect(parsed.linkedCardId).toBe("card-2");
  });
});

describe("UpdateTaskListSchema", () => {
  it("accepts checklist display options", () => {
    const parsed = UpdateTaskListSchema.parse({
      showOnFrontOfCard: true,
      hideCompletedTasks: false,
    });
    expect(parsed.showOnFrontOfCard).toBe(true);
    expect(parsed.hideCompletedTasks).toBe(false);
  });
});

describe("SearchCardsSchema", () => {
  it("accepts pagination cursors", () => {
    const parsed = SearchCardsSchema.parse({
      listId: "list-1",
      beforeListChangedAt: "2024-01-01T00:00:00.000Z",
      beforeId: "card-99",
    });
    expect(parsed.beforeId).toBe("card-99");
  });
});

describe("StopwatchSchema", () => {
  it("parses stopwatch payload", () => {
    const parsed = StopwatchSchema.parse({
      startedAt: "2024-01-01T00:00:00.000Z",
      total: 60,
    });
    expect(parsed.total).toBe(60);
  });
});

describe("CreateFileAttachmentSchema", () => {
  it("rejects files over 5 MB", () => {
    const large = Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64");
    expect(() =>
      CreateFileAttachmentSchema.parse({
        cardId: "card-1",
        name: "big.bin",
        fileBase64: large,
      })
    ).toThrow();
  });
});

describe("decodeBase64ToBlob", () => {
  it("decodes base64 to blob", () => {
    const blob = decodeBase64ToBlob(Buffer.from("hello").toString("base64"), "text/plain");
    expect(blob.type).toBe("text/plain");
    expect(blob.size).toBe(5);
  });
});

describe("resolveCustomFieldIds", () => {
  it("resolves field by name", () => {
    const result = resolveCustomFieldIds(
      "Priority",
      [],
      [
        {
          id: "field-1",
          customFieldGroupId: "group-1",
          baseCustomFieldGroupId: null,
          position: 65536,
          name: "Priority",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      []
    );
    expect(result).toEqual({
      customFieldId: "field-1",
      customFieldGroupId: "group-1",
    });
  });
});

describe("getAttachmentUrl", () => {
  it("extracts URL from link attachments", () => {
    const url = getAttachmentUrl({
      id: "att-1",
      cardId: "card-1",
      type: "link",
      data: { url: "https://example.com/doc" },
      name: "Doc",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    expect(url).toBe("https://example.com/doc");
  });
});
