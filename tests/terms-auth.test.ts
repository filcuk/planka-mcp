import { describe, expect, it } from "vitest";
import {
  extractTermsAcceptancePayload,
  isTermsAcceptanceRequired,
} from "../src/lib/terms-auth.js";

describe("extractTermsAcceptancePayload", () => {
  it("reads pendingToken from termsAcceptanceRequired wrapper", () => {
    const payload = extractTermsAcceptancePayload({
      termsAcceptanceRequired: {
        pendingToken: "pending.jwt.token",
        message: "Terms acceptance required",
      },
    });

    expect(payload?.pendingToken).toBe("pending.jwt.token");
  });

  it("reads pendingToken from top-level body", () => {
    const payload = extractTermsAcceptancePayload({
      pendingToken: "pending.jwt.token",
      message: "Terms acceptance required",
    });

    expect(payload?.pendingToken).toBe("pending.jwt.token");
  });
});

describe("isTermsAcceptanceRequired", () => {
  it("returns true for 403 with nested pending token", () => {
    expect(
      isTermsAcceptanceRequired(403, {
        termsAcceptanceRequired: { pendingToken: "abc" },
      })
    ).toBe(true);
  });

  it("returns true for 403 with message only", () => {
    expect(
      isTermsAcceptanceRequired(403, {
        message: "Terms acceptance required",
      })
    ).toBe(true);
  });

  it("returns false for other statuses", () => {
    expect(isTermsAcceptanceRequired(401, { message: "Invalid credentials" })).toBe(
      false
    );
  });
});
