/**
 * Detect duplicate-resource errors from PLANKA API responses.
 */
import { PlankaError } from "../errors.js";

/**
 * Whether an error indicates the resource already exists (e.g. label/member already on card).
 * Prefers HTTP status (409/422), falls back to a lowercased message check.
 */
export function isAlreadyExistsError(error: unknown): boolean {
  if (error instanceof PlankaError) {
    if (error.status === 409 || error.status === 422) {
      return error.message.toLowerCase().includes("already");
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("already");
}
