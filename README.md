# Ably - Common Resources

[![.github/workflows/check.yml](https://github.com/ably/ably-common/actions/workflows/check.yml/badge.svg)](https://github.com/ably/ably-common/actions/workflows/check.yml)

_[Ably](https://ably.com) is the platform that powers synchronized digital experiences in realtime. Whether attending an event in a virtual venue, receiving realtime financial information, or monitoring live car performance data – consumers simply expect realtime digital experiences as standard. Ably provides a suite of APIs to build, extend, and deliver powerful digital experiences in realtime for more than 250 million devices across 80 countries each month. Organizations like Bloomberg, HubSpot, Verizon, and Hopin depend on Ably’s platform to offload the growing complexity of business-critical realtime data synchronization at global scale. For more information, see the [Ably documentation](https://ably.com/docs)._

## Overview

This repository contains files shared across Ably.

## Usage in Downstream Repositories

We are including the entire contents of this repository in the working copies of the downstream repositories (a.k.a. superprojects) which depend on it. This is simplistic but it allows us to trivially include this repository as a Git [submodule](https://git-scm.com/docs/gitsubmodules) in those repositories.

In the future we may well consider pushing out some of the artifacts contained (or perhaps generated) here out to package repositories.
See [#70](https://github.com/ably/ably-common/issues/70) for more detail.

## Artifacts Published from here

The following external locations are updated by publishing processes within this repository:

- [JSON Schemas](json-schemas/) at the `schemas.ably.com` https endpoint
- [Common Go Packages](protocol/) to the [`ably/ably-common-go` repository](https://github.com/ably/ably-common-go)
- [Agent CSV Data](protocol/README.md#agent-csv-data) at `https://schemas.ably.com/csv/agents/`

While there is a `package.json` file at the root of this repository, we do not publish any npm packages from here.
We just use Node.js to run tests, lints and to publish elsewhere.

## Features

The canonical SDK feature list has been moved to the [`ably/features` repository](https://github.com/ably/features).

## Contributing

For guidance on how to contribute to this project, see [CONTRIBUTING.md](CONTRIBUTING.md).
