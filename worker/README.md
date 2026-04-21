# Little Souls Report Worker

Deno-based report generator that turns a `pet_reports.id` into a finished Little Souls cosmic / memorial reading. Runs on DigitalOcean droplet `159.65.169.204` as a systemd service (`littlesouls-worker.service`) listening on port 3456.

## Files that run on the droplet

| File | Purpose |
|------|---------|
| `worker.ts` | Main entry. Reads a pet_reports row, builds the prompt, calls OpenRouter, patches the row with the finished report. |
| `memorial-prompt.ts` | Dedicated memorial prompt + schema. Invoked when `occasion_mode === "memorial"`. |
| `verifier.ts` | Deterministic + Haiku-backed guardrails: tense, language, placement citations, owner-insight weave, memorial anchor weave, genericness. |
| `report-schema.ts` | Zod schema for the cosmic (non-memorial) report. |
| `compatibility-reading.ts` | Separate worker for cross-pet compatibility (household of 2+ pets). Spawned by `server.ts`, not worker.ts. |
| `species-recipe-rules.ts` | Species-safe ingredient banlist for the recipe section. |
| `ephemeris.ts` / `ephemeris-v2.ts` / `chiron-table.ts` / `timezone.ts` | Astronomy + timezone helpers used by the planetary-position math. |

Everything else in this folder is tests, qa-harness, or legacy dev scripts — NOT shipped to the droplet.

## Pipeline

```
Stripe checkout
  → stripe-webhook edge fn (marks paid)
  → generate-report-background edge fn (POST to n8n webhook)
  → n8n workflow (POST to http://DROPLET:3456)
  → serve.sh listener (spawns `deno run worker.ts <reportId>`)
  → worker.ts fetches pet_reports row via n8n-bridge
  → OpenRouter (Sonnet 4.5, max_tokens 24k, response_format json_object)
  → verifier.ts (auto-fix + flag)
  → worker.ts PATCHes pet_reports.report_content
  → PaymentSuccess page picks up the completion via realtime subscription
```

## Deploy

```bash
bash scripts/deploy-worker.sh
```

What it does:
1. Backs up current droplet files with `.bak-pre-deploy-<SHA>-<TS>` suffix
2. `scp`s every production worker file from the repo
3. Runs `deno check` on the droplet to catch syntax errors
4. On failure, rolls back automatically
5. Appends a deploy marker to `/opt/littlesouls/worker.log`

`serve.sh` spawns a fresh `deno run` per incoming report, so code changes take effect on the next customer's reading — no `systemctl restart` needed unless `serve.sh` itself changes.

## Rollback

The deploy script prints a one-liner at the end. Or manually:

```bash
ssh root@159.65.169.204
cd /opt/littlesouls
ls -lt *.bak-pre-deploy-*
cp worker.ts.bak-pre-deploy-<SHA>-<TS> worker.ts
```

Older manually-timestamped backups (`*.bak-pre-occasion-routes-*`, `*.bak-1776...`) are also on the droplet.

## Local development

The worker depends on Deno permissions + env vars set on the droplet (`OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_BRIDGE_SECRET`, `SENTRY_DSN`). To run locally:

```bash
cd worker
deno check worker.ts verifier.ts memorial-prompt.ts
deno test test-*.ts   # runs the unit tests
```

Do NOT run the worker against the production Supabase URL from a laptop — you'll race with the droplet and clobber real reports. Use a scratch reportId + a dev bridge if you need to smoke-test live.

## Guardrails (verifier.ts)

Runs on every report after Sonnet 4.5 returns:

1. **Auto-fix** — replace banned words, swap wrong-gender pronouns, collapse "your owner" → "you"
2. **Pronoun balance** — flag >3 wrong-gender subject pronouns report-wide
3. **Placement citation** — every major narrative section must name a planet or sign
4. **Sign / degree mismatch** — critical severity if claimed placement ≠ calculated
5. **Recipe safety** — strip species-banned ingredients from the treat section
6. **Owner-insight weave** — if buyer provided soulType / superpower / strangerReaction, confirm each appears ≥2 times in the narrative (soft warning)
7. **Memorial anchor weave** — memorial-only: passed_date year, favoriteMemory signature word, rememberedBy essence must each appear ≥1 time
8. **Semantic (Haiku 4.5)** — tense check for memorial, language drift for non-English reports, genericness check for all reports

Critical issues trigger Sentry + Telegram alerts. Warnings log to worker.log but don't block delivery.

## Rules of the road

- Never change the model or max_tokens without explicit approval (cost + quality both swing)
- Never split generation — the worker expects one Sonnet call per report
- Don't edit Supabase edge functions that are in the Stripe → n8n → worker chain unless you also update the worker
- The memorial-prompt.ts is deliberately different from the cosmic prompt. Do not try to unify them
- `serve.sh` is 10 lines of bash and works. Don't replace it without a reason
