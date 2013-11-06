namespace java io.ably.protocol
namespace cpp ably
namespace php ably
namespace perl ably
namespace py ably
namespace rb ably

enum TAction {
  HEARTBEAT;
  ACK;
  NACK;
  CONNECT;
  CONNECTED;
  DISCONNECT;
  DISCONNECTED;
  CLOSE;
  CLOSED;
  ERROR;
  ATTACH;
  ATTACHED;
  DETACH;
  DETACHED;
  PRESENCE;
  MESSAGE;
}

enum TType {
  NONE;
  TRUE;
  FALSE;
  INT32;
  INT64;
  DOUBLE;
  STRING;
  BUFFER;
  JSONARRAY;
  JSONOBJECT;
}

enum TFlags {
  SYNC_TIME;
}

enum TPresenceState {
  ENTER;
  LEAVE;
  UPDATE;
}

struct TError {
  1: optional i16                   statusCode;
  2: optional i16                   code;
  3: optional string                reason;
}

struct TData {
  1: required TType                 type;
  2: optional i32                   i32Data;
  3: optional i64                   i64Data;
  4: optional double                doubleData;
  5: optional string                stringData;
  6: optional binary                binaryData;
  7: optional binary                cipherData;
}

struct TPresence {
  1: required TPresenceState        state;
  2: required string                clientId;
  3: optional TData                 clientData;
  4: optional string                memberId;
  5: optional string                inheritMemberId;
  6: optional string                connectionId;      /* @hidden */
  7: optional string                instanceId;        /* @hidden */
}

struct TPresenceArray {
  1: required list<TPresence>       items;
}

struct TMessage {
  1: optional string                name;
  2: optional string                clientId;
  3: optional i64                   timestamp;
  4: optional TData                 data;
  5: optional list<string>          tags;
}

struct TMessageArray {
  1: required list<TMessage>        items;
}

struct TProtocolMessage {
  1: required TAction               action;
  2: optional byte                  flags;
  3: optional i32                   count;
  4: optional TError                error;
  /* the following fields are expected/valid for connection-related and channel actions */
  5: optional string                applicationId;
  6: optional string                connectionId;
  7: optional i64                   connectionSerial;
  /* the following fields are expected/valid for channel actions */
  8: optional string                channel;
  9: optional string                channelSerial;
  10: optional i64                  msgSerial;
  11: optional i64                  timestamp;
  12: optional list<TMessage>       messages;
  13: optional list<TPresence>      presence;
}

struct TMessageBundle {
  1: required list<TProtocolMessage> items;
}

struct SMessageCount {
  1: required double count;
  2: required double data;
}

struct SMessageTypes {
  1: required SMessageCount all;
  2: optional SMessageCount messages;
  3: optional SMessageCount presence;
}

struct SResourceCount {
  1:  optional double opened;
  2:  optional double peak;
  3:  optional double mean;
  4:  optional double min;
  5:  optional double refused;
  10: optional double sample_count; /* @hidden */
  11: optional double sample_sum;   /* @hidden */
}

struct SConnectionTypes {
  1: required SResourceCount all;
  2: optional SResourceCount plain;
  3: optional SResourceCount tls;
}

struct SMessageTraffic {
  1: required SMessageTypes all;
  2: optional SMessageTypes realtime;
  3: optional SMessageTypes rest;
  4: optional SMessageTypes push;
  5: optional SMessageTypes httpStream;
}

struct SRequestCount {
  1: optional double succeeded;
  2: optional double failed;
  3: optional double refused;
}

struct SStats {
  1:  required SMessageTypes    all;
  2:  required SMessageTraffic  inbound;
  3:  required SMessageTraffic  outbound;
  4:  required SMessageTypes    persisted;
  5:  required SConnectionTypes connections;
  6:  optional SResourceCount   channels;
  7:  optional SRequestCount    apiRequests;
  8:  optional SRequestCount    tokenRequests;
  10: optional string           inProgress; /* @hidden */
  11: optional i32              count;      /* @hidden */
}

struct SStatsArray {
  1: required list<SStats> items;
}

struct WWebhookMessage {
  1: required string name;
  2: optional string webhookId;
  3: optional i64    timestamp;
  4: optional string serial;
  5: optional TData  data;
}

struct WWebhookMessageArray {
  1: required list<WWebhookMessage> items;
}