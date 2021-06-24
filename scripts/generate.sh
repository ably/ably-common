#!/usr/bin/env bash
#
# A script to generate language specific code from source protocol files.

# exit if any command returns a non-zero exit status
set -e

# ROOT is the path to the root of the ably-common repository
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# main runs the main logic of the program
main() {
  generate_go

  info "Done!"
}

# generate_go builds the Go generator programs in go/cmd and uses them
# to generate code for the Go packages in go/pkg using 'go generate'
generate_go() {
  info "Generating Go code"

  # it's convenient to be in the root directory when running the Go commands
  pushd "${ROOT}" >/dev/null

  # build the generators into the bin directory
  go build -o bin/ ./go/cmd/...

  # run 'go generate' with the generators in PATH
  PATH="${ROOT}/bin:${PATH}" go generate ./go/pkg/...

  # return to the previous working directory
  popd >/dev/null
}

# info prints an informational message to stdout
info() {
  local msg=$1
  local timestamp=$(date +%H:%M:%S)
  echo "===> ${timestamp} ${msg}"
}

main "$@"
