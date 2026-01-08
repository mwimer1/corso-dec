#!/usr/bin/env sh
if [ -z "$HUSKY" ]; then
  cd "$(dirname -- "$0")/.."
  if [ -f .huskyrc ]; then
    export HUSKY=0
    . .huskyrc
    export HUSKY=1
  fi
  if [ "$HUSKY" != "0" ]; then
    export HUSKY=1
  fi
fi

if [ "$HUSKY_DEBUG" = "1" ]; then
  debug() {
    echo "husky (debug) - $1"
  }
else
  debug() {
    :
  }
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

run_command() {
  if command_exists "$1"; then
    "$@"
  else
    return 127
  fi
}

debug "husky v8.0.3 - $hookName"
