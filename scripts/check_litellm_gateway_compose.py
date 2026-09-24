#!/usr/bin/env python3
"""Validate the Open WebUI-to-LiteLLM Compose network contract without resolving secrets."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
result = subprocess.run(
    [
        "docker",
        "compose",
        "config",
        "--no-env-resolution",
        "--format",
        "json",
    ],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
)
if "WEBUI_SECRET_KEY" in result.stdout:
    raise SystemExit("protected environment was unexpectedly rendered")

config = json.loads(result.stdout)
services = config["services"]
networks = config["networks"]

assert set(services["open-webui"]["networks"]) == {"edge", "internal", "gateway"}
assert set(services["ollama"]["networks"]) == {"internal"}
assert set(services["webui-edge-proxy"]["networks"]) == {"edge"}
assert [
    name for name, service in services.items() if "gateway" in service.get("networks", {})
] == ["open-webui"]

assert networks["internal"]["internal"] is True
assert networks["gateway"]["external"] is True
assert networks["gateway"]["name"] == "open-webui_default"
assert "default" not in networks

assert "ports" not in services["open-webui"]
assert "ports" not in services["ollama"]
assert services["webui-edge-proxy"]["ports"] == [
    {
        "mode": "ingress",
        "host_ip": "127.0.0.1",
        "target": 3080,
        "published": "3080",
        "protocol": "tcp",
    }
]

print("LiteLLM gateway Compose contract passed")
