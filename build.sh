#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
[[ ${1:-} != --help ]] || { echo 'Usage: bash build.sh (builds signed TizenDeckX.wgt locally)'; exit 0; }
umask 077
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
mkdir -p .deps
curl -fL --retry 2 https://download.tizen.org/sdk/tizenstudio/official/binary/certificate-generator_0.1.4_ubuntu-64.zip -o .deps/certificate-generator.zip
printf '%s\n' '446aa52f249205f4ad573173b02c9c38aa5de0316028b77dd189e44fd5f75964  .deps/certificate-generator.zip' | sha256sum -c -
.venv/bin/python -m zipfile -e .deps/certificate-generator.zip .deps/certificate-generator
.venv/bin/python build.py
