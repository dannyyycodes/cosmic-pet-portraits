# Ethics Gate — Five Love Test (memorial content only)

> **Applies to:** Bridge Friday memorial slot only. Codex MUST run every memorial caption through this gate before saving the manifest. ANY gate failing = block, flag for human rewrite, do not auto-publish.

This is the inheritable ethics floor for grief marketing — encoded from `feedback_ethics_marketing_grief.md` in the vault. The point is not to constrain creativity; it's to ensure that nothing we publish trades on someone's grief for clicks.

## The Five Tests

### Test 1 — Silent Click

> **The viewer who never clicks anywhere should still receive real value from the post itself.**

Real value = permission to feel, company in the loneliness, words for what they couldn't articulate, the recognition that someone else has been here.

**Pass:** "Nobody tells you it lasts. It just gets quieter — like a song that doesn't end, just turns down."
**Fail:** "Memorial portraits help heal grief. Order yours today."

### Test 2 — Friend Test

> **Strip the bio link, the brand reference, the CTA. Would you send this to a grieving friend in a private DM?**

If the answer is "no, this would feel weird without context" — the post is too sales-shaped. Rewrite until it would land in a friend's inbox without looking like an ad.

**Pass:** A post that, sans link, reads as a quiet message of company.
**Fail:** A post where the emotional content only makes sense as setup for the CTA.

### Test 3 — Honest Promise

> **Never use the language of "closure", "healing from", "moving on", "getting over". Only use the language of "sitting with", "less lonely", "still here in the things you do".**

Grief is not a problem to be solved. The portrait is not a fix. The honest promise is presence, not resolution.

**Pass:** "They're still here, in the things you keep doing without meaning to."
**Fail:** "Find closure with a memorial portrait."
**Fail:** "Heal from your loss."
**Fail:** "Move forward together."

### Test 4 — Exploitation Test

> **The emotional arc must be: feel-seen → feel-less-alone → explore (when ready). Never: feel-bad → feel-worse → buy-now.**

A reader should leave the post feeling slightly more accompanied than when they arrived. If the post amplifies grief without offering quiet company alongside it, it fails.

**Pass:** Post acknowledges the ache, sits with the reader, mentions the option once gently, and closes without pressure.
**Fail:** Post lists the worst aspects of grief, intensifies them, then offers the product as the only relief.

### Test 5 — No False Precision

> **No invented statistics. No fake "thousands of grieving owners". No quoted testimonial that wasn't actually said.**

If a number appears in the caption, it must be verifiable. If a quote appears, it must be either real (with permission) or clearly framed as composite ("a woman I sat with" — felt-sense, not invented person).

**Pass:** "Some pets come home wary." (universal, no false precision)
**Pass:** "A woman I know got a portrait done quietly afterwards" (composite witness — clearly felt-sense)
**Fail:** "Studies show 87% of pet owners benefit from memorial art." (made up)
**Fail:** "Sarah, mum of three, said: 'It changed my life.'" (invented testimonial)

## How Codex applies the gate

Before writing the manifest for Bridge Friday, Codex must:

1. Generate the caption per the Bridge Friday slot brief.
2. Read it back through each of the five tests above.
3. For each test, write a one-line `gate_result` field with: `PASS — <one-line reasoning>` OR `FAIL — <which test, why>`.
4. If ANY test fails: do NOT save the manifest as `awaiting_review`. Save it as `flagged_for_human_rewrite` with the failing test annotation, and stop.
5. If ALL FIVE pass: save with `gate_passed: true` and `awaiting_review` status.

Add this block to the Bridge Friday manifest:

```json
{
  "ethics_gate": {
    "test_1_silent_click": "PASS — viewer gets value (permission, company) without clicking",
    "test_2_friend_test": "PASS — would land in a grieving friend's DM without context",
    "test_3_honest_promise": "PASS — language is 'sitting with', not 'closure'",
    "test_4_exploitation": "PASS — feel-seen → feel-less-alone arc, no buy-now pressure",
    "test_5_no_false_precision": "PASS — composite witness ('a woman I sat with'), no invented stats",
    "gate_passed": true
  }
}
```

If any test fails, save instead:

```json
{
  "ethics_gate": {
    "test_3_honest_promise": "FAIL — caption uses 'find closure' language; rewrite needed",
    "gate_passed": false
  },
  "status": "flagged_for_human_rewrite"
}
```

## When to apply the gate to non-memorial content

The Five Love Test is mandatory for Bridge Friday. It's also worth informally applying to:

- Any Reveal Monday or Transformation Story post that involves a senior or rescue with backstory implying loss.
- Any post that names a passing pet (even in passing).
- Any cross-post that gets re-routed from real customer memorial submissions.

For non-memorial slots, the gate runs as advisory — flag in `gate_advisory_notes` but don't block.

## Reference

Full ethics rationale: `vault/03-resources/memory/feedback/feedback_ethics_marketing_grief.md`
Storytelling skill ethics section: `littlesouls-angle-prompt` skill — "no time-heals energy / no silver linings / no at-least"
