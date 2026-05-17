# Open WebUI Troubleshooting Guide

## Understanding the Open WebUI Architecture

The Open WebUI system is designed to streamline interactions between the client (your browser) and the Ollama API. At the heart of this design is a backend reverse proxy, enhancing security and resolving CORS issues.

- **How it Works**: The Open WebUI is designed to interact with the Ollama API through a specific route. When a request is made from the WebUI to Ollama, it is not directly sent to the Ollama API. Initially, the request is sent to the Open WebUI backend via `/ollama` route. From there, the backend is responsible for forwarding the request to the Ollama API. This forwarding is accomplished by using the route specified in the `OLLAMA_BASE_URL` environment variable. Therefore, a request made to `/ollama` in the WebUI is effectively the same as making a request to `OLLAMA_BASE_URL` in the backend. For instance, a request to `/ollama/api/tags` in the WebUI is equivalent to `OLLAMA_BASE_URL/api/tags` in the backend.

- **Security Benefits**: This design prevents direct exposure of the Ollama API to the frontend, safeguarding against potential CORS (Cross-Origin Resource Sharing) issues and unauthorized access. Requiring authentication to access the Ollama API further enhances this security layer.

## Open WebUI: Server Connection Error

If you're experiencing connection issues, it’s often due to the WebUI docker container not being able to reach the Ollama server at 127.0.0.1:11434 (host.docker.internal:11434) inside the container . Use the `--network=host` flag in your docker command to resolve this. Note that the port changes from 3000 to 8080, resulting in the link: `http://localhost:8080`.

**Example Docker Command**:

```bash
docker run -d --network=host -v open-webui:/app/backend/data -e OLLAMA_BASE_URL=http://127.0.0.1:11434 --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

### Accessing a Remote Open WebUI Host

If Open WebUI is running on a remote machine on your LAN, tunnel it to your local workstation:

```bash
ssh -L 9090:localhost:3000 cimply@10.70.0.1
```

Then use `http://localhost:9090` in your local browser.

### Error on Slow Responses for Ollama

Open WebUI has a default timeout of 5 minutes for Ollama to finish generating the response. If needed, this can be adjusted via the environment variable AIOHTTP_CLIENT_TIMEOUT, which sets the timeout in seconds.

### General Connection Errors

**Ensure Ollama Version is Up-to-Date**: Always start by checking that you have the latest version of Ollama. Visit [Ollama's official site](https://ollama.com/) for the latest updates.

**Troubleshooting Steps**:

1. **Verify Ollama URL Format**:
   - When running the Web UI container, ensure the `OLLAMA_BASE_URL` is correctly set. (e.g., `http://192.168.1.1:11434` for different host setups).
   - In the Open WebUI, navigate to "Settings" > "General".
   - Confirm that the Ollama Server URL is correctly set to `[OLLAMA URL]` (e.g., `http://localhost:11434`).

By following these enhanced troubleshooting steps, connection issues should be effectively resolved. For further assistance or queries, feel free to reach out to us on our community Discord.

## Long Chat Load Freeze or Stuck Input

If long chats open slowly or appear frozen, and you see parser errors in the browser console (for example `Token with "inlineKatex" type was not found`), check both runtime health and frontend state before assuming message loss.

### Typical Symptoms

- Opening an older/long chat causes delayed render or apparent freeze.
- Cleared input text reappears from local storage draft cache.
- Submitting a short message (for example `hold on`) appears to do nothing.
- Browser console shows markdown/Katex parser errors or unhandled promise rejections.

### Fast Recovery Sequence

```bash
cd /home/cimply/git/open-webui
docker compose -f docker-compose.yaml up -d --build --force-recreate open-webui
docker compose -f docker-compose.yaml ps
docker compose -f docker-compose.yaml logs --tail=120 open-webui
curl -sS -m 10 http://localhost:3000/health
```

Then hard-refresh the browser (`Ctrl+Shift+R`) and re-open the affected chat.

### Console Signals To Capture

Capture browser console lines before refresh/restart if possible:

- `Token with "inlineKatex" type was not found`
- `Unhandled Promise Rejection` in markdown parsing/rendering path
- `Duplicate extension names found: ['codeBlock']`
- `401 Unauthorized` on auth endpoints (can indicate stale session/token)

### Notes

- A 401 on auth routes can prevent reliable reproduction in automation if token/session is stale.
- Recovered visibility of prior messages after patch/restart usually indicates frontend render-path recovery, not backend message creation at restart time.

## Database Recovery and Rollback

If your account or chat history disappears after a deployment, use the dedicated runbook:

- `docs/database-restore-and-rollback-runbook.md`

The runbook covers backup-first restore, selecting the newest DB source, instant rollback, and migration mismatch conversion strategy.
