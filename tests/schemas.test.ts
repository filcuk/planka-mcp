import { describe, expect, it } from "vitest";
import {
  CreateCardSchema,
  UpdateCardSchema,
  UpdateListSchema,
  UpdateTaskSchema,
} from "../src/schemas/requests.js";
import { CardSchema } from "../src/schemas/entities.js";
import { resolveCustomFieldIds } from "../src/lib/custom-fields.js";
import { getAttachmentUrl } from "../src/lib/attachments.js";

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
      coverAttachmentId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    expect(parsed.isClosed).toBe(true);
    expect(parsed.isDueCompleted).toBe(false);
  });
});

describe("UpdateListSchema", () => {
  it("accepts list color updates", () => {
    const parsed = UpdateListSchema.parse({ color: "lagoon-blue" });
    expect(parsed.color).toBe("lagoon-blue");
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
