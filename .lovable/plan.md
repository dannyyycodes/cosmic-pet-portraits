

# Plan: Create N8N Bridge with Dedicated Auth Secret

## Approach
Option 1 — create a dedicated `N8N_BRIDGE_SECRET` with a user-chosen value, used as the bearer token for the n8n-bridge endpoint. Cleaner than reusing the service role key.

## Steps

1. **Add secret `N8N_BRIDGE_SECRET`** with value `littlesouls-n8n-2026` (or user's choice) using the secrets tool

2. **Create `supabase/functions/n8n-bridge/index.ts`**:
   - CORS handling
   - Auth: compare `Authorization: Bearer <token>` against `Deno.env.get("N8N_BRIDGE_SECRET")`
   - **POST** `{ reportId }` → read `pet_reports` row via service role client, return pet data fields
   - **PATCH** `{ reportId, reportContent }` → update `report_content` and `updated_at`
   - UUID validation on reportId

3. **Update `supabase/config.toml`** — add `verify_jwt = false` for n8n-bridge

## n8n Worker Usage

```
URL: https://asmyxhisubzbblhivnea.supabase.co/functions/v1/n8n-bridge
Header: Authorization: Bearer littlesouls-n8n-2026

Read:  POST  { "reportId": "uuid" }
Write: PATCH { "reportId": "uuid", "reportContent": { ... } }
```

