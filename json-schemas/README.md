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

Run `npm run publish:json-schemas`.

See `publish.js` for more information.
