
# Make Variant C Default + Phase 3: Warm Theme Everywhere

## Part 1: Make Variant C the Default

A single change to `src/contexts/ABTestContext.tsx`:
- Change the default `useState` initial value from `"A"` to `"C"`
- Change the `assignVariant()` function to always return `"C"` (100% traffic to C)
- URL param `?variant=A` or `?variant=B` still works for testing old designs
- Existing users with `localStorage` set to A or B will keep their variant until they clear storage (or you can force override -- your call)

This means all NEW visitors immediately see the warm design.

---

## Part 2: Phase 3 -- Apply Warm Theme to All Other Pages

These pages currently use `StarfieldBackground` (dark cosmic stars) and cosmic-styled components. For Variant C users, they need the warm treatment.

### Pages to Update (10 files)

**1. `src/components/intake/IntakeWizard.tsx`**
- Replace `StarfieldBackground` with `VariantBackground` (or conditionally render warm gradient for C)
- Replace `CosmicProgress` bar styling for Variant C (warm colors instead of cosmic glow)
- Update the wrapper div's `bg-background` -- the CSS variables already handle this via the body class, so no change needed there
- Update the `CosmicLoading` screen -- for Variant C, use warm styling instead of starfield

**2. `src/pages/Auth.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Update form card styling: white card with soft shadow for C, dark glass for A/B
- Update button: coral CTA for C, cosmic button for A/B
- Update text colors to work on light background

**3. `src/pages/GiftPurchase.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Update tier cards: white cards with soft shadows for C
- Update CTA buttons: coral for C
- Keep the same tier pricing and logic

**4. `src/pages/ViewReport.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Update email verification form styling for C
- Report viewer itself can stay as-is (it has its own internal styling)

**5. `src/pages/MyReports.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Update report list cards: white cards for C
- Update buttons and text for light background

**6. `src/pages/Blog.tsx`**
- Already uses `Navbar` (which is variant-aware now)
- Add warm background and card styling for Variant C
- Update filter buttons and post cards

**7. `src/pages/Contact.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Replace `CosmicButton` with standard coral Button for C
- Update form card and input styling

**8. `src/pages/BecomeAffiliate.tsx`**
- Replace `StarfieldBackground` with variant-aware background
- Replace `CosmicButton` with coral Button for C
- Update info cards and form styling

**9. `src/pages/PaymentSuccess.tsx`**
- Update report reveal and generation screens for warm styling in C
- The cinematic reveal can keep its own styling

**10. `src/pages/RedeemGift.tsx`**
- Replace cosmic background with warm variant
- Update gift redemption form styling

### Shared Component Updates

**11. `src/components/cosmic/StarfieldBackground.tsx`** -- No changes needed (A/B still use it)

**12. `src/components/ExitIntentPopup.tsx`** -- Update popup styling for Variant C (warm card instead of dark glass)

**13. `src/components/StickyMobileCTA.tsx`** -- Update to use coral CTA on warm background for C

### Implementation Approach

Rather than rewriting every page, the cleanest approach is:

1. Create a **`useVariantStyles()`** hook that returns conditional class strings (e.g., card styles, button variants) based on the current variant
2. Create a **`VariantStarfield`** wrapper component that renders `StarfieldBackground` for A/B and nothing (or warm gradient) for C -- this replaces all 8+ instances of `StarfieldBackground` across pages with a single swap
3. Update each page to use these shared utilities

This keeps changes minimal and consistent.

---

## Technical Summary

| Action | Files |
|--------|-------|
| Make C default | `src/contexts/ABTestContext.tsx` (1 file) |
| Create variant utilities | `src/hooks/useVariantStyles.ts`, update `src/components/variants/VariantBackground.tsx` (2 files) |
| Update pages for warm theme | Auth, GiftPurchase, ViewReport, MyReports, Blog, Contact, BecomeAffiliate, PaymentSuccess, RedeemGift (9 pages) |
| Update intake wizard | `src/components/intake/IntakeWizard.tsx` (1 file) |
| Update shared components | ExitIntentPopup, StickyMobileCTA (2 files) |
| **Total** | **~15 files** |

No database changes. No new dependencies. Variants A and B remain fully functional via `?variant=A` or `?variant=B`.
