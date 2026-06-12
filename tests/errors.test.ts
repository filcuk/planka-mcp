import { describe, expect, it } from "vitest";
import {
  PlankaAuthError,
  PlankaNotFoundError,
  PlankaValidationError,
  createPlankaError,
  isPlankaError,
} from "../src/errors.js";

describe("createPlankaError", () => {
  it("maps 401 to PlankaAuthError", () => {
    const error = createPlankaError(401, { message: "Invalid credentials" });
    expect(error).toBeInstanceOf(PlankaAuthError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid credentials");
  });

  it("maps 404 to PlankaNotFoundError", () => {
    const error = createPlankaError(404, { message: "Missing" }, "card-1");
    expect(error).toBeInstanceOf(PlankaNotFoundError);
    expect(error.status).toBe(404);
  });

  it("maps 422 to PlankaValidationError with details", () => {
    const body = { message: "Invalid input", fields: ["name"] };
    const error = createPlankaError(422, body);
    expect(error).toBeInstanceOf(PlankaValidationError);
    expect(error.details).toEqual(body);
  });
});

describe("isPlankaError", () => {
  it("returns true for PlankaError instances", () => {
    expect(isPlankaError(new PlankaAuthError())).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isPlankaError(new Error("nope"))).toBe(false);
  });
});
