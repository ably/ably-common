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

## What's in this directory

- [`codes/`](./codes) — the registry: one `<CODE>.md` per valid code.
- [`guidelines.md`](./guidelines.md) — how to write entries: rules on title, summary, body, tone, and terminology.
- [`CLAUDE.md`](./CLAUDE.md) — guidance for agents adding, editing, or reviewing entries.
- [`scripts/`](./scripts) — the validator run in CI.

`protocol/errors.json` is generated from this registry — a machine-readable map of each code to its `identifier`, `title`, and `summary`. It must not be edited by hand; run `npm run generate:errors` to regenerate it, and CI fails if the committed file is out of date.
