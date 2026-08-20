# Contributing

## Setup

```sh
npm ci
```

## Making changes

This action is written in TypeScript under `src/` and bundled into `dist/index.js` with `@vercel/ncc`, since GitHub Actions runs a JavaScript action directly from a single file. `dist/` is committed to the repository.

Any change under `src/` must be followed by:

```sh
npm run build
```

and the resulting `dist/` output must be committed alongside the source change. CI rebuilds `dist/` from `src/` and fails the build if the two disagree, so a stale bundle will be caught before merge.

## Before opening a pull request

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. TypeScript runs in strict mode; do not introduce `any`.

## Commit style

This repository uses Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, and so on). Keep one logical change per commit.

## Scope

This action is a thin client for the `soroverify-verifier` API. It submits a contract source for verification, polls for a result, and reports it. It does not implement verification logic itself; changes that add verification behavior belong in `soroverify-verifier`, not here.
