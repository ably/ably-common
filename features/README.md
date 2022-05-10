# Ably Features

## Specification Point Adherence Tracking

We have
[this Google Sheets document](https://docs.google.com/spreadsheets/d/1ZbAfImxRLRKZNe4KPX7b_0BVVI-qyqnvbAco5TFWSQU/edit?usp=sharing)
which has been used at Ably, by client library SDK developers,
to indicate adherence to individual
[feature specification points](https://docs.ably.com/client-lib-development-guide/features/)
by their
SDK source codebase.
_Request permission from your Manager if you would like access to this spreadsheet._

The detail captured in that spreadsheet is an important source of information which should be able to help us understand the level of features specification compliance across our SDKs. As such, it should be considered a valuable source of truth when it comes to working out what features are implemented across our SDKs.

Additionally, it is very likely that we will continue to want to track feature specification point adherence, at that level of fine granularity, going forwards.

What is clear, however, is that a Google Sheets document is probably not the appropriate venue to continue tracking this information. Instead, the currently anticipated solution is that we export the information per-SDK from that spreadsheet and represent it in a simple format as a 'feature specification point adherence checklist' (/ manifest) in each SDK source code repository (CSV, YAML or some other logical textual data format). This would be instantiated via an initial snapshot process, after which it could be evolved atomically as an additional part of the source code of that SDK, with the spreadsheet becoming obsolete once all SDKs have been exported.

## Disincluded Features

### `ClientOptions#logExceptionReportingUrl`

Specified by [TO3m](https://docs.ably.com/client-lib-development-guide/features/#TO3m)
and [RSC20](https://docs.ably.com/client-lib-development-guide/features/#RSC20).

Will be removed under [ably/docs#1381](https://github.com/ably/docs/issues/1381).
