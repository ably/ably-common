# Ably Realtime Protocol

## Error Codes

Ably's [client library SDKs](https://www.ably.io/download), and the [core realtime platform](https://www.ably.io/platform), use common error codes. These error codes are stored and maintained in the shared public JSON file [errors.json](./errors.json).

In addition, a list of error codes and corresponding support articles to help understand how to resolve common problems relating to these error codes can be seen in [errorsHelp.json](./errorsHelp.json). This ensures that with every Ably error message that includes a help link for the error in the format 	https://help.ably.io/error/{{ERROR_CODE}}, the user is taken to a relevant FAQ if it exists, and if one does not exist, we record the number of times that error code has been visited so that the docs/support team can work on adding relevant documentation. See https://github.com/ably/help.

If you need help understanding any error codes, or need technical support, please visit the [Ably support desk](https://www.ably.io/support).

### Ranges

Codes in [errors.json](errors.json) fall into these ranges:

| From  | Title |
| ----- | ----- |
| 10000 | Generic |
| 40000 | 400 |
| 40100 | 401 |
| 40300 | 403 |
| 40400 | 404 |
| 40500 | 405 |
| 41001 | 410 |
| 42200 | 422 |
| 42910 | 429 |
| 50000 | 500 |
| 50010 | Edge cacheing / proxy service |
| 50320 | Active Traffic Management error code to indicate intentional redirect of traffic to fallback hosts |
| 50330 | DNS switch over |
| 50410 | Edge cacheing / proxy service |
| 60000 | reserved for internal (non-customer-facing) use |
| 70000 | reactor-related |
| 71000 | exchange-related: general |
| 71100 | exchange-related: publisher |
| 71200 | exchange-related: product |
| 71300 | exchange-related: subscription |
| 80000 | connection-related |
| 90000 | channel-related |

Codes from `100000` are defined outside of scope of this repository.
In other words, these higher ranges are reserved for use by specific Ably projects and ecosystems, where these codes are unknown to the core Ably service:

| From | To | Project / Ecosystem | Location of Definitions |
| ---- | -- | ------------------- | ----------------------- |
| 100000 | 100999 | Asset Tracking | [Specification: Error codes](https://github.com/ably/ably-asset-tracking-common/tree/main/specification#error-codes) |

The table above is our canonical location for:

- specifying these ranges
- delegating the definitions of codes that sit within these ranges to elsewhere

## Agents

A list of agents announced by Ably client libraries can be found in [agents.json](agents.json).

See [RSC7d](https://docs.ably.com/client-lib-development-guide/features/#RSC7d) for more information on the `Agent` library identifier and the `Ably-Agent` HTTP header.

### Adding New Agents

When a new agent is added to a client library, add a corresponding entry to [agents.json](agents.json)
using the schema defined in [agents-schema.json](../json-schemas/src/agents.json), and open a pull
request against the `main` branch with those changes.

Once the pull request is merged into `main`, open an internal ticket requesting that the realtime team
follow the "Publishing Changes" steps below.

### Publishing Changes

#### Step 1: Public

After changes to [agents.json](agents.json) have been merged into `main`, update the generated Go code
in the [ably-common-go](https://github.com/ably/ably-common-go) repository by manually triggering the
[publish workflow](../.github/workflows/publish.yml) (see [here](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow)
for instructions on how to do that).

There is no further, immediate downstream impact of publishing to `ably-common-go` like this.
Therefore it is safe to publish without consulting others because they have an explicit step required to update the submodule in their codebase (see [Step 2: Internal](#step-2-internal)).

#### Step 2: Internal

Once the generated Go code has been updated, update the `ably-common-go` module in the
internal [go-services](https://github.com/ably/go-services) repository by running:

```bash
go get -u github.com/ably/ably-common-go
```

Open a pull request with the resulting changes to `go.mod` and `go.sum`, and once merged deploy the router
so that it's aware of the newly added agent identifiers.

### `ablyLibMappings`

The `ablyLibMappings` field in [agents.json](agents.json) provides continuity for SDKs that continue to send the
deprecated `X-Ably-Lib` header, which was not capable of sending the extra information we now send in the `Ably-Agent`
header. Each entry in `ablyLibMappings` is used server-side to map an old `X-Ably-Lib` value to its equivalent new
`Ably-Agent` value.

For example, an old client that sends the header `X-Ably-Lib: js-web-1.1.0` will be mapped to `Ably-Agent: ably-js/1.1.0 browser`
based on the `js-web` entry, and then handled as if it sent that `Ably-Agent` header directly.

It is not expected that any new mappings will be added, since we shouldn't be sending any new types of values using the deprecated
`X-Ably-Lib` header, any newly released code should be sending the `Ably-Agent` header instead.
