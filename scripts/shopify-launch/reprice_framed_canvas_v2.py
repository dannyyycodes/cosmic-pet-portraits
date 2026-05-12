"""
Reprice all 33 framed-canvas v2 variants in Shopify from the (loss-making)
launch prices to the 2026-05-12 corrected `unframed + frame-upgrade` prices.

Run AFTER `create_unframed_canvas.py` so the new pricing model is consistent
across both products.

Pricing per size (GBP) — see vault live-skus-and-margins-2026-05-12 for the
Gelato wholesale + UK ship audit that backs this:

    8x10:  £39 + £45 = £84
    12x16: £49 + £65 = £114
    12x18: £55 + £65 = £120
    16x20: £65 + £65 = £130 (hero)
    16x24: £75 + £80 = £155
    18x24: £79 + £80 = £159
    20x28: £89 + £85 = £174
    20x30: £95 + £85 = £180
    24x24: £95 + £85 = £180
    24x32: £109 + £100 = £209
    24x36: £119 + £110 = £229

Reads scripts/shopify-launch/created_variants_v2.json for the variant IDs.

Usage:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/reprice_framed_canvas_v2.py
"""

import os
import json
import sys
import ssl
import time
import urllib.request
import urllib.error
import urllib.parse

SSL_CTX = ssl._create_unverified_context()

STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "littlesouls-3.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("SHOPIFY_CLIENT_ID/SECRET missing — source ~/.codex/global.env first.")

# Framed price = unframed + frame upgrade. Tiered per size to keep ≥25% margin
# on the frame addition, matching gelatoFramedCanvas.ts CANVAS_SIZES.
NEW_FRAMED_PRICE_GBP = {
    "8x10":  84,
    "12x16": 114,
    "12x18": 120,
    "16x20": 130,
    "16x24": 155,
    "18x24": 159,
    "20x28": 174,
    "20x30": 180,
    "24x24": 180,
    "24x32": 209,
    "24x36": 229,
}

# Load the existing variant map
map_path = os.path.join(os.path.dirname(__file__), "created_variants_v2.json")
with open(map_path, "r", encoding="utf-8") as f:
    v2 = json.load(f)

variants = v2["variants"]  # keyed `${size}__${color}`
print(f"[plan] reprice {len(variants)} framed variants")

def get_token():
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }).encode()
    req = urllib.request.Request(
        f"https://{STORE}/admin/oauth/access_token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        return json.loads(r.read())["access_token"]

TOKEN = get_token()
print(f"[ok] admin token (length {len(TOKEN)})")

def shopify(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"https://{STORE}/admin/api/{API_VERSION}/{path}",
        data=data,
        headers={
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"[err] HTTP {e.code} {method} {path}")
        print(e.read().decode("utf-8", errors="replace")[:1500])
        raise

updated = 0
skipped = 0
for key, v in variants.items():
    size_uid = v.get("size_uid")
    variant_id = v.get("variant_id")
    new_price = NEW_FRAMED_PRICE_GBP.get(size_uid)
    if not size_uid or not variant_id or new_price is None:
        print(f"[skip] bad row {key}: size_uid={size_uid} variant_id={variant_id}")
        skipped += 1
        continue
    body = {"variant": {"id": variant_id, "price": f"{new_price:.2f}"}}
    print(f"[reprice] {key}  £{v.get('price','?')} → £{new_price}")
    try:
        shopify("PUT", f"variants/{variant_id}.json", body)
        updated += 1
    except Exception as e:
        print(f"[err] reprice failed for {key}: {e}")
        skipped += 1
    time.sleep(0.3)

print(f"[done] updated={updated} skipped={skipped}")
