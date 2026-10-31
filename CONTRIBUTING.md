# Contributing

This repo is a static site in `public/` plus Node ESM Netlify Functions in
`netlify/functions/`, build scripts in `scripts/`, and `node:test` tests in
`tests/`.

## The gate

Run `npm run check` before you push or open a pull request. It must pass. It runs:

1. `biome check .`: formatting and lint (Biome, recommended rules, config in `biome.json`).
2. `node scripts/check-syntax.mjs`: `node --check` on every `.mjs` file in
   `netlify/functions/`, `scripts/`, and `tests/`.
3. `node --test`: the test suite.

The gate runs locally only. The Netlify build runs only
`node scripts/write-version.mjs`, so it does not lint or test.

## Commands

```sh
npm ci            # install exact dependencies from package-lock.json
npm run format    # format files in place (biome format --write .)
npm run lint      # lint only (biome lint .)
npm run check     # the full gate: format + lint check, syntax check, tests
npm test          # tests only (node --test)
```

To apply Biome's safe fixes, run `npx biome check --write .`. Review any
unsafe fix by hand before you apply it.

## Tests

New code needs tests. Put them in `tests/` as `*.test.mjs` files that use
`node:test` and `node:assert/strict`. Keep logic in pure, exported functions
so you can test it without the network or a Netlify runtime.
