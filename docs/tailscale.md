# Tailscale + Open WebUI Stability Notes

## Deployment Path

- External URL stays: `https://dgx-spark.taila99bf1.ts.net`
- Tailscale Serve target should be: `http://127.0.0.1:3080`
- Edge proxy (`webui-edge-proxy`) forwards to Open WebUI: `http://open-webui:8080`
- Local direct fallback remains: `http://localhost:3000`

## Required Tailscale Mapping

```bash
tailscale serve --https=443 / http://127.0.0.1:3080
tailscale serve status
# Expected: / -> proxy http://127.0.0.1:3080
```

## Module Script Failed (Browser Recovery)

If the browser shows `TypeError: Importing a module script failed`:

1. Hard refresh (`Cmd+Shift+R` on macOS).
2. Clear site data for `dgx-spark.taila99bf1.ts.net`.
3. Retry in a private/incognito window.
4. If still failing, restart Open WebUI and edge proxy, then run the smoke check.

```bash
docker compose restart open-webui webui-edge-proxy
./scripts/check_webui_assets.sh https://dgx-spark.taila99bf1.ts.net
```

## On-Call Diagnostic Block

```bash
set -euo pipefail

echo "== tailscale serve status =="
tailscale serve status

echo
echo "== health checks =="
curl -k -i -s https://dgx-spark.taila99bf1.ts.net/healthz | sed -n '1,20p'
curl -k -i -s https://dgx-spark.taila99bf1.ts.net/api/version | sed -n '1,20p'

echo
echo "== cache headers =="
curl -k -I -s https://dgx-spark.taila99bf1.ts.net/ | rg -i 'cache-control|content-type|etag|last-modified'
curl -k -I -s https://dgx-spark.taila99bf1.ts.net/_app/immutable/entry/app.CoDvgfZF.js | rg -i 'cache-control|content-type|etag|last-modified'

echo
echo "== asset smoke test =="
./scripts/check_webui_assets.sh https://dgx-spark.taila99bf1.ts.net
```
