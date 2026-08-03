/**
 * Bearer token authentication for the HTTP MCP transport.
 */
import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type BearerAuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

function tokensEqual(actual: string, expected: string): boolean {
  const actualBuf = Buffer.from(actual);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Validate the Authorization header against the expected bearer token.
 */
export function validateBearerToken(
  req: IncomingMessage,
  expectedToken: string
): BearerAuthResult {
  const header = req.headers.authorization;
  if (!header) {
    return { ok: false, status: 401, message: "Missing Authorization header" };
  }

  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return {
      ok: false,
      status: 401,
      message: "Invalid Authorization header format",
    };
  }

  const token = match[1];
  if (!tokensEqual(token, expectedToken)) {
    return { ok: false, status: 401, message: "Invalid bearer token" };
  }

  return { ok: true };
}
