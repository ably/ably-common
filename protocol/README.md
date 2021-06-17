# Ably Realtime Error Codes

## Overview

Ably's [client library SDKs](https://www.ably.io/download), and the [core realtime platform](https://www.ably.io/platform), use common error codes. These error codes are stored and maintained in the shared public JSON file [errors.json](./errors.json).

In addition, a list of error codes and corresponding support articles to help understand how to resolve common problems relating to these error codes can be seen in [errorsHelp.json](./errorsHelp.json).

If you need help understanding any error codes, or need technical support, please visit the [Ably support desk](https://www.ably.io/support).

## Error Code Ranges

Codes in [error.json](error.json) fall into these ranges:

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
| 50010 | Edge cacheing / proxy service error codes |
| 50320 | Active Traffic Management error code to indicate intentional redirect of traffic to fallback hosts |
| 60000 | reserved for internal (non-customer-facing) use |
| 70000 | reactor-related |
| 71000 | exchange-related: general |
| 71100 | exchange-related: publisher |
| 71200 | exchange-related: product |
| 71300 | exchange-related: subscription |
| 80000 | connection-related |
| 90000 | channel-related |
