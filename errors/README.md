# Error documentation

This directory is the canonical registry of Ably's error codes and their customer-facing documentation. It is the source of truth for both **which codes are valid** and **what each one means**, used across the wider Ably stack. The registry lives in [`codes/`](./codes) — one Markdown file per valid code — so "is code X valid?" is answered by "does `codes/<code>.md` exist?".

## Registering a new error code

To register a new code, create a Markdown file at `codes/<code>.md` (the filename must be the numeric code, e.g. `codes/40010.md`). It must start with YAML frontmatter containing four required fields:

```markdown
---
code: 40010
identifier: invalid_channel_name
title: Invalid channel name
summary: The channel name in the request was not valid, for example because it was empty, contained characters that are not permitted, or used an unknown square-bracketed prefix.
---
```

- **`code`** — the numeric error code. Must match the filename.
- **`identifier`** — a stable, unique `snake_case` name for the code, e.g. `invalid_channel_name`.
- **`title`** — a short phrase identifying the error at a glance (aim for 3–7 words), e.g. `Invalid channel name`.
- **`summary`** — one or two plain-language sentences (roughly 15–40 words) covering what happened and, when known, why.

You can add an optional Markdown body beneath the frontmatter for detail-page content (what to do, why it happens). Don't touch `protocol/errors.json` — it is generated from these files; run `npm run generate:errors` to regenerate it after adding or editing a code.

See [`guidelines.md`](./guidelines.md) for the full rules on title, summary, body, tone, and terminology, and run `npm run validate:errors` to check your entry (CI runs both, and fails if `errors.json` is out of date).

## Generating SDK constants

The registry also drives the error-code constants used by the JavaScript SDKs, so that every SDK refers to a code by the same name and adding a code is a single step: register it here, then use it wherever you're working. `identifier` is the canonical basis for each generated name — `room_is_in_an_invalid_state` becomes `RoomIsInAnInvalidState` — which is why it's a frozen contract rather than something to churn.

```sh
npm run generate:errorcodes-ts -- --format=type  --out path/to/errorcodes.ts   # union of numeric literals
npm run generate:errorcodes-ts -- --format=const --out path/to/errorcodes.ts   # one export const per code
```

Use `--format=type` where you only want compile-time checking (the type erases, so it costs no bundle size) and `--format=const` where you need the values at runtime. Omit `--out` to write to stdout. The output is deterministic and has no dependencies beyond Node's standard library, so a consuming repository can generate from its vendored submodule without running `npm install` inside it.

Generated output is not committed here. Each consuming repository generates it, commits the result into its own `src/`, and has a CI step that regenerates at the pinned submodule commit and fails on a diff — the same arrangement as [publishing to the docs site](#publishing-to-the-docs-site) below. Because the check runs at the *pinned* commit, an SDK can't merge a reference to a code that hasn't been merged here first.

## Publishing to the docs site

Changes here don't reach [ably.com/docs](https://ably.com/docs/platform/errors/codes) automatically. The docs site vendors this registry as a git submodule and generates its public error pages from it, so once your change is merged to `main` a follow-up PR against [`ably/docs`](https://github.com/ably/docs) is needed to publish it:

1. Bump the `ably-common` submodule to the commit to publish (usually `main`).
2. Regenerate the pages: `yarn generate:errors`.
3. Commit the regenerated `src/pages/docs/platform/errors/codes/` output alongside the submodule bump, and open the docs PR.

CI in `ably/docs` (`check-error-docs`) regenerates and diffs, so a PR whose committed pages are out of sync with the bumped registry fails. See [ably/docs#3496](https://github.com/ably/docs/pull/3496) for a worked example.

## What's in this directory

- [`codes/`](./codes) — the registry: one `<CODE>.md` per valid code.
- [`guidelines.md`](./guidelines.md) — how to write entries: rules on title, summary, body, tone, and terminology.
- [`CLAUDE.md`](./CLAUDE.md) — guidance for agents adding, editing, or reviewing entries.
- [`scripts/`](./scripts) — the validator run in CI, and the generators for `protocol/errors.json` and the SDK TypeScript constants.

`protocol/errors.json` is generated from this registry — a machine-readable map of each code to its `identifier`, `title`, and `summary`. It must not be edited by hand; run `npm run generate:errors` to regenerate it, and CI fails if the committed file is out of date.
