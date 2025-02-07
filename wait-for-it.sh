#!/usr/bin/env bash

set -e

TIMEOUT=15
STRICT=0
HOST=""
PORT=""
CMD=""
QUIET=0

echoerr() {
  if [[ "$QUIET" -ne 1 ]]; then echo "$@" 1>&2; fi
}

usage() {
  exitcode="$1"
  cat << USAGE >&2
Usage:
  $0 host:port [-s] [-t timeout] [-- command args]
  -q | --quiet                        Do not output any status messages
  -s | --strict                       Only execute subcommand if the test succeeds
  -t TIMEOUT | --timeout=timeout      Timeout in seconds, zero for no timeout
  -- COMMAND ARGS                     Execute command with args after the test finishes
USAGE
  exit "$exitcode"
}

wait_for() {
  if [[ -z "${HOST}" || -z "${PORT}" ]]; then
    echoerr "Error: you need to provide a host and port to test."
    usage 2
  fi

  for i in $(seq 1 $TIMEOUT); do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    result=$?
    if [[ $result -eq 0 ]]; then
      if [[ -n "$CMD" ]]; then
        exec $CMD
      fi
      exit 0
    fi
    sleep 1
  done
  echo "Operation timed out after ${TIMEOUT} seconds"
  exit 1
}

while [[ $# -gt 0 ]]
do
  case "$1" in
    *:* )
    HOST=$(echo "$1" | cut -d : -f 1)
    PORT=$(echo "$1" | cut -d : -f 2)
    shift 1
    ;;
    -q | --quiet)
    QUIET=1
    shift 1
    ;;
    -s | --strict)
    STRICT=1
    shift 1
    ;;
    -t)
    TIMEOUT="$2"
    if [[ -z "$TIMEOUT" ]]; then break; fi
    shift 2
    ;;
    --timeout=*)
    TIMEOUT="${1#*=}"
    shift 1
    ;;
    --)
    shift
    CMD="$@"
    break
    ;;
    --help)
    usage 0
    ;;
    *)
    echoerr "Unknown argument: $1"
    usage 1
    ;;
  esac
done

if [[ "$STRICT" = "1" ]]; then
  wait_for
  exec $CMD
else
  wait_for "$@" &
  wait $!
fi
