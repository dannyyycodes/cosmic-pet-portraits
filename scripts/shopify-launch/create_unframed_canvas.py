"""
Create a new Shopify product "Cosmic Pet Portrait — Canvas" with 11 variants
(one per size, no frame). Sets gelato.product_uid metafield on each variant
pointing at the corresponding Gelato unframed canvas SKU.

Pricing locked 2026-05-12 from Gelato live wholesale + UK shipping audit.
Entry product — Crown & Paw style "From £39, frame +£X upgrade".

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/create_unframed_canvas.py

Outputs scripts/shopify-launch/created_variants_unframed.json — the new
variant ID map keyed by size. After running, paste the IDs into
src/components/portraits/gelatoFramedCanvas.ts UNFRAMED_CANVAS_VARIANTS.

Source spec: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES,
gelatoUnframedProductUid()). Keep both in sync.
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
# Each row: (sizeUid, label, format_inch_mm, price_GBP, weight_kg).
# format_inch_mm is the Gelato unframed format: "8x10-inch-200x250-mm".
SIZES = [
    ("8x10",  "8×10″",  "8x10-inch-200x250-mm",   39, 0.5),
    ("12x16", "12×16″", "12x16-inch-300x400-mm",  49, 0.8),
    ("12x18", "12×18″", "12x18-inch-300x450-mm",  55, 0.9),
    ("16x20", "16×20″", "16x20-inch-400x500-mm",  65, 1.2),
    ("16x24", "16×24″", "16x24-inch-400x600-mm",  75, 1.4),
    ("18x24", "18×24″", "18x24-inch-450x600-mm",  79, 1.5),
    ("20x28", "20×28″", "20x28-inch-500x700-mm",  89, 1.8),
    ("20x30", "20×30″", "20x30-inch-500x750-mm",  95, 1.9),
    ("24x24", "24×24″", "24x24-inch-600x600-mm",  95, 1.9),
    ("24x32", "24×32″", "24x32-inch-600x800-mm", 109, 2.4),
    ("24x36", "24×36″", "24x36-inch-600x900-mm", 119, 2.6),
]

def gelato_uid(fmt):
    return f"canvas_{fmt}_canvas_wood-fsc-slim_4-0_ver"

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
<p>Your pet, painted into a cinematic character world, on a gallery-stretched canvas.</p>

<p>Pick a size. We render your pet in the chosen style and ship a gallery-quality stretched canvas straight to your door — slim FSC poplar/pine bars, cotton-poly canvas, archival inks.</p>

<p>Ready to hang as-is, or upgrade to a real wood frame for an extra premium feel. Printed locally at the partner closest to you (UK / EU / US). Lands on your doormat in 3-5 days.</p>"""

variants = []
for (size_uid, label, fmt, price, weight) in SIZES:
    variants.append({
        "option1": label,
        "price": f"{price:.2f}",
        "sku": f"LS-UC-{size_uid.upper()}",
        "weight": weight,
        "weight_unit": "kg",
        "inventory_management": None,  # POD — never out of stock
        "fulfillment_service": "manual",
        "_gelato_uid": gelato_uid(fmt),
        "_size_uid": size_uid,
    })

print(f"[plan] creating new product with {len(variants)} variants")

product_payload = {
    "product": {
        "title": "Cosmic Pet Portrait — Canvas",
        "handle": "cosmic-pet-portrait-canvas",
        "body_html": DESC,
        "product_type": "Canvas",
        "vendor": "Little Souls",
        "tags": "pet-portrait,canvas,wall-art,cosmic,unframed,launch-v3",
        "status": "active",
        "options": [
            {"name": "Size", "values": [v["option1"] for v in variants]},
        ],
        "variants": [
            {
                "option1": v["option1"],
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
    sku = created_variant.get("sku", "")
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
        "variant_id": created_variant["id"],
        "sku":        sku,
        "price":      spec["price"],
        "gelato_uid": spec["_gelato_uid"],
    })
    time.sleep(0.3)  # gentle on Shopify rate limits

# ─── Save mapping ───────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "created_variants_unframed.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(
        {
            "product_id": product_id,
            "product_handle": product.get("handle"),
            "variants": {
                r["size_uid"]: r for r in results
            },
        },
        f,
        indent=2,
    )
print(f"[ok] saved variant map → {out_path}")
print(f"[summary] {len(results)} variants ready. Now paste the IDs into UNFRAMED_CANVAS_VARIANTS in gelatoFramedCanvas.ts.")
print("\n— TypeScript snippet to paste —")
print("export const UNFRAMED_CANVAS_VARIANTS: Record<string, { variantId: number; priceMajor: number }> = {")
for r in results:
    print(f'  "{r["size_uid"]}":  {{ variantId: {r["variant_id"]}, priceMajor: {int(float(r["price"]))} }},')
print("};")
