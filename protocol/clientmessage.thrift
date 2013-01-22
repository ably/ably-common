namespace java io.ably.protocol
namespace cpp ably
namespace php ably
namespace perl ably
namespace py ably
namespace rb ably

enum TAction {
  HEARTBEAT;
  CONNECT;
  CONNECTED;
  ERROR;
  ATTACH;
  ATTACHED;
  DETACH;
  DETACHED;
  SUBSCRIBE;
  SUBSCRIBED;
  UNSUBSCRIBE;
  UNSUBSCRIBED;
  PRESENCE;
  EVENT;
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

enum TPresenceState {
  ENTER;
  LEAVE;
}

struct TData {
  1: required TType                 type;
  2: optional i32                   i32Data;
  3: optional i64                   i64Data;
  4: optional double                doubleData;
  5: optional string                stringData;
  6: optional binary                binaryData;
}

struct TPresence {
  1: required TPresenceState        state;
  2: required string                clientId;
  3: optional string                connectionId;
  4: optional TData                 clientData;
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

struct TChannelMessage {
  1: required TAction               action;
  /* the following fields are expected/valid for the ERROR action */
  2: optional i16                   statusCode;
  3: optional i16                   code;
  4: optional string                reason;
  /* the following fields are expected/valid for connection-related and channel actions */
  5: optional string                applicationId;
  6: optional string                clientId;
  7: optional string                connectionId;
  8: optional i32                   connectionSerial;
  /* the following fields are expected/valid for channel actions */
  9: required string                channel;
  10: optional string               channelSerial;
  11: optional string               name;
  12: optional i64                  timestamp;
  13: optional i32                  size;
  14: optional list<TMessage>       messages;
  15: optional set<TPresence>       presence;
}

struct TMessageSet {
  1: required list<TChannelMessage> items;
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
  4: optional SMessageTypes post;
  5: optional SMessageTypes httpStream;
}

struct SRequestCount {
  1: optional double succeeded;
  2: optional double failed;
  3: optional double refused;
}

struct SStats {
  1: required SMessageTypes    all;
  2: required SMessageTraffic  inbound;
  3: required SMessageTraffic  outbound;
  4: required SMessageTypes    persisted;
  5: required SConnectionTypes connections;
  6: optional SResourceCount   channels;
  7: optional SRequestCount    apiRequests;
  8: optional SRequestCount    tokenRequests;
}

struct SStatsArray {
  1: required list<SStats>     items;
}

