

# Fix Two Build Errors

## Error 1: DatingProfile type mismatch (`CosmicReportViewer.tsx:424`)

The `types.ts` file defines `datingProfile` as `{title, headline, bio, lookingFor}` but the `DatingProfile` component expects `{headline, bio, greenFlags: string[], redFlags: string[]}`. The component interface needs to match what the report data actually provides.

**Fix**: Update the `DatingProfileProps` interface in `DatingProfile.tsx` to accept the type from `types.ts` (`title`, `headline`, `bio`, `lookingFor`) and make `greenFlags`/`redFlags` optional. Also update `types.ts` to include `greenFlags` and `redFlags` as optional fields (the AI generates them sometimes). This makes both directions compatible.

Specifically:
- In `src/components/report/types.ts` lines 123-128: add `greenFlags?: string[]` and `redFlags?: string[]` as optional fields alongside the existing ones
- In `src/components/report/DatingProfile.tsx` lines 5-12: update the interface to match — make `greenFlags` and `redFlags` optional (`string[]` → `string[] | undefined`), add `title?: string` and `lookingFor?: string`

## Error 2: Invalid CSS property (`AffiliateDashboard.tsx:190`)

Line 190 uses `focusRingColor` in a `style` prop, which isn't a valid CSS property.

**Fix**: Remove `focusRingColor: '#c4a265'` from the inline style object and use `focus:ring-[#c4a265]` in the className instead, or simply remove it since the input already has `focus:ring-2` and `transition-all`.

## Deployments

After fixing the build errors:
1. Run the `redeem_codes` migration SQL (create table + index)
2. Deploy 4 edge functions: `admin-redeem-codes`, `redeem-free-code`, `admin-coupons`, `create-checkout`

