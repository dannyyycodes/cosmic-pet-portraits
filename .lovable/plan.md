

# Fix redeem-free-code: Add Missing Database Columns

## Problem
The `redeem-free-code` edge function fails with `PGRST204: Could not find the 'includes_portrait' column of 'pet_reports'`. The function also upserts into `chat_credits` using columns (`report_id`, `email`, `plan`) that don't exist on that table.

## Root Cause (from schema)
- `pet_reports`: has `includes_book` but missing `includes_portrait` and `redeem_code`
- `chat_credits`: exists but keyed on `order_id`, not `report_id`; missing `email` and `plan` columns

## Plan

### 1. Database migration to add missing columns
- Add `includes_portrait BOOLEAN DEFAULT false` to `pet_reports`
- Add `redeem_code TEXT` to `pet_reports`
- Add `report_id UUID` to `chat_credits` (with unique constraint)
- Add `email TEXT` to `chat_credits`
- Add `plan TEXT DEFAULT 'free'` to `chat_credits`

### 2. Update redeem-free-code edge function
- Change the `chat_credits` upsert to use `report_id` as the conflict target (since the existing table uses `order_id` as the column name, and the function tries `onConflict: "report_id"`). The function needs to match the actual schema.

### 3. Redeploy redeem-free-code
- Deploy after the migration and code fix so the schema cache picks up the new columns.

## Technical Detail
The `occasion_mode` column already exists on `pet_reports`. The `chat_credits` table already exists but needs additional columns for the redeem flow.

