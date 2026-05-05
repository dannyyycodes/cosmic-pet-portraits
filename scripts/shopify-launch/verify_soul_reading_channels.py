"""
Verify Soul Reading product channel publication state, VAT collection, and
core product/variant configuration. Surgical writes only: unpublish from any
sales-channel that is NOT Online Store.

Read-only inspection first; then surgical unpublish if scope permits.

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/verify_soul_reading_channels.py

ASCII-only output.
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

PRODUCT_GID = "gid://shopify/Product/16176281190749"
VARIANT_GID = "gid://shopify/ProductVariant/64601427640669"


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


def gql(query, variables=None, raise_on_errors=True):
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
        body = e.read().decode("utf-8", errors="replace")[:1500]
        print(f"[err] HTTP {e.code}: {body}")
        return {"_http_error": e.code, "_body": body}
    if resp.get("errors"):
        if raise_on_errors:
            print("[err] GraphQL errors:")
            print(json.dumps(resp["errors"], indent=2)[:1500])
        return {"_errors": resp["errors"], **(resp.get("data") or {})}
    return resp.get("data", {})


# --- 1. INSPECT current channel state -------------------------------------
print("\n=== STEP 1: Inspect current channel publication state ===")
inspect_query = """
query {
  product(id: "gid://shopify/Product/16176281190749") {
    id
    title
    handle
    status
    publishedAt
    onlineStorePreviewUrl
    productPublications: resourcePublications(first: 20) {
      nodes {
        publication {
          id
          name
        }
        isPublished
        publishDate
      }
    }
  }
  publications(first: 20) {
    nodes {
      id
      name
    }
  }
}
"""
inspect = gql(inspect_query, raise_on_errors=False)

if "_errors" in inspect:
    print("[BLOCKER] GraphQL errors during inspection:")
    print(json.dumps(inspect.get("_errors"), indent=2))
    err_msgs = [e.get("message", "") for e in inspect.get("_errors", [])]
    if any("publications" in m.lower() or "access denied" in m.lower() or "scope" in m.lower() for m in err_msgs):
        print("\n[SCOPE BLOCKER] App is missing read_publications scope.")
        print("ACTION: In Shopify Admin -> Apps -> [the custom app] -> Configuration")
        print("        Add scopes: read_publications, write_publications")
        print("        Then re-grant access.")
    sys.exit(2)

product = inspect.get("product") or {}
all_pubs = (inspect.get("publications") or {}).get("nodes") or []
prod_pubs = (product.get("productPublications") or {}).get("nodes") or []

print(f"\nProduct: {product.get('title')}")
print(f"  handle:        {product.get('handle')}")
print(f"  status:        {product.get('status')}")
print(f"  publishedAt:   {product.get('publishedAt')}")
print(f"  preview URL:   {product.get('onlineStorePreviewUrl')}")

print(f"\nAll publications on store ({len(all_pubs)}):")
for p in all_pubs:
    print(f"  - {p.get('name'):30s}  id={p.get('id')}")

print(f"\nProduct publication state ({len(prod_pubs)} entries):")
for pp in prod_pubs:
    pub = pp.get("publication") or {}
    name = pub.get("name")
    pub_id = pub.get("id")
    is_pub = pp.get("isPublished")
    when = pp.get("publishDate")
    print(f"  - {name:30s}  isPublished={is_pub}  pub_id={pub_id}  publishDate={when}")

# --- 2. PLAN unpublish ---------------------------------------------------
ALLOWED_NAMES = {"Online Store"}

# A publication appears in resourcePublications only if the product is published to it.
# Some shops also expose channels via the global publications list even if the product isn't on them.
# We unpublish from any non-Online-Store entry that has isPublished=true.

to_unpublish = []
for pp in prod_pubs:
    pub = pp.get("publication") or {}
    name = pub.get("name")
    pub_id = pub.get("id")
    is_pub = pp.get("isPublished")
    if is_pub and name not in ALLOWED_NAMES:
        to_unpublish.append({"name": name, "pub_id": pub_id})

print(f"\n=== STEP 2: Plan ===")
if not to_unpublish:
    print("[ok] product is only published to allowed channels - nothing to unpublish.")
else:
    print(f"Will unpublish from {len(to_unpublish)} channel(s):")
    for u in to_unpublish:
        print(f"  - {u['name']}  ({u['pub_id']})")

# --- 3. APPLY unpublish --------------------------------------------------
unpublish_results = []
if to_unpublish:
    print("\n=== STEP 3: Apply unpublish ===")
    for u in to_unpublish:
        mut = """
        mutation publishableUnpublish($id: ID!, $input: [PublicationInput!]!) {
          publishableUnpublish(id: $id, input: $input) {
            publishable { ... on Product { id } }
            userErrors { field message }
          }
        }
        """
        resp = gql(mut, {
            "id": PRODUCT_GID,
            "input": [{"publicationId": u["pub_id"]}],
        }, raise_on_errors=False)
        if "_errors" in resp:
            err_msgs = [e.get("message", "") for e in resp.get("_errors", [])]
            scope_block = any(
                "access denied" in m.lower() or "scope" in m.lower() or "write_publications" in m.lower()
                for m in err_msgs
            )
            if scope_block:
                print(f"  [SCOPE BLOCKER] {u['name']}: missing write_publications scope")
                print("  STOPPING all unpublish attempts")
                unpublish_results.append({"name": u["name"], "ok": False, "reason": "scope-blocked"})
                break
            print(f"  [err] {u['name']}: {err_msgs}")
            unpublish_results.append({"name": u["name"], "ok": False, "reason": str(err_msgs)})
            continue
        u_resp = (resp.get("publishableUnpublish") or {})
        u_errs = u_resp.get("userErrors") or []
        if u_errs:
            print(f"  [warn] {u['name']}: {u_errs}")
            unpublish_results.append({"name": u["name"], "ok": False, "reason": str(u_errs)})
        else:
            print(f"  [ok] unpublished from {u['name']}")
            unpublish_results.append({"name": u["name"], "ok": True})

    # Re-inspect after writes
    print("\n=== STEP 3b: Re-inspect after unpublish ===")
    inspect2 = gql(inspect_query, raise_on_errors=False)
    if "_errors" not in inspect2:
        prod_pubs2 = ((inspect2.get("product") or {}).get("productPublications") or {}).get("nodes") or []
        print("Final product publication state:")
        for pp in prod_pubs2:
            pub = pp.get("publication") or {}
            print(f"  - {pub.get('name'):30s}  isPublished={pp.get('isPublished')}")

# --- 4. VAT collection check --------------------------------------------
print("\n=== STEP 4: Digital Goods VAT collection check ===")
coll_query = """
query {
  collections(first: 10, query: "title:'Digital Goods'") {
    nodes {
      id
      title
      handle
      productsCount { count }
      products(first: 10) { nodes { id title handle } }
    }
  }
}
"""
coll_resp = gql(coll_query, raise_on_errors=False)
vat_state = "missing"
vat_has_product = False
if "_errors" in coll_resp:
    print(f"[err] collections query failed: {coll_resp.get('_errors')}")
else:
    nodes = (coll_resp.get("collections") or {}).get("nodes") or []
    if not nodes:
        print("[BLOCKER] No 'Digital Goods' collection found.")
        print("  ACTION: Danny must enable Settings -> Taxes & duties -> United Kingdom")
        print("          -> 'Charge VAT on digital goods' toggle to create the auto-collection.")
    else:
        for c in nodes:
            count = (c.get("productsCount") or {}).get("count") if isinstance(c.get("productsCount"), dict) else c.get("productsCount")
            print(f"  - {c.get('title')}  handle={c.get('handle')}  products={count}")
            for p in (c.get("products") or {}).get("nodes") or []:
                marker = " <-- SOUL READING" if p.get("id") == PRODUCT_GID else ""
                print(f"      * {p.get('handle')}  ({p.get('id')}){marker}")
                if p.get("id") == PRODUCT_GID:
                    vat_has_product = True
            if "vat" in (c.get("title") or "").lower() or "digital" in (c.get("title") or "").lower():
                vat_state = "exists"

print(f"\nVAT collection state: {vat_state}; soul-reading-in-collection: {vat_has_product}")

# --- 5. Verify product fields ------------------------------------------
print("\n=== STEP 5: Verify product/variant fields ===")
verify_query = """
query {
  product(id: "gid://shopify/Product/16176281190749") {
    id
    title
    status
    productType
    tags
    variants(first: 5) {
      nodes {
        id
        sku
        price
        taxable
        inventoryPolicy
        inventoryItem {
          id
          tracked
          requiresShipping
        }
      }
    }
  }
}
"""
verify = gql(verify_query, raise_on_errors=False)
if "_errors" in verify:
    print(f"[err] {verify.get('_errors')}")
else:
    p = verify.get("product") or {}
    variants = (p.get("variants") or {}).get("nodes") or []
    v = variants[0] if variants else {}
    inv = v.get("inventoryItem") or {}
    checks = [
        ("status == ACTIVE", p.get("status") == "ACTIVE", p.get("status")),
        ("requires_shipping == false", inv.get("requiresShipping") is False, inv.get("requiresShipping")),
        ("taxable == true", v.get("taxable") is True, v.get("taxable")),
        ("inventory tracked == false (untracked)", inv.get("tracked") is False, inv.get("tracked")),
        ("tags include 'digital','soul-reading'", "digital" in (p.get("tags") or []) and "soul-reading" in (p.get("tags") or []), p.get("tags")),
        ("product_type == 'Service'", p.get("productType") == "Service", p.get("productType")),
    ]
    for label, ok, val in checks:
        sym = "OK" if ok else "FAIL"
        print(f"  [{sym}] {label}  (actual: {val})")

print("\n=== DONE ===")
