#!/usr/bin/env bash
# Wrapper script that defines dump_bash_state before starting bash
dump_bash_state() { :; }
export -f dump_bash_state
exec bash "$@"
