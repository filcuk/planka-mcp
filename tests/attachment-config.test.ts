import { describe, expect, it, afterEach } from "vitest";
import {
  DEFAULT_MAX_ATTACHMENT_MB,
  getMaxAttachmentBytes,
  getMaxAttachmentMb,
} from "../src/config/attachment-config.js";
import { PlankaConfigError } from "../src/errors.js";

const ENV_KEY = "PLANKA_MAX_ATTACHMENT_MB";

describe("attachment config", () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it("defaults to 15 MB", () => {
    expect(getMaxAttachmentMb({})).toBe(DEFAULT_MAX_ATTACHMENT_MB);
    expect(getMaxAttachmentBytes({})).toBe(15 * 1024 * 1024);
  });

  it("reads PLANKA_MAX_ATTACHMENT_MB from the environment", () => {
    expect(getMaxAttachmentMb({ [ENV_KEY]: "25" })).toBe(25);
    expect(getMaxAttachmentBytes({ [ENV_KEY]: "25" })).toBe(25 * 1024 * 1024);
  });

  it("rejects invalid values", () => {
    expect(() => getMaxAttachmentMb({ [ENV_KEY]: "0" })).toThrow(
      PlankaConfigError
    );
    expect(() => getMaxAttachmentMb({ [ENV_KEY]: "-5" })).toThrow(
      PlankaConfigError
    );
    expect(() => getMaxAttachmentMb({ [ENV_KEY]: "large" })).toThrow(
      PlankaConfigError
    );
    expect(() => getMaxAttachmentMb({ [ENV_KEY]: "10.5" })).toThrow(
      PlankaConfigError
    );
  });
});
