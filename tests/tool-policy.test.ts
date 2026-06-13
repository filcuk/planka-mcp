import { describe, expect, it, afterEach } from "vitest";
import { allTools, getToolDefinitions, resolveToolCall } from "../src/tools/index.js";
import {
  getDefaultDisabledToolNames,
  isDeleteToolBlocked,
  isDestructionAllowed,
} from "../src/config/tool-policy.js";

const ENV_KEY = "PLANKA_ALLOW_DESTRUCTION";

describe("tool policy", () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it("advertises all tools via listTools", () => {
    const definitions = getToolDefinitions();
    expect(definitions.length).toBe(allTools.length);
    expect(new Set(definitions.map((tool) => tool.name)).size).toBe(
      allTools.length
    );
  });

  it("lists delete and admin tools as default-disabled", () => {
    const disabled = getDefaultDisabledToolNames(allTools);

    expect(disabled).toContain("planka_delete_card");
    expect(disabled).toContain("planka_modify_projects");
    expect(disabled).toContain("planka_delete_board");
    expect(disabled).not.toContain("planka_create_card");
    expect(disabled).not.toContain("planka_get_board");
  });

  it("blocks delete tools server-side by default", () => {
    delete process.env[ENV_KEY];

    const blocked = resolveToolCall("planka_delete_card");
    expect(blocked).toEqual({
      error:
        'Delete tool "planka_delete_card" is blocked server-side. Set PLANKA_ALLOW_DESTRUCTION=true to enable destructive actions.',
    });

    const allowed = resolveToolCall("planka_create_card");
    expect(allowed).toHaveProperty("tool");
  });

  it("allows delete tools when PLANKA_ALLOW_DESTRUCTION is set", () => {
    process.env[ENV_KEY] = "true";

    const result = resolveToolCall("planka_delete_card");
    expect(result).toHaveProperty("tool");
  });

  it("parses truthy destruction env values", () => {
    expect(isDestructionAllowed({ PLANKA_ALLOW_DESTRUCTION: "true" })).toBe(true);
    expect(isDestructionAllowed({ PLANKA_ALLOW_DESTRUCTION: "1" })).toBe(true);
    expect(isDestructionAllowed({ PLANKA_ALLOW_DESTRUCTION: "yes" })).toBe(true);
    expect(isDestructionAllowed({})).toBe(false);
    expect(isDestructionAllowed({ PLANKA_ALLOW_DESTRUCTION: "false" })).toBe(false);
  });

  it("blocks only delete-category tools", () => {
    delete process.env[ENV_KEY];

    for (const tool of allTools) {
      expect(isDeleteToolBlocked(tool)).toBe(tool.category === "delete");
    }
  });
});

describe("tool metadata", () => {
  it("every registered tool has category and defaultEnabled consistent", () => {
    for (const tool of allTools) {
      expect(["read", "modify", "delete"]).toContain(tool.category);
      if (tool.category === "delete") {
        expect(tool.defaultEnabled).toBe(false);
      }
    }
  });

  it("has unique tool names", () => {
    const names = allTools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("default-disabled tool count matches metadata", () => {
    const disabled = getDefaultDisabledToolNames(allTools);
    const fromMetadata = allTools.filter((tool) => !tool.defaultEnabled);
    expect(disabled.length).toBe(fromMetadata.length);
  });

  it("default-disabled names are sorted and unique", () => {
    const disabled = getDefaultDisabledToolNames(allTools);
    expect(disabled).toEqual([...disabled].sort());
    expect(new Set(disabled).size).toBe(disabled.length);
  });
});
