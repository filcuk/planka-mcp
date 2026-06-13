import { describe, expect, it } from "vitest";
import { allTools, getToolDefinitions } from "../src/tools/index.js";
import { getDefaultDisabledToolNames } from "../src/config/tool-policy.js";

describe("tool policy", () => {
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
