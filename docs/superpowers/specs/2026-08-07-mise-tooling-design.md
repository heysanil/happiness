# Pin tooling with mise; unify CI on Namespace runners

**Date:** 2026-08-07
**Status:** Approved

## Problem

Three separate issues, all rooted in unpinned or misdirected tooling:

1. **Runtimes are unpinned.** `oven-sh/setup-bun@v2` is used with no `bun-version`, so CI installs whatever Bun released most recently. Nothing pins Bun locally either.
2. **Local and CI disagree on Node.** CI pins Node 22 via `actions/setup-node@v4`; the maintainer's machine runs Node 24.19.0. Neither is recorded in the repo.
3. **Git hooks have never run.** `core.hooksPath` points at `.husky`, a directory that does not exist and is not tracked — a leftover from an unfinished husky→lefthook migration. `lefthook.yml` is configured but never invoked, so the pre-commit Biome check and commit-msg commitlint check are enforced only by CI.

Separately, `docs-sentinel.yml` still runs on GitHub-hosted runners while `e2e.yml` and `release.yml` already use Namespace.

## Design

### `mise.toml` (new)

```toml
[tools]
node = "24.19.0"
bun = "1.3.14"
lefthook = { version = "2.1.4", postinstall = 'test -n "$CI" || lefthook install' }
```

Exact pins, no version ranges and no `mise.lock`. Versions match what the maintainer's machine runs today, so the only environment that changes is CI (Node 22 → 24).

**Scope is deliberately narrow.** Only runtimes and standalone binaries belong here. Biome, Playwright, drizzle-kit, and commitlint stay npm dependencies pinned by `bun.lock`; duplicating them in `mise.toml` would create two sources of truth that can silently disagree.

`lefthook` is the exception that moves. It is a Go binary that npm merely wraps, nothing in the codebase imports it, and installing it via mise means git hooks work before `bun install` has ever run. It is held at 2.1.4 — the version `bun.lock` resolves today — so this change alters where lefthook comes from without altering which lefthook runs.

The `postinstall` field replaces the npm postinstall that would otherwise install git hooks, so a fresh clone needs only `mise install`. It is skipped when `$CI` is set, since git hooks never fire in CI.

This uses the tool-level `postinstall` field rather than a top-level `[hooks]` table. `[hooks]` is gated behind mise's `experimental` setting, which would have to be enabled repo-wide and changes unrelated mise behavior. The tool-level field is a stable API and its semantics are a closer match anyway — "after lefthook installs, install lefthook's hooks."

### `package.json` / `bun.lock`

Remove `"lefthook": "^2.1.4"` from `devDependencies` and regenerate the lockfile. `lefthook.yml` is unchanged — it shells out via `bunx` to commitlint and Biome, both of which remain npm dependencies.

### Workflows

In `e2e.yml` and `release.yml`, replace the `oven-sh/setup-bun@v2` and `actions/setup-node@v4` step pair with a single step:

```yaml
- name: Set up mise
  uses: jdx/mise-action@v4
```

The action reads `mise.toml` from the repo root and caches installed tools. Node moves from 22 to 24 as a consequence; the E2E suite validates it.

In `docs-sentinel.yml`, add `runner: namespace-profile-default` to the existing `with:` block. The workflow calls a reusable workflow, so `runs-on` cannot be set by the caller, but that workflow exposes a `runner` input (default `ubuntu-latest`). After this, all three workflows run on Namespace.

### Documentation

`README.md` gains mise as the first setup step. `CLAUDE.md` records the pinned versions and the narrow scope rule. Both files are in docs-sentinel's allowlist, so updating them here is preferable to letting the bot do it on the PR.

### Local git config

`core.hooksPath` is per-clone state and cannot be fixed by a commit. The unset command is run once on the maintainer's machine and documented in the README for anyone who cloned during the husky era:

```bash
git config --unset core.hooksPath
mise install
```

## Non-goals

- No `mise.lock`. Exact pins in `mise.toml` are sufficient for this project.
- No mise tasks. `package.json` scripts already serve this purpose.
- No new tools (actionlint and similar). Out of scope.
- No changeset. This is tooling-only with no runtime or user-facing impact.

## Verification

1. `mise install` resolves all three tools and installs git hooks.
2. `git config core.hooksPath` returns nothing; `.git/hooks/pre-commit` exists.
3. `bun install --frozen-lockfile` succeeds without lefthook in `devDependencies`.
4. `bun typecheck` and `bun lint` pass on Node 24.
5. `bun build` succeeds on Node 24.
6. CI: all three workflows run on Namespace and the E2E suite passes on Node 24.
