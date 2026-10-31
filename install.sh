#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if [[ ${1:-} == --help || $# -lt 1 ]]; then
 echo 'Usage: bash install.sh TV_IPV4 [--root-deck /path/to/tizen-deck]'
 echo 'Default: regular SDB installation; optional root mode uses the configured companion project.'
 exit 0
fi
TV_HOST=$1; shift
python3 - "$TV_HOST" <<'PY'
import sys,ipaddress
ipaddress.IPv4Address(sys.argv[1])
PY
[[ -f TizenDeckX.wgt ]] || { echo 'Build first: bash build.sh' >&2; exit 1; }
if [[ ${1:-} == --root-deck ]]; then
 [[ $# == 2 ]] || { echo 'Path required' >&2; exit 1; }
 DECK=$(realpath -- "$2")
 TIZEN_HOST="$TV_HOST" "$DECK/.venv/bin/python" "$DECK/deploy_wgt.py" "$PWD/TizenDeckX.wgt" --allow-root
elif [[ $# == 0 ]]; then
 SDB_BIN=${SDB:-sdb}
 "$SDB_BIN" connect "$TV_HOST:26101"
 "$SDB_BIN" -s "$TV_HOST:26101" install "$PWD/TizenDeckX.wgt"
else
 echo 'Unknown argument' >&2; exit 1
fi
