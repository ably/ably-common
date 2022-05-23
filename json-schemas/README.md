# Ably JSON Schemas

This directory contains the Ably JSON schemas.

Each schema lives in its own file in the `src` directory.

Schemas are published to `https://schemas.ably.com`.

## Versioning

The `versions.json` file contains the current version for each JSON schema.

Each entry in `versions.json` maps the name of the JSON schema file (without
the `.json` extension) to its current version.

Version numbers follow semantic versioning.

Source JSON schemas SHOULD NOT include an `$id` field, this is populated at
publish time (see below).

## Publish

Manually run the [`publish-json-schemas.yml`](https://github.com/ably/ably-common/actions/workflows/publish-json-schemas.yml)
GitHub Action to publish all the JSON schemas to `https://schemas.ably.com`.

Alternatively, to publish locally, configure your environment with AWS
credentials that have write permission to the `schemas.ably.com` S3 bucket
in the SDK AWS account:

```bash
source <(ably-env secrets print-aws --account sdk --role SuperAdmin)
```

Then run `npm run publish:json-schemas`.

See `publish.js` for more information.
