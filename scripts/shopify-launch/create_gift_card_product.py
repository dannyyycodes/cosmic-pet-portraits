"""
Create the Shopify gift card product — "Cosmic Pet Portrait — Gift Card".

Multi-variant single product (Shopify best practice):
  - £19 (covers 1 digital download)
  - £39 (covers 8x10 unframed canvas)
  - £79 (covers 18x24 unframed canvas)
  - £129 (covers framed canvas)

Shopify auto-generates a unique gift code on payment and emails it to the
recipient (whose name + email + optional message are passed as line-item
properties: recipient_name, recipient_email, message). The recipient redeems
the code like a discount code at checkout — fully native, no extra wiring.

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/create_gift_card_product.py
"""

import os, json, sys, ssl, time
import urllib.request, urllib.error, urllib.parse

SSL_CTX = ssl._create_unverified_context()

STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "littlesouls-3.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("SHOPIFY_CLIENT_ID/SECRET missing - source ~/.codex/global.env first.")

DENOMINATIONS = [19, 39, 79, 129]

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
<p>Send a Cosmic Pet Portrait to someone you love - they pick the pet, the style, the size, and we'll bring it to life.</p>

<p>You receive a unique code by email after checkout - share it with the recipient (or surprise them with it on a card). They redeem it at our studio: upload their pet's photo, pick their favourite art style, and the gift card value covers the digital download or canvas.</p>

<p>Denominations from PS19 (digital download) up to PS129 (framed canvas). The code never expires; works on any product in our store.</p>"""

variants = [
    {
        "option1": f"PS{amount}",
        "price": f"{amount}.00",
        "sku": f"LS-GC-{amount}",
        "requires_shipping": False,
        "taxable": True,
        "inventory_management": None,
        "fulfillment_service": "manual",
    }
    for amount in DENOMINATIONS
]

product_payload = {
    "product": {
        "title": "Cosmic Pet Portrait - Gift Card",
        "handle": "cosmic-pet-portrait-gift-card",
        "body_html": DESC,
        "product_type": "Gift Card",
        "vendor": "Little Souls",
        "tags": "pet-portrait,gift-card,gift,cosmic",
        "status": "active",
        "options": [
            {"name": "Amount", "values": [v["option1"] for v in variants]},
        ],
        "variants": variants,
    },
}

print(f"[create] POST /products.json (gift card, {len(variants)} variants)")
resp = shopify("POST", "products.json", product_payload)
product = resp.get("product", {})
product_id = product.get("id")
created_variants = product.get("variants", [])
print(f"[ok] product {product_id} - {len(created_variants)} variants created")

results = []
for v in created_variants:
    results.append({
        "amount": int(float(v.get("price", "0"))),
        "variant_id": v.get("id"),
        "sku": v.get("sku"),
        "price": v.get("price"),
    })
    print(f"  {v.get('sku'):<10} id={v.get('id')} price=PS{v.get('price')}")

out_path = os.path.join(os.path.dirname(__file__), "created_gift_card_product.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(
        {
            "product_id": product_id,
            "product_handle": product.get("handle"),
            "variants": {r["amount"]: r for r in results},
        },
        f,
        indent=2,
    )
print(f"[ok] saved -> {out_path}")
print()
print("--- TypeScript paste for GIFT_CARD_VARIANTS ---")
print("export const GIFT_CARD_VARIANTS: Record<number, { variantId: number; priceMajor: number }> = {")
for r in results:
    print(f'  {r["amount"]}: {{ variantId: {r["variant_id"]}, priceMajor: {r["amount"]} }},')
print("};")
