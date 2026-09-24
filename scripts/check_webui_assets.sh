#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3080}"

html="$(curl -fsSL "${BASE_URL}/")"

mapfile -t assets < <(printf '%s' "$html" | rg -o "/_app/immutable/[^\" ]+\\.js" | sort -u)

if [[ ${#assets[@]} -eq 0 ]]; then
  echo "No immutable JS assets found in ${BASE_URL}/"
  exit 1
fi

echo "Checking ${#assets[@]} immutable assets from ${BASE_URL}"

for asset in "${assets[@]}"; do
  headers="$(curl -fsSI "${BASE_URL}${asset}")"
  code="$(printf '%s\n' "$headers" | awk 'toupper($1) ~ /^HTTP\// {code=$2} END {print code}')"
  ctype="$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r' | tail -n1)"

  if [[ "$code" != "200" ]]; then
    echo "FAIL ${asset} -> HTTP ${code}"
    exit 1
  fi

  if [[ "$ctype" != text/javascript* && "$ctype" != application/javascript* ]]; then
    echo "FAIL ${asset} -> content-type ${ctype}"
    exit 1
  fi

  echo "OK   ${asset} (${ctype})"
done

echo "All immutable JS assets passed."
