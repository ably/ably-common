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
  3: optional TData                 clientData;
}

struct TMessage {
  1: optional string                name;
  2: optional string                clientId;
  4: optional i64                   timestamp;
  5: optional TData                 payload;
  6: optional list<string>          tags;
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
  10: optional string                channelSerial;
  11: optional string               name;
  12: optional i64                  timestamp;
  13: optional i32                  size;
  14: optional list<TMessage>       messages;
  15: optional set<TPresence>       presence;
}

struct TMessageSet {
  1: required list<TChannelMessage> items;
}
