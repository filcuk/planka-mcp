#!/usr/bin/env node
/**
 * PLANKA MCP Server (Streamable HTTP transport)
 *
 * Remote MCP endpoint for PLANKA kanban boards.
 */
import { loadHttpServerConfig, startHttpServer } from "./http-server.js";

async function main() {
  const config = loadHttpServerConfig();
  const httpServer = await startHttpServer(config);

  console.error(
    `PLANKA MCP HTTP server listening on http://${config.host}:${config.port}${config.path}`
  );

  const shutdown = () => {
    console.error("Shutting down HTTP server...");
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
