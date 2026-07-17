# Protected patterns — the /v2 funnel lockfile

Status: LOCKED. Created 2026-07-17 from the CRO audit synthesis (B12).
Canonical copy in the repo at `docs/protected-patterns.md`; mirrored to the
vault at `vault/projects/little-souls/protected-patterns.md`.

Every pattern below was verified by the 2026-07 audits as measured-practice
correct. They are the parts of the funnel that are already doing the
converting. The most common way funnels degrade is a well-meaning edit that
regresses a working pattern, so: **do not change any of these without an A/B
test or Danny's explicit sign-off.** If a task appears to require touching
one, stop and flag it first.

Main surfaces: `src/components/funnel-v2/ReadingsLanding.tsx`,
`InlineCheckout.tsx`, `DossierCheckout.tsx`, `src/lib/intent.ts`.

## 1. Register tense-toggle (discovery vs memorial)

The "Here with you / Held in memory" chooser and the whole-page tense rewrite
it drives. Memorial-targeted links carry `?r=memorial` and open in past tense
before first paint. Grief is never fixed: the visible toggle stays for every
arrival and either state can be flipped at any time. Neither answer changes
price or tier.
Do not: remove the toggle, hard-lock a register, or let discovery copy
("they are probably in the room with you") reach a memorial arrival.

## 2. Reduced-motion reads finished at rest

With `prefers-reduced-motion: reduce`, every surface renders complete and
static: deck as a static column, reveals pre-seated, no reveal-dependent
content stuck at opacity 0. Evidence class: accessibility requirement plus
verified correct in the audits.
Do not: add any animation whose end state is required to read the page.

## 3. The 4-ask form, email last, NO field creep

Exactly four asks before the free reading: name (optional), birth/adoption
date, species (one tap), email. Field-count evidence is among the most
consistently confirmed in the record (fewer fields converts; the Expedia
one-field deletion is the canonical case). Breed, gender, time of birth,
phone, or any richer-personalisation ask goes AFTER the free reading if it
ever exists at all.
Do not: add a field, reorder email away from last, or make name/photo
required.

## 4. Unknown-birthday reassurance at the objection point

The line under the date field ("Or the day they came home. That chart is
just as true.") sits exactly where the "I don't know their birthday"
objection fires. It also honours the astrology (adoption-date chart is a
real convention).
Do not: move it away from the date field or cut it for space.

## 5. autocomplete="off" on the pet-name field

Browsers autofill the owner's own name into that field without it. Pet name
is not a human-name field; keep `autoComplete="off"` (plus
`autoCapitalize="words"`).

## 6. Deck interaction model

Tap-through zones (left edge back, rest forward), vertical swipe advance,
thumb-zone Next button, one-wheel-gesture-one-card, and NO internal card
scrolling (only the terminal tease card scrolls). The traffic is
story-trained; tap-through is the native gesture.
Do not: replace tap-through with scroll, shrink the touch targets, or make a
card's content overflow-scroll.

## 7. Card 8 endowed-progress structure and per-card sealed teasers

The synthesis card's "X of 13 already read" frame (Nunes & Dreze endowed
progress, 19% to 34% completion in the original experiment) and the one-line
sealed teaser each card carries. The "1 OF 13" counter is NOT a bug: it
double-duties as the sell's endowment frame. Relabelling it to "1 of 8" is
an experiment (see the synth testFirst pile), never a quiet fix.

## 8. Honest curiosity engine: 5 lit, 8 sealed, real sample line

The sell names the five placements the visitor already holds and the eight
still sealed, with a sample line quoted from a genuinely sealed placement
(Saturn, Chiron fallback) computed from THIS pet's chart. Information-gap
structure, no invented scarcity.
Do not: quote a placement the free deck already gave, invent a fake excerpt,
or add urgency mechanics to the sealed doors.

## 9. Collapsed promo-code field

The promo field stays collapsed behind a quiet link until asked for
(Baymard: an open promo field sends buyers off-site hunting codes).
Do not: render an always-open promo input at checkout.

## 10. Email kept, with change path

The email captured at the form prefills the checkout and stays editable
there. Never make the buyer retype it; never lock it either.

## 11. Sticky price CTA

The sticky "Begin Their Reading" bar (mobile and desktop, discovery path
only, never memorial) that rides from the desire peak until the checkout is
on screen, showing the live price. The checkout price card itself stays
sticky-in-view on desktop.
Do not: remove the bar, hide the price on it, or enable it on the memorial
path.

## 12. Refund promise appears exactly twice

The refund sentence lives in exactly two places per register (stack/trust
item plus the guarantee line near the CTA). Never a third repeat, never
zero. The sentence itself is load-bearing trust copy; wording changes are
Danny's call only.

## 13. Blemished 4-star review beside the price

The imperfect reviews (the 4-star Martin C. pattern, Alan R. "took closer to
a day", Colin B.) stay visible among the first readable cards, beside the
price. Spiegel: purchase likelihood peaks at 4.0 to 4.7 average and FALLS
toward 5.0; the blemishing effect is doing the converting.
Do not: "improve" a 4-star review to 5, bury the blemished ones, or display
an aggregate rating/review count without real order data (DMCC banned-
practice exposure).

## 14. Zero fake urgency, anywhere

No countdowns, no stock counters, no "X people are viewing", no invented
deadlines, ever. Banned by product law and unnecessary: the honest
information-gap engine is the page's persuasion mechanism. Also part of the
same law family: no "report" as a product word, no AI mentions in user-facing
copy, violet+white palette (gold only in star fills).

## 15. Payment badges mirror the Stripe session (B10)

All payment-method badges render through the ONE shared component
`src/components/funnel-v2/PaymentMethodsRow.tsx`, which encodes the verified
server truth (horoscope-bundled sessions narrow to card + Link; only pure
memorial carts offer Klarna).
Do not: hardcode a payment badge row anywhere, or show a method the session
will not offer. If `create-checkout`'s `payment_method_types` lists change,
update PaymentMethodsRow in the same commit.

## 16. Measurement spine observes only

The `src/lib/funnelSpine.ts` events (register_set, form_start, form_error,
form_submit, chart_computed, card_advance, sell_view, checkout_view,
checkout_submit) are fire-and-forget and swallow every failure. Analytics
must never gate, delay, or change funnel behaviour. Purchase truth is
server-side via the Stripe webhook, never a client event.
