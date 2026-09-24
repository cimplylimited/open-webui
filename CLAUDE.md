# Open WebUI Development Context

## Critical Infrastructure: Tailscale Serve Configuration

**Canonical location:** `/home/cimply/dgx-infra/tailscale/`

Open WebUI is exposed over the tailnet via Tailscale Serve. The external URL is **`https://dgx-spark.taila99bf1.ts.net`**.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│ Tailscale Serve (dgx-spark.taila99bf1.ts.net:443)       │
│ ↓ (via 127.0.0.1:3080)                                  │
│ nginx edge proxy (webui-edge-proxy)                     │
│ ↓ (Docker network: open-webui:8080)                     │
│ Open WebUI application                                  │
└─────────────────────────────────────────────────────────┘
```

### Key Points
1. **Serve config is NOT in this repo** — it's in `/home/cimply/dgx-infra/tailscale/serve-config.json`
2. **Do NOT run ad-hoc `tailscale serve` CLI commands** — they bypass version control and cause configuration drift
3. **All changes to the tailnet endpoint go through dgx-infra** — modify `serve-config.json`, commit, and re-run `tailscale-up.sh`
4. **The nginx config** (`nginx.tailscale.conf`) is in this repo and handles CSP headers, rate limiting, and path-based routing
5. **Health checks** — `docker-compose.yaml` configures container health checks; `scripts/check_webui_assets.sh` does smoke testing

### If the Tailscale URL is broken
Before debugging, check:
- `tailscale serve status` — verify the mapping is `:443 → http://127.0.0.1:3080`
- `curl -k http://127.0.0.1:3080/healthz` — verify the edge proxy is up
- `docker compose ps` — verify `webui-edge-proxy` and `open-webui` are healthy

If the mapping is wrong:
1. Do NOT use `tailscale serve --https=443 ...` CLI commands
2. Instead, go to `/home/cimply/dgx-infra/tailscale/`, update `serve-config.json`, commit, and run `sudo tailscale-up.sh`

### For agents/future operators
- Tailscale configuration changes belong in `dgx-infra`, not here
- The `docs/tailscale.md` in this repo documents operational runbooks and diagnostics — it is NOT authoritative for configuration
- See `/home/cimply/dgx-infra/tailscale/README.md` for the canonical configuration guide

## Docker Compose Services
- **open-webui** — Main application (8080 internal, not exposed directly)
- **webui-edge-proxy** — nginx reverse proxy (127.0.0.1:3080, forward-facing to Tailscale)
- **ollama** — LLM backend (11434 internal)

## Build and Test
- `docker compose up` — brings up the full stack
- `./scripts/check_webui_assets.sh <URL>` — smoke test for asset loading and CSP compliance
- See `docs/README.md` for operational runbook
