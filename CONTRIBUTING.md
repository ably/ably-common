# Contributing to Ably's Common Resources

## Development

### Protocol

See [Ably Realtime Protocol](protocol) for details on maintaining:

- Error Codes
- Error Help (support article links)
- Agents

### JSON Files

Our [CI check workflow](.github/workflows/check.yml) runs [Prettier](https://prettier.io/) over all JSON files in this repository.

If you want to be sure that changes you make to JSON files will not fail CI then you can either use Prettier's `--check` switch as implemented in the aforementioned check workflow, or you can simply ask Prettier to rewrite incorrectly formatted JSON files with this command:

    npx prettier --write "**/*.json"

### YAML Files

As for JSON files (see above) we also use Prettier to ensure YAML is conformed.

You can ask Prettier to rewrite incorrectly formatted YAML files with this command:

    npx prettier --write "**/*.yml"

**Note**:
This invocation, matching what we do in the CI workflow, naturally includes our [GitHub workflow source files](.github/workflows) too.
That is intentional.

## Release Process

The outputs from this repository are not yet versioned, though this is planned ([#70](https://github.com/ably/ably-common/issues/70)).

### Go Services

The [publish workflow](.github/workflows/publish.yml) must be manually triggered in order to publish to the [downstream repository](https://github.com/ably/ably-common-go) used by some of our internal codebases.

See [Ably Realtime Protocol: Publishing Changes](protocol#publishing-changes) for full details.