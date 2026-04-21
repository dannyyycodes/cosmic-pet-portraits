#!/usr/bin/env bash
#
# deploy-worker.sh — ship the Deno worker to the Little Souls droplet.
#
# Why this exists: /opt/littlesouls/ on 159.65.169.204 is NOT under git.
# The repo is the source of truth; before today's work we were hand-scp'ing
# and the droplet drifted (repo had 187kb worker.ts, droplet had 169kb —
# 3 days of unshipped work). This script makes the deploy one command,
# with a timestamped backup on the droplet + a deno type-check afterwards.
#
# Usage:
#   bash scripts/deploy-worker.sh           # ships every worker/*.ts
#   bash scripts/deploy-worker.sh --dry     # shows what would change
#
# Prereqs: ssh key auth to root@159.65.169.204, deno on droplet.
# Rollback: ssh root@... "cp /opt/littlesouls/worker.ts.bak-pre-deploy-<TS> /opt/littlesouls/worker.ts"

set -euo pipefail

DROPLET_HOST="${DROPLET_HOST:-root@159.65.169.204}"
DROPLET_PATH="${DROPLET_PATH:-/opt/littlesouls}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_DIR="$REPO_ROOT/worker"

if [[ "${1:-}" == "--dry" ]]; then
  echo "[DRY] would ship these files from $WORKER_DIR → $DROPLET_HOST:$DROPLET_PATH/"
  ls -la "$WORKER_DIR"/*.ts
  exit 0
fi

# Files that actually run on the droplet. Excludes tests + dev scripts.
WORKER_FILES=(
  "worker.ts"
  "verifier.ts"
  "memorial-prompt.ts"
  "report-schema.ts"
  "compatibility-reading.ts"
  "species-recipe-rules.ts"
  "chiron-table.ts"
  "ephemeris-v2.ts"
  "ephemeris.ts"
  "timezone.ts"
)

# Commit SHA this deploy matches — written to backup filename + worker.log
SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
TS="$(date +%s)"
BACKUP_SUFFIX=".bak-pre-deploy-${SHA}-${TS}"

echo "[deploy] Branch: $(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "[deploy] SHA: $SHA"
echo "[deploy] Target: $DROPLET_HOST:$DROPLET_PATH"

# 1. Back up current droplet files (timestamped + SHA-labelled)
BACKUP_CMD="cd $DROPLET_PATH"
for f in "${WORKER_FILES[@]}"; do
  BACKUP_CMD+=" && [[ -f $f ]] && cp $f ${f}${BACKUP_SUFFIX}"
done
echo "[deploy] Backing up droplet files with suffix $BACKUP_SUFFIX"
ssh -o ConnectTimeout=15 "$DROPLET_HOST" "$BACKUP_CMD || true"

# 2. Ship the new files
LOCAL_FILES=()
for f in "${WORKER_FILES[@]}"; do
  LOCAL_FILES+=("$WORKER_DIR/$f")
done
echo "[deploy] scp'ing ${#LOCAL_FILES[@]} files..."
scp "${LOCAL_FILES[@]}" "$DROPLET_HOST:$DROPLET_PATH/"

# 3. Deno type-check on the droplet before traffic hits the new code.
# serve.sh spawns fresh `deno run` per report, so this catches syntax errors
# before the next incoming report blows up. We scope the check to the files
# we actively edit — ephemeris-v2.ts has pre-existing strict-mode type
# warnings that deno accepts at runtime, so gating deploy on them would
# false-trip every push. Use `set -o pipefail` to propagate deno's real
# exit code through the tail pipe.
echo "[deploy] Running deno check on droplet..."
CHECK_CMD="set -o pipefail; export PATH=/root/.deno/bin:\$PATH && cd $DROPLET_PATH && deno check worker.ts verifier.ts memorial-prompt.ts report-schema.ts 2>&1 | tail -60"
if ! ssh -o ConnectTimeout=30 "$DROPLET_HOST" "bash -c '$CHECK_CMD'"; then
  echo "[deploy] !! deno check FAILED — check output above"
  echo "[deploy] rolling back..."
  ROLLBACK_CMD="cd $DROPLET_PATH"
  for f in "${WORKER_FILES[@]}"; do
    ROLLBACK_CMD+=" && [[ -f ${f}${BACKUP_SUFFIX} ]] && cp ${f}${BACKUP_SUFFIX} $f"
  done
  ssh -o ConnectTimeout=15 "$DROPLET_HOST" "$ROLLBACK_CMD || true"
  exit 1
fi

# 4. Append a deploy marker to worker.log so we can correlate reports with SHAs
ssh -o ConnectTimeout=15 "$DROPLET_HOST" "echo '[deploy] $(date -Iseconds) — deployed SHA $SHA' >> $DROPLET_PATH/worker.log"

echo "[deploy] OK — SHA $SHA deployed. serve.sh hot-reloads per-report so next customer sees new code."
echo "[deploy] Rollback one-liner:"
echo "  ssh $DROPLET_HOST \"cd $DROPLET_PATH && for f in ${WORKER_FILES[*]}; do [[ -f \${f}${BACKUP_SUFFIX} ]] && cp \${f}${BACKUP_SUFFIX} \${f}; done\""
