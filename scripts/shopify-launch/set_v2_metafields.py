"""
Recovery script — the v2 product (16175767519581) was created with 33
variants but the metafield-setting loop in extend_framed_canvas.py crashed
on a Unicode arrow before any metafield was written.

This script:
  1. Fetches the v2 product's 33 variants from Shopify.
  2. Re-derives the gelato.product_uid for each (size, color) combo.
  3. Sets the metafield on every variant.
  4. Saves the variant ID map → created_variants_v2.json.

ASCII-only output to avoid Windows cp1252 encoding crashes.
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
PRODUCT_ID = 16175767519581  # v2 product created 2026-05-04

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("missing SHOPIFY env. source ~/.codex/global.env first.")

# Same catalog spec as extend_framed_canvas.py
SIZES = [
    {"uid": "8x10",  "label": "8x10in",  "format": "200x250-mm-8x10-inch",   "frameSize": "252x302-mm-10x12-inch"},
    {"uid": "12x16", "label": "12x16in", "format": "300x400-mm-12x16-inch",  "frameSize": "352x452-mm-14x18-inch"},
    {"uid": "12x18", "label": "12x18in", "format": "300x450-mm-12x18-inch",  "frameSize": "352x502-mm-14x20-inch"},
    {"uid": "16x20", "label": "16x20in", "format": "400x500-mm-16x20-inch",  "frameSize": "452x552-mm-18x22-inch"},
    {"uid": "16x24", "label": "16x24in", "format": "400x600-mm-16x24-inch",  "frameSize": "452x652-mm-18x26-inch"},
    {"uid": "18x24", "label": "18x24in", "format": "450x600-mm-18x24-inch",  "frameSize": "502x652-mm-20x26-inch"},
    {"uid": "20x28", "label": "20x28in", "format": "500x700-mm-20x28-inch",  "frameSize": "552x752-mm-22x30-inch"},
    {"uid": "20x30", "label": "20x30in", "format": "500x750-mm-20x30-inch",  "frameSize": "552x802-mm-22x32-inch"},
    {"uid": "24x24", "label": "24x24in", "format": "600x600-mm-24x24-inch",  "frameSize": "652x652-mm-26x26-inch"},
    {"uid": "24x32", "label": "24x32in", "format": "600x800-mm-24x32-inch",  "frameSize": "652x852-mm-26x34-inch"},
    {"uid": "24x36", "label": "24x36in", "format": "600x900-mm-24x36-inch",  "frameSize": "652x952-mm-26x38-inch"},
]
COLORS = [
    {"uid": "black",        "label": "Black",       "sku": "BLK"},
    {"uid": "natural-wood", "label": "Natural Wood", "sku": "NAT"},
    {"uid": "dark-wood",    "label": "Dark Brown",   "sku": "DRK"},
]

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
print(f"[ok] admin token len={len(TOKEN)}")

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

# ─── Fetch the product + variants ───────────────────────────────────────
print(f"[fetch] product {PRODUCT_ID}")
resp = shopify("GET", f"products/{PRODUCT_ID}.json")
product = resp.get("product", {})
variants = product.get("variants", [])
print(f"[ok] {len(variants)} variants on product (handle={product.get('handle')})")

# ─── Build SKU -> spec map ──────────────────────────────────────────────
spec_by_sku = {}
for s in SIZES:
    for c in COLORS:
        sku = f"LS-FC-{s['uid'].upper()}-{c['sku']}"
        gelato_uid = f"framed_canvas_geo_simplified_{s['format']}_{c['uid']}_{s['frameSize']}_wood-fsc-slim_ver_wood_w14xt42-mm_canvas_4-0"
        spec_by_sku[sku] = {
            "size_uid":  s["uid"],
            "color_uid": c["uid"],
            "gelato_uid": gelato_uid,
        }

# ─── Set metafield on every variant ─────────────────────────────────────
results = []
for v in variants:
    sku = v.get("sku", "")
    spec = spec_by_sku.get(sku)
    if not spec:
        print(f"[skip] no spec for sku={sku}")
        continue
    payload = {
        "metafield": {
            "namespace": "gelato",
            "key": "product_uid",
            "type": "single_line_text_field",
            "value": spec["gelato_uid"],
        },
    }
    print(f"[meta] {sku} -> {spec['gelato_uid'][:60]}...")
    try:
        shopify("POST", f"variants/{v['id']}/metafields.json", payload)
    except Exception as e:
        print(f"[err]  metafield failed for {sku}: {e}")
        continue
    results.append({
        "size_uid":   spec["size_uid"],
        "color_uid":  spec["color_uid"],
        "variant_id": v["id"],
        "sku":        sku,
        "price":      v.get("price"),
        "gelato_uid": spec["gelato_uid"],
    })
    time.sleep(0.3)

# ─── Save map ───────────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "created_variants_v2.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({
        "product_id": PRODUCT_ID,
        "product_handle": product.get("handle"),
        "variants": {f"{r['size_uid']}__{r['color_uid']}": r for r in results},
    }, f, indent=2)
print(f"[ok] saved {len(results)} variants -> {out_path}")
