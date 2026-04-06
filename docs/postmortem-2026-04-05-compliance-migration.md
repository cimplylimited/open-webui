# Postmortem: Initial Compliance Migration Attempt

Date: 2026-04-05 (America/New_York)
Scope: Attempted removal of unlicensed/GPL-risk dependency chain (`extract_msg` path)
Status: Migration changes were reverted; data access was recovered

## Executive Summary

The first migration attempt to remove `extract_msg` and disable `.msg` ingestion was applied, then reverted within minutes.  
The rollback of code changes succeeded, but subsequent operational steps exposed a separate data-path issue: multiple Docker volumes and DB files existed, and the running service was pointed at a different database than expected. This caused account/login mismatch and missing chat history symptoms.

No confirmed permanent data loss occurred. Data was recovered by restoring the newest known database source after creating full backups.

## Intended Change

The migration commit (`3c359d5ae`) attempted to:

- Remove `extract_msg` from:
  - `backend/requirements.txt`
  - `pyproject.toml`
- Update lockfile:
  - `uv.lock`
- Disable `.msg` ingestion in:
  - `backend/open_webui/retrieval/loaders/main.py`
  - Remove `OutlookMessageLoader` import
  - Remove `"msg"` from `known_source_ext`
  - Replace `.msg` handler with explicit unsupported-format error

## What Went Wrong

1. Compliance migration was not left in place.
- The migration commit at `2026-04-05 20:47:07 -0400` was reverted at `2026-04-05 20:54:56 -0400`.
- Result: unlicensed-extension removal did not remain deployed.

2. Database source-of-truth became ambiguous.
- Multiple Docker volumes existed simultaneously:
  - `open-webui`
  - `open-webui_open-webui`
  - plus multiple ollama-related volumes
- This allowed runtime to point at a DB different from the one containing expected login/chat history.

3. Runtime account mismatch appeared as “backend DB disconnected.”
- Active DB showed a different account (`dk@cimplylimited.com`) and minimal chats.
- Expected account (`cimplyanonymous@hotmail.com`) existed in another DB file.

4. Raw DB swap introduced migration-lineage warning.
- Restored DB reported Alembic revision `d31026856c01`.
- Running image could not locate that revision:
  - `Error: Can't locate revision identified by 'd31026856c01'`
- Service still ran, but this indicates schema lineage mismatch risk.

5. Operational runbook did not exist at first response.
- Recovery relied on ad-hoc investigation before standardized documentation existed.

## Impact

- User-facing:
  - Login credentials appeared invalid on the main interface.
  - Chat history appeared missing.
- Operational:
  - Elevated risk during emergency restore due to unclear DB source.
  - Migration confidence reduced for the compliance initiative.

## Evidence Snapshot

- Commit timeline:
  - `de0382bf3` baseline before compliance hardening
  - `3c359d5ae` remove `extract_msg` and disable `.msg`
  - `60132f0c6` revert migration
- Current code state confirms migration is reverted:
  - `extract_msg` present in manifests
  - `.msg` loader path and `OutlookMessageLoader` present
- Live logs contain Alembic mismatch warning:
  - `Can't locate revision identified by 'd31026856c01'`

## Recovery Actions Completed

1. Backed up all candidate DB files with checksums.
2. Compared user rows and chat recency (`chat.max(updated_at)`).
3. Restored newest known DB containing expected account and latest chats.
4. Verified:
- Service returns HTTP 200.
- Expected account is present.
- Chat count/history present.
5. Added operational docs:
- `docs/database-restore-and-rollback-runbook.md`
- Remote tunnel notes in `TROUBLESHOOTING.md`

## Root Causes

Primary root cause:
- Data-path ambiguity from multiple DB locations/volumes and no enforced source-of-truth before rollout.

Contributing factors:
- Compliance migration and runtime recovery concerns mixed in the same window.
- No pre-existing standardized DB restore/rollback runbook.
- No preflight gate to verify active DB volume and expected account before/after restart.

## Preventive Controls (Required Before Next Attempt)

1. Preflight source-of-truth check.
- Verify active mount and DB path in running container.
- Verify expected account exists in active DB before change window.
- Validate active DB against the fixed canonical snapshot:
  - `/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db`

2. Immutable backup checkpoint before any migration.
- Snapshot live DB and save checksums.
- Test rollback command once before applying changes.
- Rollback target must default to the fixed canonical snapshot, not an arbitrary "latest" DB.

3. Separate windows.
- Window A: compliance code changes only.
- Window B: data migration/DB conversion only (if needed).

4. Explicit lineage gate.
- If Alembic revision mismatch appears, stop raw DB swap strategy.
- Use version-pinned image or supported export/import migration path.

5. Post-change verification contract.
- Login success with expected account.
- Chat history visible.
- Retrieval and provider health checks pass.

## Go/No-Go Review Checklist (Next Migration Window)

Use this checklist in change review before re-attempting compliance migration.

### A) Data Source-of-Truth (must all be true)

- [ ] Canonical DB exists at `/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db`.
- [ ] Canonical DB checksum file exists and was refreshed after last known-good state.
- [ ] Active `open-webui` container mount is verified and documented.
- [ ] Expected account (`cimplyanonymous@hotmail.com`) exists in active DB.
- [ ] Expected chat history count/recency matches canonical DB.

### B) Volume Safety (must all be true)

- [ ] `docker volume ls` output captured in change notes.
- [ ] Active data volume identified from `docker inspect open-webui`.
- [ ] Non-active volumes are archived/backed up before any cleanup decision.
- [ ] No destructive volume command (`down -v` / volume rm) is in migration steps.

### C) Backup and Rollback Readiness (must all be true)

- [ ] Timestamped host-side DB backup created before migration.
- [ ] Backup checksums captured (`sha256sum`) and saved.
- [ ] Rollback target is canonical DB (not arbitrary "latest" DB).
- [ ] Rollback command is tested in dry run and documented.
- [ ] Rollback validation includes runtime checks (login + expected chat visibility).

### D) Schema Lineage Gate (must all be true)

- [ ] Alembic/runtime lineage check completed.
- [ ] If revision mismatch exists, migration is blocked until resolution plan is approved.
- [ ] Repo migration IDs and DB `alembic_version` are explicitly compared and recorded.

### E) Compliance Change Readiness (must all be true)

- [ ] Exact re-deploy strategy selected and documented:
  - Revert the revert commit, or
  - Cherry-pick `3c359d5ae`.
- [ ] Window A (code compliance changes) is separate from Window B (data operations).
- [ ] Owner, window time, and communication plan are confirmed.

### F) Go/No-Go Sign-off

- [ ] Engineering owner sign-off.
- [ ] Operations owner sign-off.
- [ ] Final decision: `GO` / `NO-GO` (recorded with timestamp).

## Current State

- Compliance removal of `extract_msg` is not currently active (reverted).
- Expected user data has been restored and is accessible.
- Migration-lineage warning exists and should be resolved before future major upgrades.
- Future forward and rollback windows must use the fixed canonical DB snapshot as the baseline.
