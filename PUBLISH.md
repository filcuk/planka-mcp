# Publishing

Package: **`@filcuk/planka-mcp`**. Publish to **npm** and **GitHub Packages** separately (`npm publish` does not publish to GitHub).

## First clone and initial publish

```bash
git clone https://github.com/filcuk/planka-mcp.git
cd planka-mcp
npm install
npm run lint
npm test
```

Confirm `package.json` uses `@filcuk/planka-mcp` and `repository.url` points at `filcuk/planka-mcp` (not the upstream fork).

Log in and publish:

```bash
npm login                    # npmjs.com
npm publish                  # npm (from this repo directory — see registry note)
npm run publish:github       # GitHub Packages — needs GitHub token in ~/.npmrc; see .npmrc.example
```

### Registry note

If your `~/.npmrc` sets `@filcuk:registry=https://npm.pkg.github.com`, scoped packages normally publish to GitHub — even with `npm publish` and no flags. This repo includes a project `.npmrc` that sets `@filcuk:registry=https://registry.npmjs.org`, so from this directory:

- `npm publish` or `npm run publish:npm` → **npm**
- `npm run publish:github` → **GitHub Packages**

## New version

```bash
npm version patch            # or minor / major
```

Also bump `server.json` and `src/index.ts` to the same version, then:

```bash
npm publish
npm run publish:github
git push && git push --tags
```

Alternatively, create a GitHub Release (or run the **Publish** workflow manually) to publish to **npm** and **GitHub Packages** via CI.

## CI publish (GitHub Actions)

The **Publish** workflow (`.github/workflows/publish.yml`) runs on release and `workflow_dispatch`. It publishes to both registries after `npm ci` and tests pass.

Add an npm **Automation** token as a repository secret:

1. [npmjs.com → Access Tokens](https://www.npmjs.com/settings/~tokens) → **Generate New Token** → **Granular Access Token** (or Classic **Automation**).
2. Grant **Read and write** for the `@filcuk` scope (or this package).
3. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → name: `NPM_TOKEN`, value: the token.

GitHub Packages uses the built-in `GITHUB_TOKEN` (no extra secret). If `NPM_TOKEN` is missing, the npm publish step fails.
