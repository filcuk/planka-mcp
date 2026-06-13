/**
 * Helpers for PLANKA terms acceptance during login.
 */

export interface TermsAcceptancePayload {
  pendingToken: string;
  message?: string;
}

/**
 * Extract pending token from a failed login response body.
 */
export function extractTermsAcceptancePayload(
  body: unknown
): TermsAcceptancePayload | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const nested = record.termsAcceptanceRequired;

  if (typeof nested === "object" && nested !== null) {
    const pendingToken = (nested as Record<string, unknown>).pendingToken;
    if (typeof pendingToken === "string" && pendingToken.length > 0) {
      return {
        pendingToken,
        message:
          typeof (nested as Record<string, unknown>).message === "string"
            ? String((nested as Record<string, unknown>).message)
            : undefined,
      };
    }
  }

  if (typeof record.pendingToken === "string" && record.pendingToken.length > 0) {
    return {
      pendingToken: record.pendingToken,
      message:
        typeof record.message === "string" ? record.message : undefined,
    };
  }

  return undefined;
}

export function isTermsAcceptanceRequired(
  status: number,
  body: unknown
): boolean {
  if (status !== 403) {
    return false;
  }

  if (extractTermsAcceptancePayload(body)) {
    return true;
  }

  if (typeof body === "object" && body !== null && "message" in body) {
    return String((body as Record<string, unknown>).message).includes(
      "Terms acceptance required"
    );
  }

  return false;
}
