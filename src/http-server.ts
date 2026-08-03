/**
 * Streamable HTTP server for remote PLANKA MCP access.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPlankaServer } from "./server.js";
import { validateBearerToken } from "./http-auth.js";

/** Cap JSON MCP request bodies (allows base64 file uploads up to the default attachment limit). */
export const MAX_JSON_BODY_BYTES = 32 * 1024 * 1024;

export class BodyTooLargeError extends Error {
  constructor() {
    super("Request body too large");
    this.name = "BodyTooLargeError";
  }
}

export interface HttpServerConfig {
  host: string;
  port: number;
  path: string;
  authToken: string;
}

function readEnv(name: string, env: NodeJS.ProcessEnv): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

export function loadHttpServerConfig(
  env: NodeJS.ProcessEnv = process.env
): HttpServerConfig {
  const authToken = readEnv("MCP_AUTH_TOKEN", env);
  if (!authToken) {
    throw new Error(
      "Missing required environment variable: MCP_AUTH_TOKEN (required for HTTP mode)"
    );
  }

  const portRaw = readEnv("MCP_PORT", env) ?? "3000";
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid MCP_PORT: ${portRaw}`);
  }

  const path = readEnv("MCP_PATH", env) ?? "/mcp";
  if (!path.startsWith("/")) {
    throw new Error(`Invalid MCP_PATH: ${path} (must start with /)`);
  }

  return {
    host: readEnv("MCP_HOST", env) ?? "0.0.0.0",
    port,
    path,
    authToken,
  };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_JSON_BODY_BYTES) {
      req.destroy();
      throw new BodyTooLargeError();
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw) as unknown;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function sendText(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(body);
}

async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: HttpServerConfig
): Promise<void> {
  const auth = validateBearerToken(req, config.authToken);
  if (!auth.ok) {
    sendText(res, auth.status, auth.message);
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = await readJsonBody(req);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      sendText(res, 413, "Request body too large");
      return;
    }
    sendJson(res, 400, {
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null,
    });
    return;
  }

  const server = createPlankaServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

export function createHttpServer(config: HttpServerConfig) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (url.pathname === config.path) {
      await handleMcpRequest(req, res, config);
      return;
    }

    sendText(res, 404, "Not found");
  });
}

export async function startHttpServer(config: HttpServerConfig) {
  const httpServer = createHttpServer(config);

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(config.port, config.host, () => resolve());
  });

  return httpServer;
}
