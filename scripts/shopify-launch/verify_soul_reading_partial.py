"""
Partial verification — VAT collection state + product/variant fields.
Skips publications API (requires read_publications scope which the
custom app lacks).
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


def gql(query, variables=None):
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
        return {"_http_error": e.code, "_body": body}
    if resp.get("errors"):
        return {"_errors": resp["errors"], **(resp.get("data") or {})}
    return resp.get("data", {})


# --- VAT collection check -------------------------------------------------
print("=== VAT collection check ===")
coll_resp = gql("""
query {
  collections(first: 25, query: "title:Digital") {
    nodes {
      id
      title
      handle
      productsCount { count }
      products(first: 25) { nodes { id title handle } }
    }
  }
}
""")
if "_errors" in coll_resp:
    print(f"[err] {coll_resp.get('_errors')}")
else:
    nodes = (coll_resp.get("collections") or {}).get("nodes") or []
    if not nodes:
        print("[BLOCKER] No collection matching 'Digital' found.")
    else:
        for c in nodes:
            count_obj = c.get("productsCount")
            count = count_obj.get("count") if isinstance(count_obj, dict) else count_obj
            print(f"  - title='{c.get('title')}'  handle={c.get('handle')}  products={count}")
            for p in (c.get("products") or {}).get("nodes") or []:
                marker = "  <-- SOUL READING" if p.get("id") == PRODUCT_GID else ""
                print(f"      * {p.get('handle')}  id={p.get('id')}{marker}")

# Also try a broader search for any collection containing the soul reading
print("\n--- Search collections containing Soul Reading product ---")
prod_colls = gql("""
query {
  product(id: "gid://shopify/Product/16176281190749") {
    collections(first: 25) {
      nodes { id title handle ruleSet { rules { column relation condition } appliedDisjunctively } }
    }
  }
}
""")
if "_errors" in prod_colls:
    print(f"[err] {prod_colls.get('_errors')}")
else:
    pc = ((prod_colls.get("product") or {}).get("collections") or {}).get("nodes") or []
    if not pc:
        print("  (Soul Reading is not in any collection)")
    else:
        for c in pc:
            rs = c.get("ruleSet")
            smart = "[SMART]" if rs else "[manual]"
            print(f"  - {smart} {c.get('title')}  handle={c.get('handle')}  id={c.get('id')}")
            if rs:
                for r in rs.get("rules") or []:
                    print(f"        rule: {r.get('column')} {r.get('relation')} '{r.get('condition')}'")


# --- product/variant verification ----------------------------------------
print("\n=== Product/variant field verification ===")
verify = gql("""
query {
  product(id: "gid://shopify/Product/16176281190749") {
    id
    title
    status
    productType
    tags
    publishedAt
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
""")
if "_errors" in verify:
    print(f"[err] {verify.get('_errors')}")
else:
    p = verify.get("product") or {}
    print(f"  title:       {p.get('title')}")
    print(f"  status:      {p.get('status')}")
    print(f"  productType: {p.get('productType')}")
    print(f"  tags:        {p.get('tags')}")
    print(f"  publishedAt: {p.get('publishedAt')}")
    variants = (p.get("variants") or {}).get("nodes") or []
    v = variants[0] if variants else {}
    inv = v.get("inventoryItem") or {}
    print(f"  variant id:           {v.get('id')}")
    print(f"  sku:                  {v.get('sku')}")
    print(f"  price:                {v.get('price')}")
    print(f"  taxable:              {v.get('taxable')}")
    print(f"  inventoryPolicy:      {v.get('inventoryPolicy')}")
    print(f"  inv.tracked:          {inv.get('tracked')}")
    print(f"  inv.requiresShipping: {inv.get('requiresShipping')}")
    print()
    checks = [
        ("status == ACTIVE", p.get("status") == "ACTIVE"),
        ("requires_shipping == false", inv.get("requiresShipping") is False),
        ("taxable == true", v.get("taxable") is True),
        ("inventory tracked == false", inv.get("tracked") is False),
        ("tags include digital + soul-reading", "digital" in (p.get("tags") or []) and "soul-reading" in (p.get("tags") or [])),
        ("product_type == Service", p.get("productType") == "Service"),
    ]
    for label, ok in checks:
        print(f"  [{'OK' if ok else 'FAIL'}] {label}")
