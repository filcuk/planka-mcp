# AGENTS.md

Guidance for LLM agents and contributors working on this repository.

This is **`@filcuk/planka-mcp`**, a Model Context Protocol server that exposes [PLANKA](https://planka.app) kanban boards as MCP tools. It is TypeScript, ESM-only, and targets Node >= 18.

For user-facing docs see [`README.md`](./README.md), for the technical rationale see [`DESIGN.md`](./DESIGN.md), and for release steps see [`PUBLISH.md`](./PUBLISH.md).

## Setup and commands

```bash
npm install
npm run build      # tsc -> dist/
npm run lint       # tsc --noEmit (this is the only linter)
npm run test:run   # vitest, single run
npm test           # vitest in watch mode — do not use in CI or agent runs
npm start          # run the stdio server from dist/
npm run start:http # run the HTTP server from dist/
```

Always finish a change with `npm run lint` and `npm run test:run`. There is no ESLint or Prettier config; formatting follows the existing files (2-space indent, double quotes, semicolons, trailing commas in multi-line literals).

Running the server locally requires `PLANKA_BASE_URL` plus either `PLANKA_API_KEY` or `PLANKA_AGENT_EMAIL`/`PLANKA_AGENT_PASSWORD`. Tests never hit a live PLANKA instance.

## Architecture

Layers are strictly one-directional: `tools -> operations -> client -> PLANKA API`, with `schemas` shared across all of them.

| Path | Responsibility |
|------|----------------|
| `src/index.ts` | stdio entrypoint (`planka-mcp` bin) |
| `src/http.ts` | Streamable HTTP entrypoint (`planka-mcp-http` bin) |
| `src/server.ts` | Shared MCP server factory, `SERVER_VERSION`, error mapping |
| `src/http-server.ts`, `src/http-auth.ts` | HTTP transport, `/health`, bearer-token auth |
| `src/client.ts` | Single `plankaClient` singleton: auth, retries, timeouts, JSON/form/binary requests |
| `src/config/` | Env parsing: client credentials, attachment cap, tool policy |
| `src/schemas/` | Zod schemas — `entities.ts` (API responses), `requests.ts` (tool inputs), `responses.ts` (envelopes) |
| `src/operations/` | One module per PLANKA resource; validates input, calls the client, parses responses |
| `src/tools/` | MCP tool definitions and JSON Schema; formats results as text content |
| `src/lib/` | Shared helpers (card formatting, custom field resolution, attachments, terms acceptance) |

Rules that keep this working:

- Tools never call `plankaClient` directly; they go through `src/operations/`.
- Operations never format MCP output; they return typed entities.
- Every PLANKA response is parsed with a Zod schema. Do not cast API responses to types.
- All imports use explicit `.js` extensions (ESM under `moduleResolution: node16`).

## Adding or changing a tool

1. Add or update the Zod input schema in `src/schemas/requests.ts`.
2. Add the API call in the matching `src/operations/*.ts` module.
3. Define the tool with `defineTool(category, definition)` in `src/tools/*.ts`, where category is `"read"`, `"modify"`, or `"delete"`.
4. Export it from the module's tool array and make sure that array is registered in `src/tools/index.ts`.
5. Update the tool table in `README.md` (and the tool count in the features list).

`defineTool` sets `defaultEnabled` from the category: `delete` tools are off by default. Pass `{ defaultEnabled: false }` explicitly for non-delete tools that should also be disabled in client config (for example `planka_modify_projects`).

Tool design conventions:

- Prefer one combined tool over several narrow ones. Modify tools take an `action` parameter (`"create" | "update"`) instead of shipping separate create/update tools.
- Keep handlers total: return `{ content: [...], isError: true }` for user-fixable problems rather than throwing.
- Return JSON via `JSON.stringify(payload, null, 2)` inside a single text content block.
- Tool names are `planka_*` and snake_case.

## Safety model

Destructive behaviour is gated twice, and both layers must stay in sync:

- **Client side**: `getDefaultDisabledToolNames()` drives the `disabledTools` list documented in `README.md`.
- **Server side**: `resolveToolCall()` rejects `delete`-category tools unless `PLANKA_ALLOW_DESTRUCTION` is `true`, `1`, or `yes`.

Never weaken these defaults, never make a destructive call from a `read` or `modify` tool, and never remove a tool from the README's disabled list without changing its category or `defaultEnabled`.

## Schemas and the PLANKA API

PLANKA returns `null` (not `undefined`) for many optional columns, and the API is not fully described by its Swagger document. When a field can be absent or null, use `.nullable().optional()`; a wrong assumption here breaks the whole tool call, since one bad field fails the entire parse.

Reference: [PLANKA Swagger](https://plankanban.github.io/planka/swagger-ui/swagger.json). When behaviour disagrees with the docs, trust the live API and add a short comment on the schema field explaining the observed shape.

## Tests

Vitest, with specs in `tests/*.test.ts`. Tests are unit-level and must not perform network calls; pass fake `env` objects into config helpers instead of mutating `process.env` globally (and clean up in `afterEach` when you must).

Cover new Zod schemas in `tests/schemas.test.ts`, config parsing in the matching `tests/*-config.test.ts`, and tool gating in `tests/tool-policy.test.ts`.

## Versioning and release

The version lives in four places and they must all match:

- `package.json` (`version`)
- `package-lock.json` (both the root `version` and `packages[""].version`)
- `server.json` (top-level `version` plus the `version` in each entry of `packages`)
- `src/server.ts` (`SERVER_VERSION`)

Follow semver: bug fixes are patch, new tools or transports are minor. Do not run `npm version` unless the user asks — it creates a commit and tag. Publishing steps live in [`PUBLISH.md`](./PUBLISH.md).

## Documentation

- `README.md` is user-facing: setup, env vars, tool tables. Keep it current but concise.
- `AGENTS.md` (this file) is for agents and contributors.
- `DESIGN.md` records technical design decisions.
- `PUBLISH.md` covers release and registry mechanics.

Update the README tool tables in the same change that adds, renames, or re-categorises a tool.

## Git conventions

Commit subjects are short and imperative ("Fix npm publishing", "Add npm workflow"). Do not commit unless the user explicitly asks. Do not commit `dist/`, `.env` files, or `.npmrc` with real tokens.
