"""
Recovery helper — finishes the metafield + JSON save step that crashed on
unicode output in create_unframed_canvas.py. Fetches the live product and
sets `gelato.product_uid` on each variant, then writes
created_variants_unframed.json.

Run AFTER create_unframed_canvas.py made the product (id 16190044897629).
"""

import os, json, sys, ssl, time, urllib.request, urllib.error, urllib.parse

SSL_CTX = ssl._create_unverified_context()

STORE = os.environ["SHOPIFY_STORE_DOMAIN"]
CLIENT_ID = os.environ["SHOPIFY_CLIENT_ID"]
CLIENT_SECRET = os.environ["SHOPIFY_CLIENT_SECRET"]
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")
PRODUCT_ID = int(os.environ.get("UNFRAMED_PRODUCT_ID", "16190044897629"))

SIZES = [
    ("8x10",  "8x10-inch-200x250-mm"),
    ("12x16", "12x16-inch-300x400-mm"),
    ("12x18", "12x18-inch-300x450-mm"),
    ("16x20", "16x20-inch-400x500-mm"),
    ("16x24", "16x24-inch-400x600-mm"),
    ("18x24", "18x24-inch-450x600-mm"),
    ("20x28", "20x28-inch-500x700-mm"),
    ("20x30", "20x30-inch-500x750-mm"),
    ("24x24", "24x24-inch-600x600-mm"),
    ("24x32", "24x32-inch-600x800-mm"),
    ("24x36", "24x36-inch-600x900-mm"),
]
PRICE_GBP = {"8x10":39,"12x16":49,"12x18":55,"16x20":65,"16x24":75,"18x24":79,"20x28":89,"20x30":95,"24x24":95,"24x32":109,"24x36":119}

def gelato_uid(fmt): return f"canvas_{fmt}_canvas_wood-fsc-slim_4-0_ver"

def get_token():
    body = urllib.parse.urlencode({"grant_type":"client_credentials","client_id":CLIENT_ID,"client_secret":CLIENT_SECRET}).encode()
    req = urllib.request.Request(f"https://{STORE}/admin/oauth/access_token", data=body, headers={"Content-Type":"application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        return json.loads(r.read())["access_token"]

TOKEN = get_token()
print(f"[ok] token len={len(TOKEN)}")

def shopify(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"https://{STORE}/admin/api/{API_VERSION}/{path}", data=data, headers={"X-Shopify-Access-Token":TOKEN,"Content-Type":"application/json","Accept":"application/json"}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"[err] HTTP {e.code} {method} {path}")
        print(e.read().decode("utf-8", errors="replace")[:1500])
        raise

print(f"[fetch] product {PRODUCT_ID}")
resp = shopify("GET", f"products/{PRODUCT_ID}.json")
product = resp.get("product", {})
variants = product.get("variants", [])
print(f"[ok] {len(variants)} variants")

# SKU pattern: LS-UC-{SIZE_UPPER}
results = []
size_by_sku = {f"LS-UC-{s[0].upper()}": s for s in SIZES}
for v in variants:
    sku = v.get("sku", "")
    spec = size_by_sku.get(sku)
    if not spec:
        print(f"[warn] no spec for {sku}")
        continue
    size_uid, fmt = spec
    uid = gelato_uid(fmt)
    mf = {"metafield":{"namespace":"gelato","key":"product_uid","type":"single_line_text_field","value":uid}}
    print(f"[meta] {sku} -> {uid}")
    try:
        shopify("POST", f"variants/{v['id']}/metafields.json", mf)
    except Exception as e:
        print(f"[err] metafield {sku}: {e}")
    results.append({"size_uid":size_uid,"variant_id":v["id"],"sku":sku,"price":f"{PRICE_GBP[size_uid]:.2f}","gelato_uid":uid})
    time.sleep(0.3)

out_path = os.path.join(os.path.dirname(__file__), "created_variants_unframed.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"product_id":product.get("id"),"product_handle":product.get("handle"),"variants":{r["size_uid"]:r for r in results}}, f, indent=2)
print(f"[ok] saved -> {out_path}")
print()
print("--- TypeScript paste for UNFRAMED_CANVAS_VARIANTS ---")
for r in results:
    print(f'  "{r["size_uid"]}":  {{ variantId: {r["variant_id"]}, priceMajor: {int(float(r["price"]))} }},')
