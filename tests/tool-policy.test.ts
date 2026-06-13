import { afterEach, describe, expect, it } from "vitest";
import { allTools } from "../src/tools/index.js";
import {
  getEnabledTools,
  isDestructiveEnabled,
  isToolEnabled,
} from "../src/config/tool-policy.js";

const originalEnv = process.env.PLANKA_ENABLE_DESTRUCTIVE;

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.PLANKA_ENABLE_DESTRUCTIVE;
  } else {
    process.env.PLANKA_ENABLE_DESTRUCTIVE = originalEnv;
  }
});

describe("tool policy", () => {
  it("hides delete tools by default", () => {
    delete process.env.PLANKA_ENABLE_DESTRUCTIVE;

    const enabled = getEnabledTools(allTools);
    const enabledNames = new Set(enabled.map((tool) => tool.name));

    expect(enabledNames.has("planka_delete_card")).toBe(false);
    expect(enabledNames.has("planka_create_card")).toBe(true);
    expect(enabled.every((tool) => tool.category !== "delete")).toBe(true);
  });

  it("enables delete tools when PLANKA_ENABLE_DESTRUCTIVE is truthy", () => {
    process.env.PLANKA_ENABLE_DESTRUCTIVE = "true";

    expect(isDestructiveEnabled()).toBe(true);

    const enabled = getEnabledTools(allTools);
    const enabledNames = new Set(enabled.map((tool) => tool.name));

    expect(enabledNames.has("planka_delete_card")).toBe(true);
    expect(enabled.length).toBe(allTools.length);
  });

  it("accepts 1 and yes as truthy destructive flags", () => {
    process.env.PLANKA_ENABLE_DESTRUCTIVE = "yes";
    expect(isDestructiveEnabled()).toBe(true);

    process.env.PLANKA_ENABLE_DESTRUCTIVE = "1";
    expect(isDestructiveEnabled()).toBe(true);
  });
});

describe("tool metadata", () => {
  it("every registered tool has category and defaultEnabled consistent", () => {
    for (const tool of allTools) {
      expect(["read", "modify", "delete"]).toContain(tool.category);
      if (tool.category === "delete") {
        expect(tool.defaultEnabled).toBe(false);
        expect(isToolEnabled(tool)).toBe(isDestructiveEnabled());
      } else {
        expect(tool.defaultEnabled).toBe(true);
        expect(isToolEnabled(tool)).toBe(true);
      }
    }
  });

  it("has unique tool names", () => {
    const names = allTools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
