# Client Library SDK Repository - README Template

Status badges for GitHub workflows should appear here, under the initial H1.

## [GUIDANCE]

- A manually maintained TOC (table of contents) should not be included. GitHub have been providing built-in, automatic support for the creation of README TOC [since March 2021](https://twitter.com/github/status/1376636651963842562?lang=en).
- Headings with the `[optional]` suffix in this document are not required for all SDKs.
- There will be some SDKs where additional headings may be required, where those headings need not necessarily be added to this template if they're clearly one-off requirements for the context of that particular SDK.
- The order of headings, from top to bottom, has been considered carefully so SDKs should not deviate from this without very strong reasons.
- Targeting developers _using_ the SDK. Those who wish to _contribute_ towards the SDK will want to refer to [Contributing](#contributing).

`README`s in any public repo should include the following "official" intro to Ably. It should be italicized as shown and appear before the [Overview](#Overview) section. This helps visitors learn about who we are and what they can build with this SDK. This intro is not required in any sub-`README`s that are linked to from the main one.

_[Ably](https://ably.com) is the platform that powers synchronized digital experiences in realtime. Whether attending an event in a virtual venue, receiving realtime financial information, or monitoring live car performance data – consumers simply expect realtime digital experiences as standard. Ably provides a suite of APIs to build, extend, and deliver powerful digital experiences in realtime for more than 250 million devices across 80 countries each month. Organizations like Bloomberg, HubSpot, Verizon, and Hopin depend on Ably’s platform to offload the growing complexity of business-critical realtime data synchronization at global scale. For more information, see the [Ably documentation](https://ably.com/docs)._

## Overview

A one sentence summary of what this SDK does. Link to [supported features](#feature-support) and [known limitations](#known-limitations) sections below.

## Running the Example [optional]

Not all repositories will have this, but if there is an example app then this is often a good entry point for developers wishing to gain familiarity before attempting to integrate it into their own application codebase.

Example:
[ably-flutter](https://github.com/ably/ably-flutter#running-the-example)

## Installation

How to install this SDK into an application project (whether a new or existing codebase), covering all supported package management and distribution systems.

Provide a link to [Requirements](#requirements).

## Usage

These are generally pretty basic but should show all code required to get something up and running with this SDK.

## Resources

Links out to the core documentation relating to this SDK.

Example:
[ably-asset-tracking-android](https://github.com/ably/ably-asset-tracking-android/blob/main/README.md#documentation)

Also, links out to other locations, typically hosted by Ably, where more useful detail can be found about this SDK and how it fits into the wider ecosystem. These links tend to fall outside the immediate linear reference provided by links provided under [Documentation](#documentation) - e.g. tutorials, demo repositories, blog posts, etc..

Examples:
[ably-flutter](https://github.com/ably/ably-flutter#resources),
[ably-asset-tracking-android](https://github.com/ably/ably-asset-tracking-android/blob/main/README.md#useful-resources)

Demo repositories are mostly hosted in our [ably-labs](https://github.com/ably-labs) GitHub org.
New demos should be indexed from the SDK repositories upon which they depend, under this heading.

## Requirements

What is required to build a project using this SDK. Typically a list of prerequisites.

Detail on what target runtimes are supported by this SDK. May also include detail around what platforms are tested on, though preference should be towards referring those who are interested in testing to consult workflow files directly (e.g. to inspect [strategy matrix configuration](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) for jobs).

## Feature Support

Specify the version of the spec that this SDK targets and link to the [feature support matrix](https://www.ably.io/download/sdk-feature-support-matrix).

## Known Limitations

A list of features that we do not currently support, but we do plan to add in the future.

This should be formatted as a bulleted list and each feature should link to an issue in this repository under which the work will be done when we come to implement it. This allows people to comment on or watch the issue if they are interested.

Example:
[ably-flutter](https://github.com/ably/ably-flutter#known-limitations)

If there are no known limitations for this repository then this section, including heading, should be omitted.
When removing this section from a readme then be careful to ensure that any links to it from that document, or other documents in the repository, are removed at the same time.

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
