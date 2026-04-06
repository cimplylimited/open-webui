# Database Restore, Rollback, and Conversion Runbook

This runbook is for recovering the correct Open WebUI login/chat history when multiple `webui.db` files exist or the wrong database is mounted.

## When to use this

- Your usual account no longer logs in.
- Chat history appears missing.
- A restore was attempted and you need an immediate rollback path.
- You see migration warnings like `Can't locate revision identified by ...` after swapping DB files.

## Safety rules

- Always take backups before replacing any DB file.
- Never run `docker compose down -v` during recovery.
- Stop only `open-webui` for DB swap operations.

## Paths used in this deployment

- Live DB in container: `/app/backend/data/webui.db`
- Local DB candidate: `/home/cimply/git/open-webui/backend/data/webui.db`
- Snapshot directory pattern: `/home/cimply/git/open-webui/db-restore-backups-YYYYMMDD-HHMMSS`
- Canonical fixed DB for forward/revert checks: `/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db`

## Canonical DB policy (required for future windows)

Use one fixed canonical DB snapshot as the source-of-truth for all future:

- preflight validation
- forward migration gates
- rollback restores

Do not use an arbitrary "newest" DB for planned windows once canonical has been established.

Create or refresh canonical snapshot only when the UI is confirmed healthy and user data is verified:

```bash
mkdir -p /home/cimply/git/open-webui/db-canonical
docker cp open-webui:/app/backend/data/webui.db /home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db
sha256sum /home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db > /home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db.sha256
```

## Remote access (LAN + SSH tunnel)

If Open WebUI runs on a remote host and you access it from your workstation, use an SSH local tunnel:

```bash
ssh -L 9090:localhost:3000 cimply@10.70.0.1
```

Then open:

- `http://localhost:9090`

Notes:

- Keep the SSH session open while using the UI.
- If local port `9090` is busy, change the first port (for example `9191:localhost:3000`) and browse that port locally.

## 1) Preflight and backup

```bash
cd /home/cimply/git/open-webui
TS=$(date '+%Y%m%d-%H%M%S')
BKP_DIR="/home/cimply/git/open-webui/db-restore-backups-$TS"
CANON="/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db"
mkdir -p "$BKP_DIR"

# Gate: canonical DB must exist for planned forward/revert windows
[ -f "$CANON" ] || { echo "Missing canonical DB: $CANON"; exit 1; }

# Save source candidate and current live DB
cp -a /home/cimply/git/open-webui/backend/data/webui.db "$BKP_DIR/source-most-recent-webui.db"
docker cp open-webui:/app/backend/data/webui.db "$BKP_DIR/live-before-restore-webui.db"

# Optional: also save prior in-container backup if present
PREV_BKP=$(docker exec open-webui sh -lc 'ls -1t /app/backend/data/webui.db.backup-* 2>/dev/null | head -n 1')
[ -n "$PREV_BKP" ] && docker cp open-webui:"$PREV_BKP" "$BKP_DIR/live-precopy-backup-webui.db" || true

# Checksums
sha256sum "$BKP_DIR"/*.db > "$BKP_DIR/SHA256SUMS.txt"
ls -lh "$BKP_DIR"
```

## 2) Preflight validation against canonical DB

Use user email + chat recency to confirm live DB still matches canonical source-of-truth:

```bash
python3 - <<'PY'
import sqlite3, os, datetime, glob
paths = [
    "/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db",
    "/home/cimply/git/open-webui/backend/data/webui.db",
]
for path in paths:
    print(f"\n=== {path} ===")
    if not os.path.exists(path):
        print("MISSING")
        continue
    con = sqlite3.connect(path); cur = con.cursor()
    cur.execute("select version_num from alembic_version")
    print("alembic:", cur.fetchone()[0])
    cur.execute("select email, active from auth")
    print("auth:", cur.fetchall())
    cur.execute("select count(*) from chat")
    print("chat_count:", cur.fetchone()[0])
    cur.execute("select max(updated_at) from chat")
    ts = cur.fetchone()[0]
    print("chat.max_updated_at:", ts, datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).isoformat() if ts else None)
    con.close()
PY
```

If canonical and live differ unexpectedly, stop and resolve before any migration.

## 3) Restore (swap in newest DB)

```bash
cd /home/cimply/git/open-webui
TS=$(date '+%Y%m%d-%H%M%S')
SRC="/home/cimply/git/open-webui/backend/data/webui.db"

docker compose stop open-webui

# In-container backup marker before overwrite
docker cp open-webui:/app/backend/data/webui.db /tmp/webui.db.pre-restore-$TS
docker cp /tmp/webui.db.pre-restore-$TS open-webui:/app/backend/data/webui.db.pre-restore-$TS

# Swap DB
docker cp "$SRC" open-webui:/app/backend/data/webui.db

docker compose start open-webui
sleep 3
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/
```

## 4) Verify after restore

```bash
# Verify account + chat count in live DB
docker exec -i open-webui python - <<'PY'
import sqlite3
con=sqlite3.connect('/app/backend/data/webui.db')
cur=con.cursor()
cur.execute("select version_num from alembic_version"); print("alembic", cur.fetchall())
cur.execute("select email,active from auth"); print("auth", cur.fetchall())
cur.execute("select count(*) from chat"); print("chat_count", cur.fetchall())
cur.execute("select max(updated_at) from chat"); print("chat.max_updated_at", cur.fetchall())
con.close()
PY

# Check startup logs
docker logs --since 3m open-webui | tail -n 120
```

## 5) Instant rollback

If login, non-msg ingestion, or retrieval regresses after a forward change:

```bash
cd /home/cimply/git/open-webui
docker compose stop open-webui
CANON="/home/cimply/git/open-webui/db-canonical/webui-fixed-canonical.db"
docker cp "$CANON" open-webui:/app/backend/data/webui.db
docker compose start open-webui
```

For same-session rollback, you can also restore the in-container snapshot:

```bash
docker compose stop open-webui
docker cp open-webui:/app/backend/data/webui.db.pre-restore-YYYYMMDD-HHMMSS /tmp/webui.rollback.db
docker cp /tmp/webui.rollback.db open-webui:/app/backend/data/webui.db
docker compose start open-webui
```

## 6) Conversion strategy (long-term stable path)

If logs show migration mismatch, for example:

- `Error: Can't locate revision identified by 'd31026856c01'`

then the DB schema lineage does not match the running image.

Recommended approach:

1. Short-term: keep service running on restored DB if operationally required.
2. Stabilize versioning:
   - Pin the Open WebUI image tag that matches your DB lineage, or
   - Migrate data through supported export/import flow instead of raw DB swaps.
3. Before future upgrades:
   - Snapshot `webui.db`.
   - Upgrade one version step at a time.
   - Validate login, chats, retrieval, and provider configs after each step.

## 7) Operational checklist

- Backup directory created and checksummed.
- Canonical DB exists and is used for forward/revert checks.
- Live DB validated against canonical before change window.
- Service returns HTTP `200`.
- Expected user can log in.
- Expected chat history is visible.
- Rollback command tested and documented.
