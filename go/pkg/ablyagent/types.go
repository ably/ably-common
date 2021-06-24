package ablyagent

//go:generate ablyagent -path ../../../protocol/agents.json -out generated.go

// Agent is an agent identifier that can appear in the Ably-Agent HTTP header
// and be tracked as a metric.
//
// See protocol/agents.json.
type Agent struct {
	Identifier string `json:"identifier"`
	Type       string `json:"type"`
	Versioned  bool   `json:"versioned"`
}

// AblyLibMapping is an agent identifier that can appear in the X-Ably-Lib HTTP
// header and be converted to its equivalent Ably-Agent value.
//
// See protocol/agents.json.
type AblyLibMapping struct {
	Lib   string
	Agent string
}

// Entry is an extracted agent entry from an Ably-Agent HTTP header.
type Entry struct {
	Agent   *Agent
	Version string
}

// UnknownEntry is used to track requests which don't provide an Ably-Agent or
// X-Ably-Lib header.
var UnknownEntry = &Entry{
	Agent: &Agent{
		Identifier: "unknown",
		Type:       "unknown",
	},
	Version: "0.0.0",
}
