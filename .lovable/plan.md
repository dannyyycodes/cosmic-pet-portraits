
Problem identified:
- The create request is not reaching the backend handler. Your browser sends `X-Admin-Token` on create/list calls, but `admin-redeem-codes` CORS currently does not allow that header.
- Result: preflight fails in browser, UI shows `Failed to create code`, and no code is inserted.
- I also confirmed `redeem_codes` currently has no records, so there isn’t an existing test code to use yet.

Plan to fix and unblock you fast:

1) Fix backend CORS + action parsing (primary blocker)
- Update `supabase/functions/admin-redeem-codes/index.ts`:
  - Add `x-admin-token` (and standard client headers) to `Access-Control-Allow-Headers`.
  - Keep CORS headers on all responses.
  - Accept `action` from either query string OR request body (for more reliable client calls).

2) Make frontend calls more robust
- Update `src/pages/AdminRedeemCodes.tsx`:
  - Stop calling with `admin-redeem-codes?action=...` in function name.
  - Call `admin-redeem-codes` and pass `action` inside `body` (`list/create/toggle/delete`).
  - Keep `X-Admin-Token` header.
  - Improve error toast to show backend error text when available.

3) Prevent same issue in related admin flows
- Apply same CORS header fix to `supabase/functions/admin-coupons/index.ts` (it has the same header gap and can fail similarly).

4) Validate end-to-end and produce your test code
- Open `/admin/redeem-codes`.
- Use “Quick Create: Test Code (1 use)”.
- Confirm row appears in table and is active.
- Share the generated code back to you for immediate testing in `/redeem-code`.

Technical details (exact root cause):
- `admin-redeem-codes` currently allows only:
  `authorization, x-client-info, apikey, content-type`
- Frontend sends:
  `x-admin-token` + the above
- Missing allowed header causes browser-level NetworkError before function logic runs.
