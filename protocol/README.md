# Ably Realtime Protocol

## Error Codes

Ably's [client library SDKs](https://www.ably.io/download), and the [core realtime platform](https://www.ably.io/platform), use common error codes. These error codes are stored and maintained in the shared public JSON file [errors.json](./errors.json).

In addition, a list of error codes and corresponding support articles to help understand how to resolve common problems relating to these error codes can be seen in [errorsHelp.json](./errorsHelp.json).
This ensures that with every Ably error message that includes a help link for the error in the format `https://help.ably.io/error/{{ERROR_CODE}}`, the user is taken to a relevant FAQ if it exists, and if one does not exist, we record the number of times that error code has been visited so that the docs/support team can work on adding relevant documentation.
See [the `ably/help` repository (internal)](https://github.com/ably/help), the "simple help redirect site".

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
| 40900 | 409 |
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

Codes above `100000` are reserved for use by specific Ably projects and ecosystems, where these codes are unknown to the core Ably service. Definitions for these ranges are defined below.

#### Asset Tracking

Codes for Asset Tracking are maintained externally.

| From | To | Location of Definitions |
| ---- | -- | ----------------------- |
| 100000 | 100999 | [Specification: Error codes](https://github.com/ably/ably-asset-tracking-common/tree/main/specification#error-codes) |

#### Spaces

| From  | Title |
| ----- | ----- |
| 101000 | Space name missing |
| 101001 | Not entered space  |
| 101002 | Lock request exists |
| 101003 | Lock is locked |
| 101004 | Lock invalidated |

#### Chat

102000 - 102999 are reserved for chat purposes.

## Agents

A list of agents announced by Ably client libraries can be found in [agents.json](agents.json).

See [RSC7d](https://docs.ably.com/client-lib-development-guide/features/#RSC7d) for more information on the `Agent` library identifier and the `Ably-Agent` HTTP header.

### Adding New Agents

When a new agent is added to a client library, add a corresponding entry to [agents.json](agents.json)
using the schema defined in [agents-schema.json](../json-schemas/src/agents.json), and open a pull
request against the `main` branch with those changes.

Once the pull request is merged into `main`, open an internal ticket requesting that the realtime team
follow the "Publishing Changes" steps below.

### Additional Notes on Agents

The following table adds more contextual detail for some agent identifiers, where:

- The table does not include those where `type` is `sdk`.
  In these cases there is always only a single emitter, where the identifier value matches the name of the SDK source code repository in the `ably` GitHub org - e.g. identifier `ably-js` is emitted by [ably-js](https://github.com/ably/ably-js).
- The table rows are sorted alphabetically by identifier.
- It intentionally does not include columns that repeat information that is already canonically defined in [agents.json](agents.json) (e.g. values of `versioned` and `type`).
- The 'Emitters' column provides links to SDK source code repositories which directly emit this identifier.

| Identifier | Emitters |
| ---------- | -------- |
| `ably-asset-tracking-android` | [ably-asset-tracking-android](https://github.com/ably/ably-asset-tracking-android) |
| `ably-asset-tracking-swift` | [ably-asset-tracking-swift](https://github.com/ably/ably-asset-tracking-swift) |
| `ably-flutter` | [ably-flutter](https://github.com/ably/ably-flutter) |
| `ably-ruby-rest` | [ably-ruby](https://github.com/ably/ably-ruby) |
| `android` | [ably-java](https://github.com/ably/ably-java), [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `browser` | [ably-js](https://github.com/ably/ably-js) |
| `dart` | [ably-flutter](https://github.com/ably/ably-flutter) |
| `darwin` | [ably-go](https://github.com/ably/ably-go) |
| `dotnet-framework` | [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `dotnet-standard` | [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `go` | [ably-go](https://github.com/ably/ably-go) |
| `iOS` | [ably-cocoa](https://github.com/ably/ably-cocoa), [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `jre` | [ably-java](https://github.com/ably/ably-java) |
| `kafka-connect-ably` | [kafka-connect-ably](https://github.com/ably/kafka-connect-ably) |
| `laravel` | [ably-php](https://github.com/ably/ably-php) |
| `laravel-broadcaster` |  [ably-php](https://github.com/ably/ably-php) |
| `laravel-echo` | [ably-js](https://github.com/ably/ably-js) |
| `linux` | [ably-dotnet](https://github.com/ably/ably-dotnet), [ably-go](https://github.com/ably/ably-go) |
| `macOS` | [ably-cocoa](https://github.com/ably/ably-cocoa), [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `nativescript` | [ably-js](https://github.com/ably/ably-js) |
| `nodejs` | [ably-js](https://github.com/ably/ably-js) |
| `php` | [ably-php](https://github.com/ably/ably-php) |
| `python` | [ably-python](https://github.com/ably/ably-python) |
| `react-hooks` | [react-hooks](https://github.com/ably-labs/react-hooks) |
| `react-native` | [ably-js](https://github.com/ably/ably-js) |
| `ruby` | [ably-ruby](https://github.com/ably/ably-ruby) |
| `spaces` | [spaces](https://github.com/ably/spaces) |
| `models` | [models](https://github.com/ably-labs/models) |
| `tvOS` | [ably-cocoa](https://github.com/ably/ably-cocoa) |
| `unity` | [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `uwp` | [ably-dotnet](https://github.com/ably/ably-dotnet) |
| `watchOS` | [ably-cocoa](https://github.com/ably/ably-cocoa) |
| `windows` | [ably-dotnet](https://github.com/ably/ably-dotnet), [ably-go](https://github.com/ably/ably-go) |
| `xamarin` | [ably-dotnet](https://github.com/ably/ably-dotnet) |

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
