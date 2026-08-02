import { describe, expect, it } from "vitest";
import { validateBearerToken } from "../src/http-auth.js";
import {
  createHttpServer,
  loadHttpServerConfig,
} from "../src/http-server.js";
import { IncomingMessage } from "node:http";

function mockRequest(authorization?: string): IncomingMessage {
  return {
    headers: authorization ? { authorization } : {},
  } as IncomingMessage;
}

describe("validateBearerToken", () => {
  const token = "secret-token";

  it("accepts a valid bearer token", () => {
    const result = validateBearerToken(
      mockRequest("Bearer secret-token"),
      token
    );
    expect(result).toEqual({ ok: true });
  });

  it("accepts bearer prefix case-insensitively", () => {
    const result = validateBearerToken(
      mockRequest("bearer secret-token"),
      token
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects missing Authorization header", () => {
    const result = validateBearerToken(mockRequest(), token);
    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Missing Authorization header",
    });
  });

  it("rejects invalid Authorization header format", () => {
    const result = validateBearerToken(mockRequest("Token secret-token"), token);
    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid Authorization header format",
    });
  });

  it("rejects wrong bearer token", () => {
    const result = validateBearerToken(
      mockRequest("Bearer wrong-token"),
      token
    );
    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid bearer token",
    });
  });
});

describe("loadHttpServerConfig", () => {
  it("requires MCP_AUTH_TOKEN", () => {
    expect(() =>
      loadHttpServerConfig({
        PLANKA_BASE_URL: "https://planka.example.com",
      })
    ).toThrow("MCP_AUTH_TOKEN");
  });

  it("loads defaults when MCP_AUTH_TOKEN is set", () => {
    const config = loadHttpServerConfig({
      MCP_AUTH_TOKEN: "test-token",
    });

    expect(config).toEqual({
      host: "0.0.0.0",
      port: 3000,
      path: "/mcp",
      authToken: "test-token",
    });
  });
});

describe("createHttpServer", () => {
  it("serves GET /health without auth", async () => {
    const server = createHttpServer({
      host: "127.0.0.1",
      port: 0,
      path: "/mcp",
      authToken: "secret",
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("rejects MCP requests without bearer token", async () => {
    const server = createHttpServer({
      host: "127.0.0.1",
      port: 0,
      path: "/mcp",
      authToken: "secret",
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
    });

    expect(response.status).toBe(401);

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});
