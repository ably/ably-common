# Ably Features

## Introduction

The data and code files in this folder are incubating as a prototype, hopefully the eventually-accepted foundations, of Ably's approach to SDK feature tracking.

These are the pivotal components:

| Component | Purpose |
| ---- | ------- |
| [`sdk.yaml`](sdk.yaml) | The canonical feature list that Ably SDKs can support, represented as a tree. |
| [`sdk-manifests/`](sdk-manifests/) | Temporary location (while we prototype) for manifests, per SDK source code repository, declaring what features that SDK supports. These files will ultimately be moved to be managed as peer-level source code in each SDK's source code repository. |
| [`build.js`](build.js) | Proof-of-concept build tool. The primary purposes of this program, for the time being, are to: (1) validate the structure of data files - canonical feature list and SDK manifest(s); and (2) render a view of the data to enhance understanding and demonstrate utility, both present and potential. |

This document aims to not duplicate information that readers/reviewers can gain for themselves by inspecting the source code of the components described in the table above.
It does, however, aim to expand on concepts and append context - with the hope that this will help readers/reviewers understand the reasons behind design choices made.

## Future Direction

### Future Direction for the Client Library Features Specification

This single source file will remain our reference for:

- protocol details, including interactions with SDK state and behaviours
- SDK implementation details
- conformed naming for types and their members
- testing requirements

Currently:

- Source location: [`features.textile` in `ably/docs`](https://github.com/ably/docs/blob/main/content/client-lib-development-guide/features.textile)
- Backlog of tasks: [issues in `ably/docs`](https://github.com/ably/docs/issues?q=is%3Aopen+is%3Aissue+label%3Aclient-lib-spec)
- Rendered views:
  - Preview: [docs.ably.com](https://docs.ably.com/client-lib-development-guide/features/)
  - Published: [ably.com/docs](https://ably.com/docs/client-lib-development-guide/features)

Going forwards, it is anticipated that this source file will move from `ably/docs` to this repository (`ably/ably-common`) so that it can more logically be managed alongside other efforts to catalogue and track SDK features.

## Feature Node Names

The names of feature nodes (those not prefixed with a dot '`.`' to denote them as properties) in [the canonical feature list](sdk.yaml) should conform to the following requirements:

- not use abbreviations
- not start with a verb
- use plural form only if it's strictly necessary - i.e.:
  - use plural form when the concept being captured is _always_ dealing with many things - e.g. `Options` and `Options: Agents`
  - use plural form when the plurality is utterly baked into the naming of the primary type involved - e.g. `Options: Token Details`
  - do not use plural form when the feature links to a primary type and includes methods or properties that involve with that type in both singular and plural contexts - e.g. `Push Notifications: Administration: Device Registration`

This is so that we keep a consistent 'tone of voice', making feature names that are easily comprehensible by human readers and sit alongside one another congruously.

## Scope of SDK Manifest Coverage

The goal is to capture API shape, within a given SDK's API surface area, which means:

- Capturing all of the information needed to navigate to the class, interface, method/function or property/field which provides access to the implemented feature - i.e.:
  - namespace
  - class/interface name
  - method/function or property/field name
  - method/function argument types
- Excluding information which is superfluous to this goal - that means information which describes details which are not required to navigate to the access point for the implemented feature - e.g.:
  - method/function return types
  - method/function argument names
  - property/field types
  - thrown error/exception type(s)

## Specification Point Adherence Tracking

We have
[this Google Sheets document](https://docs.google.com/spreadsheets/d/1ZbAfImxRLRKZNe4KPX7b_0BVVI-qyqnvbAco5TFWSQU/edit?usp=sharing)
which has been used at Ably, by client library SDK developers,
to indicate adherence to individual
[feature specification points](https://docs.ably.com/client-lib-development-guide/features/)
by their
SDK source codebase.
_Request permission from your Manager if you would like access to this spreadsheet._

The detail captured in that spreadsheet is an important source of information which should be able to help us understand the level of features specification compliance across our SDKs. As such, it should be considered a valuable source of truth when it comes to working out what features are implemented across our SDKs.

Additionally, it is very likely that we will continue to want to track feature specification point adherence, at that level of fine granularity, going forwards.

What is clear, however, is that a Google Sheets document is probably not the appropriate venue to continue tracking this information. Instead, the currently anticipated solution is that we export the information per-SDK from that spreadsheet and represent it in a simple format as a 'feature specification point adherence checklist' (/ manifest) in each SDK source code repository (CSV, YAML or some other logical textual data format). This would be instantiated via an initial snapshot process, after which it could be evolved atomically as an additional part of the source code of that SDK, with the spreadsheet becoming obsolete once all SDKs have been exported.

## Disincluded Features

### `ClientOptions#logExceptionReportingUrl`

Specified by [TO3m](https://docs.ably.com/client-lib-development-guide/features/#TO3m)
and [RSC20](https://docs.ably.com/client-lib-development-guide/features/#RSC20).

Will be removed under [ably/docs#1381](https://github.com/ably/docs/issues/1381).
