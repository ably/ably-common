#!/usr/bin/env bash
#
# A script to publish generated code to downstream GitHub repositories.
# The build-go.sh script will need to have been run first.
#
# The script assumes there's an SSH key available with read/write permissions
# to the downstream repositories, and thus uses SSH URLs.

# exit if any command returns a non-zero exit status
set -e

# TMPDIR is a temporary directory used for cloning git repositories that's
# deleted on exit
TMPDIR="$(mktemp -d)"
trap "rm -rf ${TMPDIR}" EXIT

# main runs the main logic of the program
main() {
  publish_go

  info "Done!"
}

# publish_go builds the Go generator programs in go/cmd, uses them to generate
# Go code, and pushes the result to the ably-common-go repository
publish_go() {
  local repo="${TMPDIR}/ably-common-go"
  info "Cloning ably-common-go into ${repo}"
  git clone git@github.com:ably/ably-common-go "${repo}"

  info "Copying generated Go code to repository clone"
  cp generated/ablyagent.go "${repo}/ablyagent"

  # check there are some changes to publish
  cd "${repo}"
  local status="$(git status --porcelain)"
  if [[ -z "${status}" ]]; then
    info "No changes to publish"
    return
  fi

  info "Publishing generated Go code to ably-common-go"
  git add .
  git commit -m "Update generated code"
  git push origin main
}

# info prints an informational message to stdout
info() {
  local msg=$1
  local timestamp=$(date +%H:%M:%S)
  echo "===> ${timestamp} ${msg}"
}

main "$@"
