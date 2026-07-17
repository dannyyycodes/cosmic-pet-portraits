# astroEngine worked verification examples

Hand-verified expected output for `astroEngine.ts`. Three charts: one real
(the live fixture), two constructed to exercise the tables and edge cases.
Every aspect below was computed by hand from the longitudes and then
cross-checked against the engine (compiled and executed 2026-07-16, all
matched). If you change the engine, these tables are the spot-check.

Typecheck: `npx tsc --noEmit --strict src/components/funnel-v2/astroEngine.ts`
from the repo root must exit 0.

## How the maths works (two worked pairs)

Absolute longitude = sign index x 30 + within-sign degree.

Worked pair 1 (Chart A): Mercury Cancer 17 and Saturn Capricorn 18.

- Mercury: Cancer is sign index 3, so 3 x 30 + 17 = 107
- Saturn: Capricorn is sign index 9, so 9 x 30 + 18 = 288
- Separation: |107 - 288| = 181, over 180 so 360 - 181 = 179
- Nearest aspect angle: 180 (opposition). Orb = |179 - 180| = 1
- 1 is inside the 8 degree opposition orb: Mercury opposite Saturn, orb 1, exact

Worked pair 2 (Chart B, wrap-around at 0 Aries): Venus Pisces 27 and
Mercury Aries 1.

- Venus: 11 x 30 + 27 = 357. Mercury: 0 x 30 + 1 = 1
- Separation: |357 - 1| = 356, over 180 so 360 - 356 = 4
- Nearest angle: 0 (conjunction). Orb 4, inside the 8 degree orb
- Venus conjunct Mercury across the 0 Aries boundary, orb 4, wide

Orb rules: conjunction 8, opposition 8, trine 8, square 7, sextile 4.
Any pair including Chiron, the North Node or Lilith tightens to 3.
Exactness: orb <= 1 exact, <= 3 close, else wide.

---

## Chart A: the fixture, 2019-06-15 (REAL)

Live output of the production pet-birth-chart edge function
(`https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/pet-birth-chart?date=2019-06-15`,
fetched 2026-07-16). This is the free-reading demo chart (Monty). The same
ten classical positions appear in `CosmicBridge.tsx` CHART_BODIES.

| Body | Sign | Degree | Abs lon |
|---|---|---|---|
| Sun | Gemini | 23 | 83 |
| Moon | Sagittarius | 1 | 241 |
| Mercury | Cancer | 17 | 107 |
| Venus | Gemini | 7 | 67 |
| Mars | Cancer | 19 | 109 |
| Jupiter | Sagittarius | 18 | 258 |
| Saturn | Capricorn | 18 | 288 |
| Uranus | Taurus | 5 | 35 |
| Neptune | Pisces | 18 | 348 |
| Pluto | Capricorn | 22 | 292 |
| Chiron | Aries | 5 | 5 |
| North Node | Cancer | 18 | 108 |
| Lilith | Virgo | 4 | 154 |

### Expected aspects (exactly 22, tightest first)

| Aspect | Separation | Orb | Exactness |
|---|---|---|---|
| Saturn sextile Neptune | 60 | 0 | exact |
| Jupiter square Neptune | 90 | 0 | exact |
| Neptune trine North Node | 120 | 0 | exact |
| Saturn opposite North Node | 180 | 0 | exact |
| Mercury conjunct North Node | 1 | 1 | exact |
| Mars conjunct North Node | 1 | 1 | exact |
| Mercury trine Neptune | 119 | 1 | exact |
| Mars trine Neptune | 121 | 1 | exact |
| Uranus trine Lilith | 119 | 1 | exact |
| Mercury opposite Saturn | 179 | 1 | exact |
| Mars opposite Saturn | 179 | 1 | exact |
| Mercury conjunct Mars | 2 | 2 | close |
| Venus sextile Chiron | 62 | 2 | close |
| Moon square Lilith | 87 | 3 | close |
| Venus square Lilith | 87 | 3 | close |
| Mars opposite Pluto | 177 | 3 | close |
| Saturn conjunct Pluto | 4 | 4 | wide |
| Neptune sextile Pluto | 56 | 4 | wide |
| Sun square Neptune | 95 | 5 | wide |
| Sun opposite Jupiter | 175 | 5 | wide |
| Mercury opposite Pluto | 175 | 5 | wide |
| Moon opposite Venus | 174 | 6 | wide |

Near-miss worth knowing: Moon to Chiron separation is 124, a trine orb of 4,
which is OUTSIDE the tightened 3 degree orb for Chiron pairs. Correctly
excluded.

### Expected dignities

| Planet | Sign | Status | Score |
|---|---|---|---|
| Mars | Cancer | fall | -4 |
| Jupiter | Sagittarius | domicile | +5 |
| Saturn | Capricorn | domicile | +5 |
| Neptune | Pisces | domicile (modern) | +5 |
| Sun, Moon, Mercury, Venus, Uranus, Pluto | (various) | peregrine | 0 |

### Expected decans (Chaldean face ruler / triplicity sub-sign)

| Body | Placement | Decan | Face | Triplicity |
|---|---|---|---|---|
| Sun | Gemini 23 | 3 (20-29) | Sun (ITS OWN FACE) | Aquarius / Uranus |
| Moon | Sagittarius 1 | 1 (0-9) | Mercury | Sagittarius / Jupiter |
| Mercury | Cancer 17 | 2 (10-19) | Mercury (ITS OWN FACE) | Scorpio / Pluto |
| Venus | Gemini 7 | 1 (0-9) | Jupiter | Gemini / Mercury |
| Mars | Cancer 19 | 2 (10-19) | Mercury | Scorpio / Pluto |
| Jupiter | Sagittarius 18 | 2 (10-19) | Moon | Aries / Mars |
| Saturn | Capricorn 18 | 2 (10-19) | Mars | Taurus / Venus |
| Uranus | Taurus 5 | 1 (0-9) | Mercury | Taurus / Venus |
| Neptune | Pisces 18 | 2 (10-19) | Jupiter | Cancer / Moon |
| Pluto | Capricorn 22 | 3 (20-29) | Sun | Virgo / Mercury |
| Chiron | Aries 5 | 1 (0-9) | Mars | Aries / Mars |
| North Node | Cancer 18 | 2 (10-19) | Mercury | Scorpio / Pluto |
| Lilith | Virgo 4 | 1 (0-9) | Sun | Virgo / Mercury |

Two real face dignities in this chart: the Sun at Gemini 23 stands in the
Sun's own face, and Mercury at Cancer 17 stands in Mercury's own face.
`hasFaceDignity` returns true for both.

### Balances, stellium, signature

- Element balance (ten planets): Fire 2, Earth 3, Air 2, Water 3.
  Matches the live edge function's elementBalance exactly.
- Mode balance: Cardinal 4, Fixed 1, Mutable 5. Only one fixed planet
  (Uranus), so the signature carries a "only one planet in a Fixed sign"
  item at score 7.
- Stellium: Mercury, Mars and the North Node gathered in Cancer,
  span 2 degrees, 2 true planets.
- Signature top five, in order:
  1. [16] Mercury conjunct Mars, 2 degrees from exact
  2. [15] A gathering of three in Cancer: Mercury, Mars, North Node
  3. [14] Mars conjunct North Node, 1 degree from exact
  4. [14] Mars opposite Saturn, 1 degree from exact
  5. [14] Mercury conjunct North Node, 1 degree from exact

The genuine headline storyline of this chart: a tight Mercury-Mars cluster
with the North Node in Cancer, standing one degree from an exact opposition
to Saturn in its own sign of Capricorn, with Mars in its fall. The node to
Saturn opposition is exact to the degree.

---

## Chart B: the homebody (CONSTRUCTED)

Constructed to exercise: exact exaltation degrees, the 0 Aries wrap-around,
a four-body stellium and an element dominance item. Not a real pet chart.

Positions: Sun Taurus 14 (44), Moon Taurus 3 (33), Mercury Aries 1 (1),
Venus Pisces 27 (357), Mars Capricorn 28 (298), Jupiter Virgo 10 (160),
Saturn Aries 20 (20), Uranus Aquarius 5 (305), Neptune Virgo 15 (165),
Pluto Taurus 10 (40), Chiron Libra 3 (183), North Node Taurus 8 (38),
Lilith Scorpio 12 (222).

### Expected aspects (exactly 25, tightest first)

| Aspect | Orb | Exactness |
|---|---|---|
| Jupiter trine Pluto | 0 | exact |
| Venus sextile Mars | 1 | exact |
| Sun trine Neptune | 1 | exact |
| Pluto conjunct North Node | 2 | close |
| Jupiter sextile Lilith | 2 | close |
| Moon square Uranus | 2 | close |
| Jupiter trine North Node | 2 | close |
| Uranus trine Chiron | 2 | close |
| Sun opposite Lilith | 2 | close |
| Mercury opposite Chiron | 2 | close |
| Pluto opposite Lilith | 2 | close |
| Mercury sextile Mars | 3 | close |
| Neptune sextile Lilith | 3 | close |
| Uranus square North Node | 3 | close |
| Sun conjunct Pluto | 4 | wide |
| Mercury conjunct Venus | 4 | wide |
| Mercury sextile Uranus | 4 | wide |
| Sun trine Jupiter | 4 | wide |
| Jupiter conjunct Neptune | 5 | wide |
| Moon square Mars | 5 | wide |
| Uranus square Pluto | 5 | wide |
| Neptune trine Pluto | 5 | wide |
| Moon conjunct Pluto | 7 | wide |
| Mars conjunct Uranus | 7 | wide |
| Moon trine Jupiter | 7 | wide |

The Mercury conjunct Venus at orb 4 is the wrap-around case worked above:
Pisces 27 to Aries 1 across the 0 degree boundary.

### Expected dignities

| Planet | Sign | Status | Score | Note |
|---|---|---|---|---|
| Moon | Taurus 3 | exaltation | +4 | AT the traditional degree, 3 Taurus |
| Venus | Pisces 27 | exaltation | +4 | AT the traditional degree, 27 Pisces |
| Mars | Capricorn 28 | exaltation | +4 | AT the traditional degree, 28 Capricorn |
| Jupiter | Virgo | detriment | -5 | |
| Saturn | Aries | fall | -4 | |
| Uranus | Aquarius | domicile (modern) | +5 | |
| Neptune | Virgo | detriment (modern) | -5 | |
| Pluto | Taurus | detriment (modern) | -5 | |
| Sun, Mercury | | peregrine | 0 | |

### Balances, stellium, signature

- Elements: Fire 2, Earth 6, Air 1, Water 1. Earth dominance item fires
  (6 of 10 at score 8). Note the scarce check finds Air at 1 first in
  canonical order, but the zero-count branch does not fire, so the
  dominant branch wins the summary.
- Modes: Cardinal 3, Fixed 4, Mutable 3. No mode item.
- Stellium: Sun, Moon, Pluto and the North Node in Taurus (four bodies,
  three planets, span 11). Signature rank 1 at score 17.

---

## Chart C: edge cases (CONSTRUCTED)

Constructed to exercise: domicile Sun, Moon in fall at the last degree of a
sign, Mercury in both detriment and fall, an out-of-sign trine, a
just-outside-orb miss, a missing element, mode dominance, and decan
boundaries at degrees 0, 9, 20 and 29. Not a real pet chart.

Positions: Sun Leo 0 (120), Moon Scorpio 29 (239), Mercury Pisces 10 (340),
Venus Libra 19 (199), Mars Leo 9 (129), Jupiter Gemini 20 (80),
Saturn Libra 21 (201), Uranus Leo 15 (135), Neptune Scorpio 20 (230),
Pluto Leo 5 (125), Chiron Pisces 0 (330), North Node Leo 17 (137),
Lilith Aquarius 25 (325).

### Expected aspects (exactly 15, tightest first)

| Aspect | Orb | Exactness |
|---|---|---|
| Moon square Chiron | 1 | exact |
| Sun trine Moon | 1 | exact |
| Venus trine Jupiter | 1 | exact |
| Jupiter trine Saturn | 1 | exact |
| Venus conjunct Saturn | 2 | close |
| Uranus conjunct North Node | 2 | close |
| Venus sextile North Node | 2 | close |
| Jupiter sextile North Node | 3 | close |
| Neptune square North Node | 3 | close |
| Mars conjunct Pluto | 4 | wide |
| Venus sextile Uranus | 4 | wide |
| Sun conjunct Pluto | 5 | wide |
| Uranus square Neptune | 5 | wide |
| Mars conjunct Uranus | 6 | wide |
| Moon trine Pluto | 6 | wide |

Two deliberate teaching cases:

1. Sun trine Moon (orb 1) is an OUT-OF-SIGN aspect: Leo 0 to Scorpio 29 is
   119 degrees, a trine by degree even though Leo and Scorpio are square
   signs. The engine measures degrees, which is correct classical practice
   (a dissociate aspect). Copy built on it should lean on the degrees, not
   the sign pairing.
2. Sun (Leo 0) to Mars (Leo 9) is 9 degrees apart: one degree OUTSIDE the
   8 degree conjunction orb. Correctly absent from the list even though
   both sit in the same sign.

### Expected dignities

| Planet | Sign | Status | Score |
|---|---|---|---|
| Sun | Leo | domicile | +5 |
| Moon | Scorpio | fall | -4 |
| Mercury | Pisces | detriment AND fall | -9 |
| Venus | Libra | domicile | +5 |
| Saturn | Libra 21 | exaltation (at the degree) | +4 |
| Jupiter | Gemini | detriment | -5 |
| Uranus | Leo | detriment (modern) | -5 |
| Mars, Neptune, Pluto | | peregrine | 0 |

### Decan boundary checks

| Body | Placement | Decan | Face |
|---|---|---|---|
| Sun | Leo 0 | 1 (0-9) | Saturn |
| Mars | Leo 9 | 1 (0-9) | Saturn |
| Jupiter | Gemini 20 | 3 (20-29) | Sun |
| Moon | Scorpio 29 | 3 (20-29) | Venus |
| Chiron | Pisces 0 | 1 (0-9) | Saturn |

### Balances, stellium, signature

- Elements: Fire 4, Earth 0, Air 3, Water 3. "No Earth among the 10
  planets placed" fires at score 9.
- Modes: Cardinal 2, Fixed 6, Mutable 2. "6 of 10 planets stand in Fixed
  signs" fires at score 8.
- Stellium: five bodies in Leo (Sun, Mars, Uranus, Pluto, North Node),
  four planets, span 17.
- Signature top three: [17] Sun trine Moon, [16] the Leo stellium,
  [15] Mercury in Pisces in both detriment and fall.

---

## Table provenance

- Exaltation degrees (Sun 19 Aries, Moon 3 Taurus, Mercury 15 Virgo,
  Venus 27 Pisces, Mars 28 Capricorn, Jupiter 15 Cancer, Saturn 21 Libra)
  verified against [renaissanceastrology.com](https://renaissanceastrology.com/exaltationdegrees.html)
  and [Wikipedia, Exaltation (astrology)](https://en.wikipedia.org/wiki/Exaltation_(astrology)).
- Chaldean faces (Mars at Aries 0, cycling Saturn, Jupiter, Mars, Sun,
  Venus, Mercury, Moon) verified against
  [kerykeion.net face and decan reference](https://kerykeion.net/content/learn-astrology/dignities-face)
  and [augurine.com decans](https://www.augurine.com/learn/decans-astrology).
- Modern outer rulerships applied to domicile and detriment only;
  exaltation and fall stay classical (no consensus for the outers).
