# Ably JSON Schemas

This directory contains the Ably JSON schemas.

Each schema lives in its own file in the `src` directory.

Schemas are published to https://schemas.ably.com.

## Versioning

The `versions.json` file contains the current version for each JSON schema.

Each entry in `versions.json` maps the name of the JSON schema file (without
the `.json` extension) to its current version.

Version numbers follow semantic versioning.

Source JSON schemas SHOULD NOT include an `$id` field, this is populated at
publish time (see below).

## Publish

Set the `SDK_S3_ACCESS_KEY_ID` and `SDK_S3_ACCESS_KEY` environment variables to
an AWS access key and secret that has write permissions to the `schemas.ably.com`
S3 bucket in the SDK AWS account. If you are a SuperAdmin in the SDK AWS account,
then run the following:

```
source <(ably-env secrets print-aws --account sdk --role SuperAdmin)
export SDK_S3_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export SDK_S3_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
```

Run `npm run publish:json-schemas`.

See `publish.js` for more information.
