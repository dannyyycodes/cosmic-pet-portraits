

# Purchase-First Flow + 50/50 Traffic Split + Conversion Tracking

## Summary

Two major changes:
1. **50/50 A/C traffic split** with conversion tracking per variant
2. **Variant C purchase-first flow**: Landing page CTA → Checkout (Stripe captures email) → Post-purchase mini-intake → Report

No separate email step — Stripe handles email collection during checkout. Minimal friction.

---

## Technical Details

### 1. 50/50 Traffic Split

**File: `src/contexts/ABTestContext.tsx`**

Change `assignVariant()` from always returning `"C"` to a 50/50 random split:
```
const assignVariant = (): ABVariant => {
  return Math.random() < 0.5 ? "A" : "C";
};
```

Existing visitors keep their stored variant (localStorage). Only new visitors get randomly assigned. URL override (`?variant=A` / `?variant=C`) still works for testing.

### 2. Conversion Tracking Per Variant

The analytics system already tracks `ab_variant` in every event via `usePageAnalytics.ts` (line 33-37). Page views, scroll depth, CTA clicks, and section views all include the variant.

**Additional tracking needed:**

**File: `supabase/functions/create-checkout/index.ts`**
- Add `ab_variant` to the Stripe checkout session metadata (passed from frontend)
- This lets you query Stripe or your `page_analytics` table to see conversion rates per variant

**File: `src/components/intake/IntakeWizard.tsx`**
- Pass the current AB variant when calling `create-checkout` so it's stored in Stripe metadata

**File: `src/components/intake/CheckoutPanel.tsx`**
- Accept and forward `abVariant` prop

### 3. Variant C Purchase-First Flow

The key insight: for Variant C, users click a CTA on the landing page and go straight to a **checkout page** (not a 13-step intake). Stripe captures their email. After payment, they fill in 5 quick pet details.

#### New Flow Architecture

```text
Variant A (unchanged):
  Landing → /intake → [13 steps] → Email → Checkout → Stripe → /payment-success → Report

Variant C (new):
  Landing → /checkout (new page) → Stripe (captures email) → /payment-success → [5-step mini-intake] → Report
```

#### File: `src/pages/QuickCheckout.tsx` (NEW)
A new standalone checkout page for Variant C:
- Shows two tier cards ($27 Standard / $35 Premium with Portrait)
- Optional photo upload for Premium tier
- Single "Pay Now" button → creates a temporary report record with minimal data, then calls `create-checkout`
- Stripe Checkout handles email capture (no email step needed)
- Accepts `?tier=premium` URL param to pre-select tier from landing page CTAs
- Styled with the warm buttery Variant C theme
- Includes trust badges (Trustpilot, money-back guarantee, secure payment icons)

#### File: `src/pages/PaymentSuccess.tsx` (MODIFIED)
After Stripe payment succeeds for Variant C purchases:
- Detect that pet data is incomplete (no name/species/gender/DOB in the report record)
- Show a 5-step mini-intake wizard inline:
  1. Pet Name
  2. Species (with breed auto-suggest)
  3. Gender
  4. Date of Birth
  5. Photo upload (if Premium tier — pre-filled if already uploaded at checkout)
- After completing, update the report record via an edge function call, then trigger report generation
- For Variant A, behavior is unchanged (report data already exists)

#### File: `supabase/functions/create-checkout/index.ts` (MODIFIED)
- Support a new "quick checkout" mode where `reportId` may not exist yet
- Accept `quickCheckout: true` flag — creates the report record server-side with just email (from Stripe) and tier selection
- Or: accept a pre-created report with minimal data (just a placeholder email like `pending@checkout`)
- Update server-side TIERS pricing:
  - `basic`: 2700 cents ($27) for Variant C
  - `premium`: 3500 cents ($35) for Variant C
  - Keep existing pricing for Variant A ($35/$50/$129)
- The variant is passed in the request to determine pricing

#### File: `supabase/functions/update-pet-data/index.ts` (NEW)
New edge function for post-purchase pet data update:
- Accepts: `reportId`, `petName`, `species`, `breed`, `gender`, `birthDate`, `photoUrl`
- Updates the existing `pet_reports` row
- Then triggers report generation (calls `generate-cosmic-report` internally or returns so frontend can trigger it)
- Validates that the report's `payment_status` is `paid` before allowing updates

#### File: `src/App.tsx` (MODIFIED)
- Add route: `/checkout` → `QuickCheckout` page

#### CTA Link Updates (Variant C only)
All Variant C CTAs currently link to `/intake?mode=discover`. Change to `/checkout?tier=premium`:

- **`src/components/variants/variant-c/HeroVariantC.tsx`**: CTA button link
- **`src/components/variants/variant-c/CTAVariantC.tsx`**: Mid and final CTA buttons
- **`src/components/variants/variant-c/PricingPreview.tsx`**: Tier card buttons → `/checkout?tier=basic` and `/checkout?tier=premium`
- **`src/pages/Index.tsx`**: "Two Options" cards → `/checkout` for "For My Pet"
- **`src/components/StickyMobileCTA.tsx`**: Mobile CTA → `/checkout?tier=premium` (for Variant C only, keep `/intake` for A)

#### File: `src/components/intake/CheckoutPanel.tsx` (MODIFIED)
- Update TIERS pricing to match:
  - basic: 2700 ($27) — used when variant is C
  - premium: 3500 ($35) — used when variant is C
  - Keep old pricing for variant A/B
- Accept variant prop to determine which pricing to show

### 4. What Stays the Same
- Variant A: completely untouched, same 13-step intake → checkout flow
- Gift flow: unchanged
- All existing edge functions besides `create-checkout`: unchanged
- Database schema: unchanged (pet_reports table already has all needed columns)

---

## Files Summary

| File | Change |
|------|--------|
| `src/contexts/ABTestContext.tsx` | 50/50 A/C split |
| `src/pages/QuickCheckout.tsx` | **NEW** — standalone checkout page for Variant C |
| `src/pages/PaymentSuccess.tsx` | Add post-purchase mini-intake for Variant C |
| `supabase/functions/create-checkout/index.ts` | Support quick checkout mode, variant-specific pricing ($27/$35) |
| `supabase/functions/update-pet-data/index.ts` | **NEW** — post-purchase pet data update |
| `src/App.tsx` | Add `/checkout` route |
| `src/components/variants/variant-c/HeroVariantC.tsx` | CTA → `/checkout` |
| `src/components/variants/variant-c/CTAVariantC.tsx` | CTAs → `/checkout` |
| `src/components/variants/variant-c/PricingPreview.tsx` | Tier buttons → `/checkout?tier=X` |
| `src/pages/Index.tsx` | Options cards → `/checkout` for Variant C |
| `src/components/StickyMobileCTA.tsx` | Mobile CTA → `/checkout` for Variant C |
| `src/components/intake/CheckoutPanel.tsx` | Variant-specific pricing |

**New edge functions: 1** (`update-pet-data`)
**New pages: 1** (`QuickCheckout`)
**Database changes: none**

