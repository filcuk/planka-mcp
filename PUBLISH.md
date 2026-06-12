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
npm publish                  # npm
npm run publish:github       # GitHub Packages — needs ~/.npmrc; see .npmrc.example
```

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

Alternatively, create a GitHub Release to trigger the GitHub Packages workflow.
