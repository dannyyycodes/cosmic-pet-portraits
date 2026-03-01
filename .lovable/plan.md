

# Issue: Missing `orders` table

The SQL migration references `REFERENCES orders(id)` but no `orders` table exists. The project uses `pet_reports` as the primary order record.

## Options

1. **Replace `orders(id)` with `pet_reports(id)`** — The `order_id` columns would reference `pet_reports` instead. This aligns with the existing codebase where report IDs are used as order identifiers throughout.

2. **Create an `orders` table first** — But nothing in the current codebase uses it, so this would be dead infrastructure.

## Additional fixes needed

1. **`create-chat-purchase/index.ts`** — Has a TS error: `creditTiers[type]` needs a type assertion since `type` is `any`. Fix: `const tier = creditTiers[type as keyof typeof creditTiers]`.

2. **`soul-chat/index.ts`** — Already exists in the codebase. Need to verify it's compatible with the new tables.

## Proposed plan

1. Run migration with `pet_reports(id)` instead of `orders(id)` (or confirm if you want an `orders` table created)
2. Fix the TS error in `create-chat-purchase`
3. Deploy both edge functions

## Security note

The RLS policies in the SQL are fully open (anonymous read/insert/update). This means anyone can read, create, and modify chat credits and messages without authentication. This is intentional for the anonymous chat flow but worth noting.

