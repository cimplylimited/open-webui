#!/usr/bin/env bash
# Run after every `docker compose up --build open-webui` to refresh the SvelteKit init
# script hash in nginx.tailscale.conf. Scripts 1 and 2 are stable (from app.html);
# script 3 (SvelteKit router init) changes when Vite fingerprints change.
set -euo pipefail

CONF="$(dirname "$(dirname "$(realpath "$0")")")/nginx.tailscale.conf"
CONTAINER="${1:-open-webui}"

hashes=$(docker exec "$CONTAINER" python3 -c "
import re, hashlib, base64
with open('/app/build/index.html') as f:
    html = f.read()
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
parts = []
for s in scripts:
    h = hashlib.sha256(s.encode()).digest()
    parts.append(\"'sha256-\" + base64.b64encode(h).decode() + \"'\")
print(' '.join(parts))
")

# Replace the entire script-src value (everything between script-src and the closing ;)
sed -i "s|script-src 'self'[^;]*;|script-src 'self' $hashes;|g" "$CONF"

echo "Updated script-src in $CONF:"
grep "script-src" "$CONF" | head -1

docker exec "$CONTAINER" nginx -t 2>/dev/null && echo "Note: restart webui-edge-proxy to apply: docker compose restart webui-edge-proxy" || true
echo "Done."
