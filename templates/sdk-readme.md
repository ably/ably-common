# Client Library SDK Repository - README Template

Status badges for GitHub workflows should appear here, under the initial H1.

## [GUIDANCE]

- A manually maintained TOC (table of contents) should not be included. GitHub have been providing built-in, automatic support for the creation of README TOC [since March 2021](https://twitter.com/github/status/1376636651963842562?lang=en).
- Headings with the `[optional]` suffix in this document are not required for all SDKs.
- There will be some SDKs where additional headings may be required, where those headings need not necessarily be added to this template if they're clearly one-off requirements for the context of that particular SDK.
- The order of headings, from top to bottom, has been considered carefully so SDKs should not deviate from this without very strong reasons.
- Targeting developers _using_ the SDK. Those who wish to _contribute_ towards the SDK will want to refer to [Contributing](#contributing).

## Overview

A one sentence summary of what this SDK does.

## Resources

Links out to the core documentation relating to this SDK.

Example:
[ably-asset-tracking-android](https://github.com/ably/ably-asset-tracking-android/blob/main/README.md#documentation)

Also, links out to other locations, typically hosted by Ably, where more useful detail can be found about this SDK and how it fits into the wider ecosystem. These links tend to fall outside the immediate linear reference provided by links provided under [Documentation](#documentation) - e.g. tutorials, demo repositories, blog posts, etc..

Examples:
[ably-flutter](https://github.com/ably/ably-flutter#resources),
[ably-asset-tracking-android](https://github.com/ably/ably-asset-tracking-android/blob/main/README.md#useful-resources)

## Supported Platforms

Detail on what target runtimes are supported by this SDK. May also include detail around what platforms are tested on, though preference should be towards referring those who are interested in testing to consult workflow files directly (e.g. to inspect [strategy matrix configuration](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) for jobs).

## Known Limitations

A list of features that we do not currently support, but we do plan to add in the future.

This should be formatted as a bulleted list and each feature should link to an issue in this repository under which the work will be done when we come to implement it. This allows people to comment on or watch the issue if they are interested.

Example:
[ably-flutter](https://github.com/ably/ably-flutter#known-limitations)

## Requirements

What is required to build a project using this SDK. Typically a list of prerequisites.

May also include runtime requirements specific to particular platforms, expanding on what's detailed at a higher level under [Supported Platforms](#supported-platforms).

## Running the Example [optional]

Not all repositories will have this, but if there is an example app then this is often a good entry point for developers wishing to gain familiarity before attempting to integrate it into their own application codebase.

Example:
[ably-flutter](https://github.com/ably/ably-flutter#running-the-example)

## Installation

How to install this SDK into an application project (whether a new or existing codebase), covering all supported package management and distribution systems.

## Usage Examples

These are generally pretty basic but should show all code required to get something up and running with this SDK.

## Support, Feedback and Troubleshooting

Example:
[ably-js](https://github.com/ably/ably-js#support-feedback-and-troubleshooting)

## Contributing

A sentence pointing potential contributors to another document (see [sdk-contributing.md](sdk-contributing.md)). This sentence should be in the form:

```md
For guidance on how to contribute to this project, see [CONTRIBUTING.md](CONTRIBUTING.md).
```

## Credits [optional]

If applicable or otherwise courteous towards third parties who we've worked with or been supported by.

Example:
[ably-js](https://github.com/ably/ably-js#credits)
