"""
Extend the existing Cosmic Pet Portrait — Framed Canvas product to support
all 11 sizes × 3 frame colors = 33 SKUs.

Strategy:
  - The existing product (ID 16173633765725) currently has 4 size-only
    variants on a single "Size" option, with old-format Gelato productUids.
  - We re-create the product as a fresh one with TWO options (Size + Frame
    color) and 33 variants, each with the correct modern Gelato productUid
    metafield. Old product is kept as-is for any already-issued cart links;
    new orders flow through the new product.
  - Outputs scripts/shopify-launch/created_variants_v2.json — the new
    variant ID map keyed by (size, color).

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/extend_framed_canvas.py

Source spec: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES,
FRAME_COLORS, gelatoProductUid()). Keep both in sync.
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

# ─── Catalog spec — mirrors src/components/portraits/gelatoFramedCanvas.ts ──
SIZES = [
    {"uid": "8x10",  "label": "8×10″",  "format": "200x250-mm-8x10-inch",   "frameSize": "252x302-mm-10x12-inch", "price": 39, "weight_kg": 1.0},
    {"uid": "12x16", "label": "12×16″", "format": "300x400-mm-12x16-inch",  "frameSize": "352x452-mm-14x18-inch", "price": 49, "weight_kg": 1.6},
    {"uid": "12x18", "label": "12×18″", "format": "300x450-mm-12x18-inch",  "frameSize": "352x502-mm-14x20-inch", "price": 55, "weight_kg": 1.8},
    {"uid": "16x20", "label": "16×20″", "format": "400x500-mm-16x20-inch",  "frameSize": "452x552-mm-18x22-inch", "price": 65, "weight_kg": 2.4},
    {"uid": "16x24", "label": "16×24″", "format": "400x600-mm-16x24-inch",  "frameSize": "452x652-mm-18x26-inch", "price": 75, "weight_kg": 2.8},
    {"uid": "18x24", "label": "18×24″", "format": "450x600-mm-18x24-inch",  "frameSize": "502x652-mm-20x26-inch", "price": 79, "weight_kg": 3.0},
    {"uid": "20x28", "label": "20×28″", "format": "500x700-mm-20x28-inch",  "frameSize": "552x752-mm-22x30-inch", "price": 89, "weight_kg": 3.4},
    {"uid": "20x30", "label": "20×30″", "format": "500x750-mm-20x30-inch",  "frameSize": "552x802-mm-22x32-inch", "price": 95, "weight_kg": 3.6},
    {"uid": "24x24", "label": "24×24″", "format": "600x600-mm-24x24-inch",  "frameSize": "652x652-mm-26x26-inch", "price": 95, "weight_kg": 3.6},
    {"uid": "24x32", "label": "24×32″", "format": "600x800-mm-24x32-inch",  "frameSize": "652x852-mm-26x34-inch", "price": 109, "weight_kg": 4.4},
    {"uid": "24x36", "label": "24×36″", "format": "600x900-mm-24x36-inch",  "frameSize": "652x952-mm-26x38-inch", "price": 119, "weight_kg": 4.8},
]

COLORS = [
    {"uid": "black",        "label": "Black",       "sku": "BLK"},
    {"uid": "natural-wood", "label": "Natural Wood", "sku": "NAT"},
    {"uid": "dark-wood",    "label": "Dark Brown",   "sku": "DRK"},
]

def gelato_uid(format_, color, frame_size):
    return f"framed_canvas_geo_simplified_{format_}_{color}_{frame_size}_wood-fsc-slim_ver_wood_w14xt42-mm_canvas_4-0"

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

# ─── Build product spec ────────────────────────────────────────────────
DESC = """\
<p>Your pet, painted into a cinematic character world and framed for your wall.</p>

<p>Pick a size. Pick a wood tone. We render your pet in the chosen style and ship a museum-quality framed canvas straight to your door.</p>

<p>Slim FSC-certified poplar/pine frame. Cotton-poly canvas. Archival inks. Printed locally at the partner closest to your address (UK / EU / US). Lands on your doormat in 3-5 days.</p>"""

variants = []
for s in SIZES:
    for c in COLORS:
        variants.append({
            "option1": s["label"],
            "option2": c["label"],
            "price": f"{s['price']:.2f}",
            "sku": f"LS-FC-{s['uid'].upper()}-{c['sku']}",
            "weight": s["weight_kg"],
            "weight_unit": "kg",
            "inventory_management": None,  # POD — never out of stock
            "fulfillment_service": "manual",
            "_gelato_uid": gelato_uid(s["format"], c["uid"], s["frameSize"]),
            "_size_uid": s["uid"],
            "_color_uid": c["uid"],
        })

print(f"[plan] creating new product with {len(variants)} variants")

product_payload = {
    "product": {
        "title": "Cosmic Pet Portrait — Framed Canvas",
        "handle": "cosmic-pet-portrait-framed-canvas-v2",
        "body_html": DESC,
        "product_type": "Framed Canvas",
        "vendor": "Little Souls",
        "tags": "pet-portrait,framed-canvas,wall-art,cosmic,launch-v2",
        "status": "active",
        "options": [
            {"name": "Size",  "values": [s["label"] for s in SIZES]},
            {"name": "Frame", "values": [c["label"] for c in COLORS]},
        ],
        "variants": [
            {
                "option1": v["option1"],
                "option2": v["option2"],
                "price":   v["price"],
                "sku":     v["sku"],
                "weight":  v["weight"],
                "weight_unit": v["weight_unit"],
                "inventory_management": v["inventory_management"],
                "fulfillment_service":  v["fulfillment_service"],
            } for v in variants
        ],
    },
}

print("[create] POST /products.json")
resp = shopify("POST", "products.json", product_payload)
product = resp.get("product", {})
product_id = product.get("id")
print(f"[ok] product {product_id} — {len(product.get('variants', []))} variants created")

# ─── Set gelato.product_uid metafield on every new variant ─────────────
results = []
for created_variant in product.get("variants", []):
    title = created_variant.get("title", "")
    sku = created_variant.get("sku", "")
    # Find matching spec by SKU
    spec = next((v for v in variants if v["sku"] == sku), None)
    if not spec:
        print(f"[warn] no spec for variant SKU {sku}")
        continue
    metafield_payload = {
        "metafield": {
            "namespace": "gelato",
            "key": "product_uid",
            "type": "single_line_text_field",
            "value": spec["_gelato_uid"],
        },
    }
    print(f"[meta] {sku} ← {spec['_gelato_uid']}")
    try:
        shopify(
            "POST",
            f"variants/{created_variant['id']}/metafields.json",
            metafield_payload,
        )
    except Exception as e:
        print(f"[err]  metafield failed for {sku}: {e}")
    results.append({
        "size_uid":   spec["_size_uid"],
        "color_uid":  spec["_color_uid"],
        "variant_id": created_variant["id"],
        "sku":        sku,
        "price":      spec["price"],
        "gelato_uid": spec["_gelato_uid"],
    })
    time.sleep(0.3)  # gentle on Shopify rate limits

# ─── Save mapping ───────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "created_variants_v2.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(
        {
            "product_id": product_id,
            "product_handle": product.get("handle"),
            "variants": {
                f"{r['size_uid']}__{r['color_uid']}": r for r in results
            },
        },
        f,
        indent=2,
    )
print(f"[ok] saved variant map → {out_path}")
print(f"[summary] {len(results)} variants ready. Update productLineup.ts and checkout.ts to use the new IDs.")
