# Error code documentation

**Before adding, editing, or reviewing any `<code>.md` file in this directory, read [`guidelines.md`](./guidelines.md).** The rules on title/summary length, tone, and terminology are strict and not all obvious from reading existing entries.

## What this directory holds

The per-code files live in [`codes/`](./codes): one Markdown file per error code, named `<CODE>.md` (e.g. `40142.md`). Each file has YAML frontmatter (`code`, `identifier`, `title`, `summary`) and an optional Markdown body that provides the detail-page content beneath the title and summary. Title, summary, and body conventions are all covered in `guidelines.md`.

The set of files in `codes/` **is the registry** — the source of truth for which codes are valid and what they mean. `protocol/errors.json` is generated from it (a machine-readable map of each code to its `identifier`, `title`, and `summary`); never edit it by hand — run `npm run generate:errors`, which CI enforces via a drift check.

## Conventions at a glance

These are reminders, not substitutes for `guidelines.md`.

- **Filename = code.** `40142.md` must have `code: 40142` in frontmatter.
- **Identifier** — a stable `snake_case` name (`^[a-z][a-z0-9_]*$`), unique across the registry, the canonical basis for each SDK's generated constant. Name the cause not the consequence; concise but not cryptic; US spelling. A frozen contract — don't churn it, and don't derive it mechanically from the title.
- **Title** — 3–7 words (cap 10), short phrase or concise subject–verb clause (not necessarily a noun phrase), sentence case, no trailing punctuation, no error-code restatement. Specific enough that a reader can distinguish it from neighbouring errors at a glance.
- **Summary** — 15–40 words, one or two sentences, plain language. Describe what happened, then (when known) why it might have happened. Don't prescribe remediation — no "Check…", "Verify…", "Retry…". Generic phrasing — the summary represents *every* occurrence of the code, so avoid deictic ("this token", "your channel"); prefer "the token", "the channel". No Markdown formatting, stack traces, or internal identifiers.
- **Body** (optional) — detail-page content beneath the title and summary. Don't restate either. Order: *What you should do* (lead with the triage — including when the answer is "nothing", for transient/self-healing errors) → *Why it happens* (causes in the reader's terms, each with its fix) → *What you'll see* (message string(s) and status, last, as a findability aid). Link out to feature docs for how-to; no inline code samples. No "related errors" section — disambiguate inline only when codes are genuinely confusable. Describe generically, instruct in second person.
- **YAML quoting** — single-line summaries don't need quoting unless they start with a special character (`:`, `-`, `[`, `{`, `#`, `&`, `*`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``). In that case wrap the whole summary in double quotes.
- **Terminology** — use the customer-facing terms from the [Dictionary of terms](https://ably.atlassian.net/wiki/spaces/devex/pages/4295262228/Dictionary+of+terms). Common substitutions: *Region* not site/datacenter; *Ably Pub/Sub JavaScript SDK* not client library; *Integration* not Reactor/Firehose/integration rule ("rule" now means a namespace rule); *namespace* / *namespace settings* not "channel rule"; *Token / Basic authentication* not key authentication; *Connection state recovery* not stream resume.
- **Tone** — plain, calm, specific. Treat copy as product copy, not log messages. Aim for a single consistent voice across the whole directory.

## Publishing to the docs site

Edits here are not live on [ably.com/docs](https://ably.com/docs/platform/errors/codes) until they are pulled into the docs site, which vendors this registry as a git submodule. After a change merges to `main`, publishing it is a separate PR against [`ably/docs`](https://github.com/ably/docs): bump the `ably-common` submodule (usually to `main`), run `yarn generate:errors`, and commit the regenerated `src/pages/docs/platform/errors/codes/` pages alongside the bump. The `ably/docs` `check-error-docs` CI regenerates and diffs, so out-of-sync pages fail the build. Example: [ably/docs#3496](https://github.com/ably/docs/pull/3496). See [`README.md`](./README.md#publishing-to-the-docs-site) for the full steps.

## Reviewing a change

1. Read the table view in your head — does the title disambiguate this error from neighbours? Does the summary stand alone?
2. Open two or three existing files side-by-side and check that tone, length, and structure match.
3. Check that the filename matches `code:` and that required fields are present.
