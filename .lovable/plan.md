

# Run SQL and Deploy Edge Functions

## 1. Database
The `redeem_codes` table already exists in the schema. I will insert the test record `QA-TEST-50` using the data insert tool.

## 2. Deploy Edge Functions
Deploy all three functions that the user reports as returning 404:
- `admin-redeem-codes`
- `redeem-free-code`
- `update-pet-data`

