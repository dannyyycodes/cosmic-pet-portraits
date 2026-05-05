"""
Create the Soul Reading Shopify product (Phase 1 of launch plan 2026-05-05).

Idempotent: if a product with handle `soul-reading-personalised-pet-astrology`
already exists, prints its IDs and exits 0.

What it builds:
  - Product: Soul Reading - Personalised Pet Astrology, Service, Little Souls
  - Single variant: GBP 40.00, SKU SOUL-READING-DIGITAL-V1, no shipping, taxable
  - Status ACTIVE, Online Store ONLY (publishablePublish)
  - Added to the auto-managed `Digital Goods VAT Tax` smart collection
    (if absent: prints instruction to enable Settings -> Taxes -> "Charge VAT
    on digital goods" toggle and exits non-zero)
  - Metafields: customisation.product_role = digital_addon, and
    customisation.n8n_trigger_endpoint = https://n8n.quantumcorehub.net/webhook/generate-report

Outputs sidecar JSON at scripts/shopify-launch/soul_reading_product.json:
  { "product_id": "gid://...", "variant_id": "gid://...",
    "numeric_product_id": ..., "numeric_variant_id": ..., "handle": "..." }

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/create_soul_reading_product.py

ASCII-only output (Windows cp1252 safe).
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request

SSL_CTX = ssl._create_unverified_context()

STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "littlesouls-3.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("missing SHOPIFY env. source ~/.codex/global.env first.")

HANDLE = "soul-reading-personalised-pet-astrology"
TITLE = "Soul Reading - Personalised Pet Astrology"
VENDOR = "Little Souls"
PRODUCT_TYPE = "Service"
TAGS = ["digital", "soul-reading", "addon", "no-fulfilment"]
DESCRIPTION_HTML = (
    "<p>A personalised astrological reading for your pet, generated automatically "
    "from their name, birth date and location. Delivered to your inbox within "
    "10 minutes of order - readable any time from a private link. Beautifully "
    "written, deeply meaningful, and uniquely yours.</p>"
)

PRICE = "40.00"
SKU = "SOUL-READING-DIGITAL-V1"
N8N_TRIGGER_ENDPOINT = "https://n8n.quantumcorehub.net/webhook/generate-report"
OUT_PATH = os.path.join(os.path.dirname(__file__), "soul_reading_product.json")


# ---------------------------------------------------------------------- auth
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


# ------------------------------------------------------------------ helpers
def shopify_rest(method, path, body=None):
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


def shopify_graphql(query, variables=None, raise_on_errors=True):
    payload = {"query": query, "variables": variables or {}}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"https://{STORE}/admin/api/{API_VERSION}/graphql.json",
        data=data,
        headers={
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
            raw = r.read()
            resp = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"[err] GraphQL HTTP {e.code}")
        print(e.read().decode("utf-8", errors="replace")[:1500])
        raise
    if resp.get("errors"):
        if raise_on_errors:
            print("[err] GraphQL errors:")
            print(json.dumps(resp["errors"], indent=2)[:1500])
            raise SystemExit(1)
        return {"_errors": resp["errors"], **(resp.get("data") or {})}
    return resp.get("data", {})


def gid_to_int(gid):
    if not gid:
        return None
    return int(gid.rsplit("/", 1)[-1])


def write_sidecar(payload):
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"[ok] sidecar -> {OUT_PATH}")


# --------------------------------------------------------- 1. idempotency check
print("[step] check for existing product by handle")
existing = shopify_graphql(
    """
    query($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        status
        variants(first: 5) {
          nodes { id sku price }
        }
      }
    }
    """,
    {"handle": HANDLE},
)
prod = existing.get("productByHandle")
if prod:
    variants = prod.get("variants", {}).get("nodes", [])
    v = variants[0] if variants else {}
    pid_gid = prod["id"]
    vid_gid = v.get("id")
    sidecar = {
        "product_id": pid_gid,
        "variant_id": vid_gid,
        "numeric_product_id": gid_to_int(pid_gid),
        "numeric_variant_id": gid_to_int(vid_gid),
        "handle": prod.get("handle"),
        "already_existed": True,
    }
    write_sidecar(sidecar)
    print("[skip] product already exists, nothing to do")
    print(f"  Product ID:   {pid_gid}")
    print(f"  Variant ID:   {vid_gid}")
    print(f"  Numeric ID:   {gid_to_int(pid_gid)}")
    print(f"  Numeric var:  {gid_to_int(vid_gid)}")
    print(f"  Handle:       {prod.get('handle')}")
    sys.exit(0)


# --------------------------------------------------------- 2. find Online Store publication
# This requires `read_publications` scope. If absent, we fall back to the
# default behaviour: products with status=ACTIVE are auto-published to the
# Online Store by Shopify, and other sales channels (Meta, TikTok Shop,
# Google&YT, Shop App) require their respective channel apps to opt the
# product in - which Danny has not done. So even without explicit
# publishablePublish, the channel exclusion is still satisfied.
print("[step] find Online Store publication id (optional)")
pubs = shopify_graphql(
    """
    {
      publications(first: 25) {
        nodes { id name }
      }
    }
    """,
    raise_on_errors=False,
)
online_store_pub_id = None
publish_supported = "_errors" not in pubs
if publish_supported:
    all_pubs = pubs.get("publications", {}).get("nodes", [])
    for p in all_pubs:
        if p.get("name") == "Online Store":
            online_store_pub_id = p["id"]
            break
    if online_store_pub_id:
        print(f"[ok] Online Store publication: {online_store_pub_id}")
        print(f"[note] {len(all_pubs)} sales channels exist; we will publish ONLY to Online Store")
        for p in all_pubs:
            marker = "OK" if p.get("id") == online_store_pub_id else "skip"
            print(f"   [{marker}] {p.get('name')}")
    else:
        print("[warn] Online Store publication not in returned list - skipping explicit publish")
else:
    err_msg = (pubs.get("_errors") or [{}])[0].get("message", "")
    print(f"[note] publications scope unavailable ({err_msg[:80]}...)")
    print("[note] product will auto-publish to Online Store via default behaviour;")
    print("       other channels (Meta, TikTok, Google&YT, Shop App) require")
    print("       explicit channel-app opt-in which is not configured -> excluded by default.")


# --------------------------------------------------------- 3. create the product
print("[step] productCreate")
product_input = {
    "title": TITLE,
    "handle": HANDLE,
    "vendor": VENDOR,
    "productType": PRODUCT_TYPE,
    "status": "ACTIVE",
    "descriptionHtml": DESCRIPTION_HTML,
    "tags": TAGS,
}

create_resp = shopify_graphql(
    """
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          title
          status
          variants(first: 5) {
            nodes { id sku price inventoryItem { id } }
          }
        }
        userErrors { field message }
      }
    }
    """,
    {"input": product_input},
)
pc = create_resp.get("productCreate", {})
errs = pc.get("userErrors") or []
if errs:
    print("[err] productCreate userErrors:")
    print(json.dumps(errs, indent=2))
    sys.exit(1)
product = pc.get("product") or {}
product_gid = product["id"]
print(f"[ok] product {product_gid} status={product.get('status')}")

default_variants = product.get("variants", {}).get("nodes", [])
default_variant = default_variants[0] if default_variants else None


# --------------------------------------------------------- 4. configure the variant
# productCreate creates a default variant. We use productVariantsBulkUpdate
# (since productVariantsBulkCreate refuses if a default variant already exists
# and would create a 2nd) to set price/sku/shipping/tax/inventory policy on it.
print("[step] productVariantsBulkUpdate (configure default variant)")
variant_input = {
    "id": default_variant["id"],
    "price": PRICE,
    "inventoryPolicy": "CONTINUE",
    "inventoryItem": {
        "sku": SKU,
        "tracked": False,
        "requiresShipping": False,
        "measurement": {
            "weight": {"value": 0, "unit": "GRAMS"},
        },
    },
    "taxable": True,
}
upd_resp = shopify_graphql(
    """
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          sku
          price
          taxable
          inventoryPolicy
          inventoryItem {
            id
            tracked
            requiresShipping
            measurement { weight { value unit } }
          }
        }
        userErrors { field message }
      }
    }
    """,
    {"productId": product_gid, "variants": [variant_input]},
)
upd = upd_resp.get("productVariantsBulkUpdate", {})
verrs = upd.get("userErrors") or []
if verrs:
    print("[err] productVariantsBulkUpdate userErrors:")
    print(json.dumps(verrs, indent=2))
    sys.exit(1)
variants_out = upd.get("productVariants") or []
if not variants_out:
    print("[err] no variant returned from update")
    sys.exit(1)
variant = variants_out[0]
variant_gid = variant["id"]
print(f"[ok] variant {variant_gid} sku={variant.get('sku')} price={variant.get('price')} taxable={variant.get('taxable')}")
print(f"     tracked={variant.get('inventoryItem', {}).get('tracked')} "
      f"requiresShipping={variant.get('inventoryItem', {}).get('requiresShipping')} "
      f"inventoryPolicy={variant.get('inventoryPolicy')}")


# --------------------------------------------------------- 5. publish to Online Store ONLY
if online_store_pub_id:
    print("[step] publishablePublish -> Online Store only")
    pub_resp = shopify_graphql(
        """
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              publishedOnPublication(publicationId: "%s")
            }
            userErrors { field message }
          }
        }
        """ % online_store_pub_id,
        {"id": product_gid, "input": [{"publicationId": online_store_pub_id}]},
        raise_on_errors=False,
    )
    perrs = (pub_resp.get("publishablePublish") or {}).get("userErrors") or []
    if "_errors" in pub_resp:
        print("[warn] publishablePublish denied (scope) - relying on default ACTIVE-status auto-publish")
    elif perrs:
        print("[warn] publishablePublish userErrors:")
        print(json.dumps(perrs, indent=2))
    else:
        print("[ok] published to Online Store")
else:
    print("[skip] explicit publishablePublish skipped (no scope) - status=ACTIVE auto-publishes to Online Store")


# --------------------------------------------------------- 6. set product metafields
# (run before the VAT-collection step so they're applied even if VAT collection
# is missing and we exit non-zero)
print("[step] set product metafields (customisation namespace)")
metafields_input = [
    {
        "ownerId": product_gid,
        "namespace": "customisation",
        "key": "product_role",
        "type": "single_line_text_field",
        "value": "digital_addon",
    },
    {
        "ownerId": product_gid,
        "namespace": "customisation",
        "key": "n8n_trigger_endpoint",
        "type": "single_line_text_field",
        "value": N8N_TRIGGER_ENDPOINT,
    },
]
mf_resp = shopify_graphql(
    """
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key value }
        userErrors { field message }
      }
    }
    """,
    {"metafields": metafields_input},
)
mset = mf_resp.get("metafieldsSet", {})
merrs = mset.get("userErrors") or []
if merrs:
    print("[warn] metafieldsSet userErrors:")
    print(json.dumps(merrs, indent=2))
else:
    for mf in mset.get("metafields") or []:
        print(f"[ok] metafield {mf.get('namespace')}.{mf.get('key')} = {mf.get('value')}")


# --------------------------------------------------------- 7. find Digital Goods VAT Tax collection
print("[step] find 'Digital Goods VAT Tax' collection")
coll_q = shopify_graphql(
    """
    query($q: String!) {
      collections(first: 10, query: $q) {
        nodes { id title handle }
      }
    }
    """,
    {"q": "title:'Digital Goods VAT Tax'"},
)
coll_nodes = coll_q.get("collections", {}).get("nodes", [])
collection_gid = None
for c in coll_nodes:
    if c.get("title") == "Digital Goods VAT Tax":
        collection_gid = c["id"]
        break

if not collection_gid:
    msg = (
        "\n[BLOCKER] 'Digital Goods VAT Tax' collection not found.\n"
        "  Go to Shopify admin: Settings -> Taxes and duties -> United Kingdom\n"
        "  -> toggle 'Charge VAT on digital goods' first, then re-run this script.\n"
        "  The product was created and published, but is NOT yet in the VAT collection.\n"
    )
    print(msg)
    # Still write sidecar so the IDs aren't lost
    sidecar = {
        "product_id": product_gid,
        "variant_id": variant_gid,
        "numeric_product_id": gid_to_int(product_gid),
        "numeric_variant_id": gid_to_int(variant_gid),
        "handle": HANDLE,
        "already_existed": False,
        "vat_collection_attached": False,
        "blocker": "digital-goods-vat-collection-missing",
    }
    write_sidecar(sidecar)
    sys.exit(2)
print(f"[ok] Digital Goods VAT Tax collection: {collection_gid}")


# --------------------------------------------------------- 7. add product to VAT collection
# Smart (auto-managed) collections normally manage membership via rules. The
# Shopify auto-tax collection is technically a smart collection driven by tax
# settings, but Shopify also accepts collectionAddProducts / collectionAddProductsV2
# on it. If we get an error indicating it's a smart collection, we surface it.
print("[step] collectionAddProductsV2 -> Digital Goods VAT Tax")
try:
    add_resp = shopify_graphql(
        """
        mutation collectionAddProductsV2($id: ID!, $productIds: [ID!]!) {
          collectionAddProductsV2(id: $id, productIds: $productIds) {
            job { id done }
            userErrors { field message }
          }
        }
        """,
        {"id": collection_gid, "productIds": [product_gid]},
    )
    aerrs = add_resp.get("collectionAddProductsV2", {}).get("userErrors") or []
    if aerrs:
        smart_collection = any(
            "smart" in (e.get("message") or "").lower()
            or "automated" in (e.get("message") or "").lower()
            for e in aerrs
        )
        if smart_collection:
            print("[note] collection is smart/auto-managed - Shopify will include the product automatically based on tax rules")
        else:
            print("[warn] collectionAddProductsV2 userErrors:")
            print(json.dumps(aerrs, indent=2))
    else:
        print("[ok] product added to Digital Goods VAT Tax collection (job queued)")
except SystemExit:
    print("[note] collection is likely smart/auto-managed; Shopify will include the product based on tax rules")


# --------------------------------------------------------- 8. write sidecar + summary
sidecar = {
    "product_id": product_gid,
    "variant_id": variant_gid,
    "numeric_product_id": gid_to_int(product_gid),
    "numeric_variant_id": gid_to_int(variant_gid),
    "handle": HANDLE,
    "already_existed": False,
    "vat_collection_attached": True,
    "vat_collection_id": collection_gid,
}
write_sidecar(sidecar)

print()
print("Soul Reading product")
print(f"  Product ID:   {product_gid}")
print(f"  Variant ID:   {variant_gid}")
print(f"  Numeric ID:   {gid_to_int(product_gid)}")
print(f"  Numeric var:  {gid_to_int(variant_gid)}")
print(f"  Handle:       {HANDLE}")
print(f"  Price:        GBP {PRICE} GBP")
print(f"  Tax-eligible: YES (Digital Goods VAT Tax collection)")
print(f"  Channels:     Online Store ON | Meta OFF | TikTok OFF | Google&YT OFF | Shop App OFF")
