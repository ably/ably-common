#!/usr/bin/env bash
#
# A script to generate language specific code from source protocol files.
#
# If the --check flag is set, then the script will fail if any generated files
# differ from what is committed (used in CI to make sure files are up-to-date).

# exit if any command returns a non-zero exit status
set -e

# ROOT is the path to the root of the ably-common repository
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# main runs the main logic of the program
main() {
  generate_go

  if [[ "$1" = "--check" ]]; then
    check_files
  fi

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

# check_files checks that generated files are up-to-date by running
# 'git status --porcelain' and failing if it produces any output.
check_files() {
  local status="$(git status --porcelain)"

  if [[ -n "${status}" ]]; then
    cat >&2 <<EOF

ERROR: The following files are out-of-date:

${status}

Please run scripts/generate.sh and commit the result.
EOF
    exit 1
  fi
}

# info prints an informational message to stdout
info() {
  local msg=$1
  local timestamp=$(date +%H:%M:%S)
  echo "===> ${timestamp} ${msg}"
}

main "$@"
