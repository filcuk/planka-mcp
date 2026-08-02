/**
 * Bearer token authentication for the HTTP MCP transport.
 */
import type { IncomingMessage } from "node:http";

export type BearerAuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

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
  if (token !== expectedToken) {
    return { ok: false, status: 401, message: "Invalid bearer token" };
  }

  return { ok: true };
}
