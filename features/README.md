# Ably Features

Welcome to Ably's common `features/` folder. :wave:

This readme document has been created as the starting point and canonical root for information relating to how we programmatically track Ably features at Ably.
The focus of the content in this folder, as well as this readme, is on our SDKs (sometimes referred to as client libraries).
Our SDKs provide the primary, lanuage/platform-idiomatic APIs that our customers - software application developers -
use in order to integrate and leverage the Ably platform in their solutions.

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

### Future Direction for the SDK Manifests

As mentioned in [the Introduction to this document](#introduction),
[the manifest source files]((sdk-manifests/))
are only in this repository right now on a temporary basis while we incubate this prototype.

They will be moved to the SDK repositories to which they pertain, to be managed as source code in that location, allowing for them to be atomically evolved alongside the interface and implementation source code that they document.

Once they've moved, they will be treated as first-class citizens in their SDK repository homes. It will be a requirement that we run checks in CI, within each SDK repository, that validate that SDK's manifest against the canonical feature list - hence the `common-version` root node in manifests, as this will need to be anchored to allow the content of _this_ repository (`ably/ably-common`) to evolve independently.

:magic_wand: At that point, it is anticipated that the real magic can start...

#### Per-SDK Magic

- **Key Information, Front and Centre**: standard Git tools will help us to understand the evolution of the SDK from a customer-focussed perspective, by simply `diff`'ing this single file
- **Validation Against Source Code Interfaces**: either using runtime-build reflection or source-code annotation we can evolve language-specific tools that link the SDK-specific APIs back to canonical feature nodes, allowing us to navigate back and forth between the two

#### Estate-wide Magic

- **Customer Facing Feature Matrix**: We have the information to be able to contribute, with automation, to the contents of the [Ably Feature Support Matrix](https://ably.com/download/sdk-feature-support-matrix):
  - built using a GitHub workflow hosted in a brand new intermediary repository, generating an artifact that can be consumed by the tools used by our developer education and documentation team (probably a public [npm](https://www.npmjs.com/) package)
- **Full Feature Compliance Matrix**: Primarily for use by the Ably SDK Team, but (as with everything we do, [open for all](https://ably.com/blog/ably-values)) available to be viewed in the public domain. Likely to be an evolution of what you see assembled by [`build.js`](build.js) and uploaded by [the assemble workflow](../workflows/assemble.yml) to `sdk.ably.com`. Providing complete visibility over what features each SDK implements at an appropriate level of granularity.

### Future Direction for the Client Library Features Specification

This single source file will remain our reference for:

- protocol details, including interactions with SDK state and behaviours
- SDK implementation details
- conformed naming for types and their members
- testing requirements (though it is anticipated that, at some point in the future, we will these from the scope of concern for this source file)

Currently:

- Source location: [`features.textile` in `ably/docs`](https://github.com/ably/docs/blob/main/content/client-lib-development-guide/features.textile)
- Backlog of tasks: [issues in `ably/docs`](https://github.com/ably/docs/issues?q=is%3Aopen+is%3Aissue+label%3Aclient-lib-spec)
- Rendered views:
  - Preview: [docs.ably.com](https://docs.ably.com/client-lib-development-guide/features/)
  - Published: [ably.com/docs](https://ably.com/docs/client-lib-development-guide/features)

Going forwards, it is anticipated that this source file will move from `ably/docs` to this repository (`ably/ably-common`) so that it can more logically be managed alongside other efforts to catalogue and track SDK features. That should include validation:

- **Internal**: ensuring that it is consistent in terms of formatting and relative references to itself
- **External**: ensuring that 'spec point' references in [the canonical feature list](sdk.yaml) exist in the 'spec' (this source file)

It will probably remain in textile format, for various reasons, at least in the short to medium term.

### Future Direction for This Repository

Based on the future directions laid out above for [SDK Manifests](#future-direction-for-the-sdk-manifests) and [the Client Library Features Specification](#future-direction-for-the-client-library-features-specification), there will be a need to change the way we view and treat this source code repository.

This will start with a **well-defined release procedure**:

- Add versioning, _strictly_ conforming to [the requirments Semantic Versioning](https://semver.org/), starting at version `1.2.0` (our epoch), indicating the version of the canonical feature list.
- Stop using the entire contents of this repository downstream via a Git submodule in SDK repositories for test fixture purposes (e.g. [see `ably/ably-java`](https://github.com/ably/ably-java/blob/main/.gitmodules)), instead move to a model where SDKs consume those test fixtures from a 'proper' package management / distribution point (to which this repository will need to start publishing as part of this new release procedure).
- Publish the canonical feature list to one or more package management / distribution points, for downstream consumption by SDK repositories as well as other systems at Ably (i.e. developer education / documentation), as part of this new release procedure.

## Future Direction for Specification Point Adherence Tracking

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

## Feature Node Names

The names of feature nodes (those not prefixed with a dot '`.`' to denote them as properties) in [the canonical feature list](sdk.yaml) should conform to the following requirements:

- not use abbreviations
- not start with a verb
- use plural form only if it's strictly necessary - i.e.:
  - use plural form when the concept being captured is _always_ dealing with many things - e.g. `Options` and `Options: Agents`
  - use plural form when the plurality is utterly baked into the naming of the primary type involved - e.g. `Options: Token Details`
  - do not use plural form when the feature links to a primary type and includes methods or properties that involve with that type in both singular and plural contexts - e.g. `Push Notifications: Administration: Device Registration`

This is so that we keep a consistent 'tone of voice', making feature names that are easily comprehensible by human readers and sit alongside one another congruously.

## Disincluded Features

### `ClientOptions#logExceptionReportingUrl`

Specified by [TO3m](https://docs.ably.com/client-lib-development-guide/features/#TO3m)
and [RSC20](https://docs.ably.com/client-lib-development-guide/features/#RSC20).

Will be removed under [ably/docs#1381](https://github.com/ably/docs/issues/1381).
