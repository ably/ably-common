#!/usr/bin/env bash
#
# A script to generate language specific code from source protocol files.

# exit if any command returns a non-zero exit status
set -e

# main runs the main logic of the program
main() {
  build

  info "Done!"
}

# build builds the Go generator programs in go/cmd, then uses them to generate
# Go code - ready to be pushed to the ably-common-go repository (see publish-go.sh).
build() {
  info "Building Go generator programs"
  go build -o bin/ ./go/cmd/...

  info "Generating Go code"
  mkdir -p "generated"
  bin/ablyagent --out "generated/ablyagent.go"
}

# info prints an informational message to stdout
info() {
  local msg=$1
  local timestamp=$(date +%H:%M:%S)
  echo "===> ${timestamp} ${msg}"
}

main "$@"
