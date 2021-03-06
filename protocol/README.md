# Ably Realtime Protocol

## Error Codes

Ably's [client library SDKs](https://www.ably.io/download), and the [core realtime platform](https://www.ably.io/platform), use common error codes. These error codes are stored and maintained in the shared public JSON file [errors.json](./errors.json).

In addition, a list of error codes and corresponding support articles to help understand how to resolve common problems relating to these error codes can be seen in [errorsHelp.json](./errorsHelp.json).

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

## Agents

A list of agents announced by Ably client libraries can be found in [agents.json](agents.json).

See [RSC7d](https://docs.ably.com/client-lib-development-guide/features/#RSC7d) for more information on the `Agent` library identifier and the `Ably-Agent` HTTP header.

### Adding New Agents

When a new agent is added to a client library, add a corresponding entry to [agents.json](agents.json)
using the schema defined in [agents-schema.json](../test-resources/agents-schema.json), and open a pull
request against the `main` branch with those changes.

Once the pull request is merged into `main`, open an internal ticket requesting that the realtime team
follow the "Publishing Changes" steps below.

### Publishing Changes

After changes to [agents.json](agents.json) have been merged into `main`, update the generated Go code
in the [ably-common-go](https://github.com/ably/ably-common-go) repository by manually triggering the
[publish workflow](../.github/workflows/publish.yml) (see [here](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow)
for instructions on how to do that).

Once the generated Go code has been updated, update the `ably-common-go` module in the
internal [go-services](https://github.com/ably/go-services) repository by running:

```
go get -u github.com/ably/ably-common-go
```

Open a pull request with the resulting changes to `go.mod` and `go.sum`, and once merged deploy the router
so that it's aware of the newly added agent identifiers.
