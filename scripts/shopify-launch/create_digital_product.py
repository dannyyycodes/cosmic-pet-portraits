"""
Create the Shopify digital-download product — "Cosmic Pet Portrait — Digital
Download". Single variant at £19 GBP (multi-currency presentment handled by
Shopify Markets / Stripe currency conversion).

Key flags:
  - requires_shipping = false   → no shipping cost charged at checkout
  - taxable = true              → UK VAT still applies to the digital service
  - inventory_management = null → POD / digital — never out of stock
  - product_type = "Digital"    → distinct from canvas in reports
  - NO gelato.product_uid metafield — these orders skip Gelato entirely; the
    digital fulfilment pipeline (api/_lib/digitalFulfillment.ts) handles them.

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/create_digital_product.py

Outputs scripts/shopify-launch/created_digital_product.json — the new variant
ID + handle. After running, paste the variantId into DIGITAL_VARIANT in
gelatoFramedCanvas.ts (or productLineup.ts).
"""

import os
import json
import sys
import ssl
import urllib.request
import urllib.error
import urllib.parse

SSL_CTX = ssl._create_unverified_context()

STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "littlesouls-3.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("SHOPIFY_CLIENT_ID/SECRET missing - source ~/.codex/global.env first.")

PRICE_GBP = 19.00

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

DESC = """\
<p>Your pet, painted into a cinematic character world - delivered as a high-resolution print-ready file.</p>

<p>Pick your style. We render your pet, you choose your favourite, and we email you the 3000x3000 PNG within minutes. Print it locally, frame it yourself, or use it as a digital wallpaper.</p>

<p>Perfect for instant gifting, international customers who'd rather avoid shipping, or anyone who just wants to enjoy the artwork without the wait. Want a real canvas later? Just upgrade in the studio - the same render scales seamlessly to any of our framed canvas sizes.</p>"""

product_payload = {
    "product": {
        "title": "Cosmic Pet Portrait - Digital Download",
        "handle": "cosmic-pet-portrait-digital",
        "body_html": DESC,
        "product_type": "Digital",
        "vendor": "Little Souls",
        "tags": "pet-portrait,digital,download,cosmic,launch-v3",
        "status": "active",
        "options": [
            {"name": "Title", "values": ["Default Title"]},
        ],
        "variants": [
            {
                "price": f"{PRICE_GBP:.2f}",
                "sku": "LS-DG-PORTRAIT",
                "requires_shipping": False,
                "taxable": True,
                "inventory_management": None,
                "fulfillment_service": "manual",
                "weight": 0.0,
                "weight_unit": "kg",
            }
        ],
    },
}

print("[create] POST /products.json (digital)")
resp = shopify("POST", "products.json", product_payload)
product = resp.get("product", {})
product_id = product.get("id")
variants = product.get("variants", [])
print(f"[ok] product {product_id} - {len(variants)} variant(s) created")

if not variants:
    sys.exit("[err] no variant returned from Shopify")

variant = variants[0]
variant_id = variant.get("id")
print(f"[ok] variant_id={variant_id} sku={variant.get('sku')} price=GBP{variant.get('price')}")

out_path = os.path.join(os.path.dirname(__file__), "created_digital_product.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(
        {
            "product_id": product_id,
            "product_handle": product.get("handle"),
            "variant_id": variant_id,
            "sku": variant.get("sku"),
            "price_gbp": variant.get("price"),
        },
        f,
        indent=2,
    )
print(f"[ok] saved -> {out_path}")
print()
print("--- TypeScript paste (productLineup.ts / gelatoFramedCanvas.ts) ---")
print(f'  "digital": {{ variantId: {variant_id}, priceMajor: {int(PRICE_GBP)}, sizeLabel: "Digital" }},')
