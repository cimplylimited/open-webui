# Local Models through LiteLLM

Open WebUI uses the existing authenticated LiteLLM gateway for local llama.cpp models.

## Connection

The same-host application path is:

```text
open-webui -> http://litellm:4000/v1 -> llama-swap:8500 -> llama.cpp
```

Open WebUI joins the external Docker network named `open-webui_default` through the logical
Compose network `gateway`. Ollama remains isolated on `internal`, and the nginx proxy remains
isolated on `edge`.

Remote clients continue to use
`https://dgx-spark.taila99bf1.ts.net:4000/v1` through Tailscale Serve. Do not expose LiteLLM on
another host interface or connect Open WebUI through the Tailscale URL.

## Model IDs

Use the public aliases exactly as shown:

- `qwen3-next`
- `r1-qwen32b`
- `nemoclaw`

Do not add the internal LiteLLM provider prefix `openai/`.

## Authentication

The LiteLLM credential is stored in Open WebUI's persistent OpenAI-compatible connection
configuration. Reconcile it through `/openai/config/update` as an authenticated administrator.
Never commit the key, print it in diagnostics, or pass it as a process argument.

The base URL and key arrays are positional. An update must replace only the key whose URL is
`http://litellm:4000/v1` and preserve all other connections.

## Runtime expectations

- Keep `AIOHTTP_CLIENT_TIMEOUT` unset unless measured behavior requires an explicit value.
- Allow 320–360 seconds for a cold model switch; LiteLLM permits 600 seconds.
- `nemoclaw` is loaded on demand and may take 200–310 seconds when cold.
- The current aliases are text-only. Do not advertise image capability.
- Enable tool use for an alias only after it passes the separately documented native tool-call
  acceptance test.

Validate the Compose isolation contract with:

```bash
./scripts/check_litellm_gateway_compose.py
```
