# Error documentation guidelines

This directory contains the user-facing documentation for each error code in the system. Each error has its own file, and the contents are used to render both the **table view** (a scannable list of errors) and the **detail page** (a dedicated page for a single error) in the UI.

These guidelines cover how to write error entries and how the source files are structured.

## File layout

- One file per error code, named `<CODE>.md` (e.g. `40142.md`).
- The filename must match the `code` field in the frontmatter exactly.
- Files live in the [`codes/`](./codes) subdirectory; nothing there is loaded recursively.

## File format

Each file is a Markdown document with YAML frontmatter:

```markdown
---
code: 40142
identifier: token_expired
title: Token expired
summary: The client's connection or request was rejected because the authentication token had expired. Each token has an expiry time that is set when it is issued.
---
```

### Frontmatter fields

| Field | Required | Description |
|---|---|---|
| `code` | Yes | The error code. Must match the filename. |
| `identifier` | Yes | A stable `snake_case` name, unique across the registry, used as the canonical basis for the constant each SDK generates. See [Choosing an identifier](#choosing-an-identifier). |
| `title` | Yes | A short noun phrase describing the error. See [Writing titles](#writing-titles). |
| `summary` | Yes | A one or two sentence plain-prose summary. See [Writing summaries](#writing-summaries). |

A Markdown body is permitted below the frontmatter and provides the detail-page content beneath the title and summary — whether the reader needs to act, why the error happens, and how to resolve it. See [Writing the body](#writing-the-body).

## How the source maps to the UI

The same file feeds two surfaces:

**Table view.** Renders `code`, `title`, and `summary` as a row.

**Detail page.** Renders the title as the page heading, the summary as a lede paragraph beneath it, and the body (if present) beneath that.

This is why the summary lives in frontmatter rather than as a body section: it has strict rules (length, plain prose, no formatting) and is reused across both views.

## Choosing an identifier

The `identifier` is the machine-facing name for the code: SDKs generate a constant from it (transformed into each language's idiom — `SCREAMING_SNAKE`, `PascalCase`, and so on). Unlike the title, which is prose for humans and may be reworded, the identifier is a **stable contract** — once published, changing it breaks every SDK that generates from it, so choose it carefully and don't churn it.

- **`snake_case`, matching `^[a-z][a-z0-9_]*$`**, and unique across the registry.
- **Name the cause, not the consequence.** For `80007` prefer `connection_message_limit_exceeded` over `connection_continuity_lost` — the limit is why it happened; the continuity loss is just the effect.
- **Concise but not cryptic.** Aim to keep it readable at a glance; avoid both cryptic abbreviations (`conn`, `creds`) and restating the whole title as a sentence.
- **Spell words out and use US spelling**, consistent with the title and summary (`unrecognized`, not `unrecognised`).
- **Don't derive it mechanically from the title.** The title can change; the identifier can't. Set it deliberately.

## Writing titles

The title's job is to let a user decide, in under a second, whether this error is the one they care about.

- **Lead with what happened, from the user's perspective.** "Connection refused by server" beats "ECONNREFUSED returned."
- **Keep it short.** Aim for 3–7 words; hard cap at 10. If you can't fit the meaning, the summary is where the detail goes.
- **Prefer short phrases; a concise subject–verb clause is fine.** Titles don't have to be strict noun phrases — "Connection disconnected", "Integration invocation failed", and "Token expired" all read well. Avoid long, fully-punctuated sentences and second-person phrasing: "Token expired", not "Your token has expired."
- **Be specific enough to disambiguate.** If three errors could honestly be titled "Authentication failed," the titles aren't doing their job. Prefer "Token expired", "Invalid credentials", "Account locked"
- **Use sentence case.** "Token expired", not "Token Expired" or "TOKEN EXPIRED".
- **No trailing punctuation.**
- **Don't restate the code.** The code is shown alongside the title; "40142 error" is wasted space.

## Writing summaries

The summary's job is to give a user who's interested enough to stop scanning the next layer of understanding — what the error means and (when known) why it might have happened.

- **One or two sentences, roughly 15–40 words.** Long enough to be useful, short enough that the table doesn't become a wall of text.
- **Cover what happened, then why it might have happened.** A useful template: *"[What happened in plain language]. [Why it might have happened, or under what conditions]."* For example: "Publishing failed because the connection was suspended. Connections become suspended after being disconnected for around two minutes." Only add the second sentence when it genuinely adds a cause or condition. If it would merely restate the first in different words, leave it out — a single precise sentence beats a padded pair.
- **Don't prescribe remediation.** Imperatives like "Check…", "Verify…", "Retry…", "Sign in again…" presume a specific reader posture and read poorly in a table that one error code stands in for many occurrences of.
- **Write in plain language.** Assume the reader knows their domain but not your internal terminology. "The request was rejected because the signature didn't match" beats "HMAC validation failed against the canonical request."
- **Be concrete about cause when you know it; be honest when you don't.** "This usually happens when..." is fine. Don't invent certainty.
- **Avoid blame-y phrasing.** "The request was missing a required field" lands better than "You sent an invalid request." Passive voice is your friend here.
- **Write generically; the summary represents every occurrence.** Summaries appear in a table where one row stands in for many instances of the same code. Avoid deictic phrasing like "this token" or "your channel" that points at a single instance. Prefer generic references — "the token", "the channel", "the supplied attach point" — that read correctly regardless of which occurrence the reader has in front of them.
- **Don't repeat the title.** If the title is "Token expired," don't start with "Your token has expired." Start with the next useful piece of information.
- **No Markdown formatting.** Summaries render in table cells as plain text.
- **No error codes, stack traces, or internal identifiers** unless they're directly actionable for the user.

### A note on YAML quoting

Single-line summaries in YAML almost never need quoting. Just write the sentence after the `summary:` key. The exception is when the summary starts with a special character (`:`, `-`, `[`, `{`, `#`, `&`, `*`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``) — in that case, wrap the whole summary in double quotes:

```yaml
summary: "'Bearer' prefix missing from the Authorization header. Add it and retry."
```

## Writing the body

The body is optional but recommended for any error a customer is likely to land on. It renders on the **detail page only**, beneath the title and summary — so it is written for someone who has already read both and wants the next layer: what to do about it.

Because the title and summary come first, the body's overriding rule is:

- **Don't restate the title or summary.** The reader has just read "what happened." Open with the next useful thing, not a recap.

### Structure

Use this small, consistent set of sections. Use only the ones that apply, and omit a section rather than padding it.

1. **What you should do.** Open with the action itself — the reader already has the "what" and "why it might have happened" from the summary, so don't re-establish that context before getting to the fix. Lead with what to do — including when the answer is *nothing*: if the error is expected, transient, or self-healing, say so plainly and explain how to tell that case from one that needs fixing. If an error is always a hard failure, the answer is simply the fix. Save the "why" for *Why it happens*; state only the action here, plus the minimum caveat the reader needs to act (e.g. "this is permanent, so don't wait for it to clear").
2. **Why it happens.** The realistic causes, in the reader's terms — their configuration, their actions, their environment — not where the code is raised internally. Where a cause has a fix of its own, give it here; a fix shared across causes belongs once in *What you should do*. Where a fix is "use the feature correctly", link to that feature's documentation; **don't inline code samples** (see the rules below).
3. **What you'll see.** Last, and only as a findability aid: the fixed wording of the message(s), and the HTTP status. Quote only the stable parts — many messages also carry runtime detail (the channel, the observed rate) that varies between occurrences. This helps someone searching for the text they saw; it is of little use to someone already reading, which is why it goes at the bottom.

### Rules

- **Describe generically; instruct in second person.** When describing the error or its causes, keep the generic, non-deictic phrasing summaries use — "the token", not "your token" — because the page stands for every occurrence. When telling the reader what to do, second person is natural: "configure your client with `authCallback`".
- **Don't inline code samples.** Examples of how to use a feature belong in that feature's documentation, where a customer can find them *before* they hit an error — link there instead. If there is no doc to link to, that is a general documentation gap: raise it (e.g. open an issue) rather than papering over it with a one-off snippet here.
- **Link out for how-to; keep the page about the error.** The body explains the error and points at the fix; it is not a tutorial. Link to maintained values (limits, durations) rather than restating them, so the page can't drift.
- **Weave links into the prose.** Link the words that name the thing — "enable [persistence](...)", "[around two minutes](...)" — rather than appending a separate "(see ...)" aside. The sentence should still read naturally if the link markup were stripped out.
- **Verify facts against their source; don't cite it.** Check message strings, status codes, and limits against the raising code before writing them — never from memory. Those are how you verify, not what you link: the page links only to customer-facing docs. Confirm those links resolve.
- **Tight, not exhaustive.** Include only what serves the decision and the fix. A good body is often three or four short paragraphs.
- **Terminology and tone** follow the same rules as every other field — use the [Dictionary of terms](https://ably.atlassian.net/wiki/spaces/devex/pages/4295262228/Dictionary+of+terms), and keep the voice plain and calm.

[`40142.md`](./40142.md) is a complete worked example of a title, summary, and body together.

## Terminology

Use the customer-facing terms from the internal [Dictionary of terms](https://ably.atlassian.net/wiki/spaces/devex/pages/4295262228/Dictionary+of+terms). The dictionary is the source of truth; the table below highlights the substitutions that come up most often in error copy. Don't take wording from the error's internal message string or the code that raises it — use those to understand the error, then name it as customers would.

| Use | Don't use | Notes |
|---|---|---|
| Region | Site, datacenter, cluster | The geographic AWS location that a resource runs in (e.g. `eu-west-1`). "Site" and "cluster" are internal infrastructure concepts and should almost never appear in customer-facing copy. |
| Ably [Product] [Language] SDK | Client library, ably-js | E.g. "Ably Pub/Sub JavaScript SDK". |
| Ably Platform | Data Streaming Network, DSN | The technology and infrastructure that delivers the Ably Service. |
| Connection state recovery | Stream resume | Plain "resume" is fine for resuming a connection — only "stream resume" is disallowed. |
| Token authentication, Basic authentication | Key authentication | |
| Inbound / Outbound webhook | Incoming / Outgoing webhook | |
| Integration | Reactor, Firehose, Integration rule | "Rule" now refers to channel rules (per-namespace settings), a different concept; don't call an integration a rule. |
| Ably error code | Error code | When referring to a code in this documentation, qualify it. |

If you need a term that isn't covered here, check the dictionary before inventing one.

## Tone, across all fields

- **Plain, calm, and specific.** The reader is often stressed, in a hurry, or unfamiliar with the system. Optimize for them.
- **US spelling.** Per the Ably documentation style guide, use US spelling throughout — every field, including the body (`color`, `behavior`, `canceled`, `recognize`, `unauthorized`).
- **Consistent voice across errors.** When 15 of these are read end-to-end, they should feel like they were written by one person. Inconsistency across teams is the most common failure mode here.
- **No em-dashes.** Write plain sentences rather than ones littered with em-dash asides. Split into two sentences, or use a comma, colon, or parentheses where a genuine aside is needed. This applies to every field, including summaries and bodies.
- **Treat error copy as product copy, not log messages.** It's worth a second pair of eyes — engineers aren't always the best judges of what reads naturally to a user.

## Reviewing changes

When opening a PR that adds or edits an error entry:

1. **Read the table view in your head.** Does the title disambiguate this error from neighbours? Does the summary stand on its own?
2. **Compare against existing entries.** Open two or three other files side-by-side. Does your new entry match their tone and structure?
3. **Check the validation output.** CI will flag missing fields, length violations, filename/code mismatches, and duplicates.
