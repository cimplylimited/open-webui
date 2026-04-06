# Schema Lineage Note

Date: 2026-04-05
Window: Compliance migration - extract_msg removal
Status: Known issue, accepted as non-blocking for this window

## Observed Condition

- Live DB alembic revision: `d31026856c01`
- Running image migration head lineage includes `3781e22d8b01`
- Startup warning observed:
  - `Can't locate revision identified by 'd31026856c01'`

## Operational Assessment

- Service health: healthy
- Endpoint: HTTP 200
- Expected account and chat history: intact
- This maintenance window made no schema changes and did not run migration operations intentionally.

## Why Non-Blocking Here

- Objective of this window was dependency/compliance hardening only.
- No DB schema mutation planned or executed as part of extract_msg removal.
- Rollback target with checksum was prepared and verified before rollout.

## Risk

- Future upgrades/migration steps may fail until lineage is reconciled.
- Treat as a hard gate for future schema-changing windows.

## Required Follow-Up

1. Identify and pin runtime version aligned with DB lineage (`d31026856c01` present upstream).
2. Re-run lineage gate checks before next schema-affecting window.
3. Keep canonical DB snapshot and fresh pre-window backups for every future maintenance window.
