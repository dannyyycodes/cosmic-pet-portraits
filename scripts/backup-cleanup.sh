#!/usr/bin/env bash
#
# backup-cleanup.sh — prune old worker backup files on the Little Souls droplet.
#
# scripts/deploy-worker.sh stamps a timestamped .bak on every deploy so we can
# roll back instantly. Over months that turns into disk pressure — this cron
# keeps only the most recent 5 per file + logs total dir size so Danny can spot
# growth trends.
#
# Intended to run via systemd timer or cron on the droplet:
#   0 2 * * *  /opt/littlesouls/backup-cleanup.sh
#
# Ship with: bash scripts/deploy-backup-cleanup.sh   (see sibling script).

set -euo pipefail

LS_DIR="${LS_DIR:-/opt/littlesouls}"
LOG="${LS_BACKUP_LOG:-/var/log/littlesouls-backup-size.log}"
KEEP_PER_FILE="${LS_BACKUP_KEEP:-5}"

cd "$LS_DIR"

# Files we back up on each deploy. Matches scripts/deploy-worker.sh.
FILES=(
  worker.ts
  verifier.ts
  memorial-prompt.ts
  report-schema.ts
  compatibility-reading.ts
  species-recipe-rules.ts
  chiron-table.ts
  ephemeris-v2.ts
  ephemeris.ts
  timezone.ts
)

total_deleted=0
for f in "${FILES[@]}"; do
  # Match every backup suffix we've used: .bak, .bak2, .bak3, .bak-<ts>,
  # .bak-pre-occasion-routes-<ts>, .bak-pre-deploy-<sha>-<ts>, etc.
  mapfile -t stale < <(ls -t "${f}".bak* 2>/dev/null | tail -n +$((KEEP_PER_FILE + 1)))
  for old in "${stale[@]}"; do
    [[ -z "$old" || ! -f "$old" ]] && continue
    rm -f "$old"
    total_deleted=$((total_deleted + 1))
  done
done

dir_size="$(du -sh "$LS_DIR" 2>/dev/null | awk '{print $1}')"
bak_count="$(ls "$LS_DIR"/*.bak* 2>/dev/null | wc -l || echo 0)"

mkdir -p "$(dirname "$LOG")"
echo "$(date -Iseconds) | deleted=${total_deleted} | remaining_baks=${bak_count} | dir_size=${dir_size}" >> "$LOG"
