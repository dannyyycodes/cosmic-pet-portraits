"""
Update existing Shopify webhook subscriptions to point at the consolidated
/api/shopify endpoint. Idempotent — safe to re-run.

We previously registered:
  - orders/paid    -> https://littlesouls.app/api/shopify/order-paid
  - refunds/create -> https://littlesouls.app/api/shopify/refunds-create

After Hobby-plan consolidation both topics are served by ONE function at
/api/shopify, dispatched via X-Shopify-Topic header.

Run:
  source ~/.codex/global.env
  python3 scripts/shopify-launch/update_webhook_callbacks.py
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

NEW_CALLBACK = "https://littlesouls.app/api/shopify"

UPDATES = [
    {"topic": "ORDERS_PAID",    "old_path": "/api/shopify/order-paid"},
    {"topic": "REFUNDS_CREATE", "old_path": "/api/shopify/refunds-create"},
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


def graphql(token, query, variables=None):
    payload = {"query": query, "variables": variables or {}}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"https://{STORE}/admin/api/{API_VERSION}/graphql.json",
        data=data,
        headers={
            "X-Shopify-Access-Token": token,
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
        print(f"[err] GraphQL HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:600]}")
        raise
    if resp.get("errors"):
        print("[err] GraphQL errors:")
        print(json.dumps(resp["errors"], indent=2)[:1500])
        sys.exit(1)
    return resp.get("data", {})


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        sys.exit("missing SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET")
    token = get_token()
    print(f"[ok] admin token len={len(token)}")

    for update in UPDATES:
        topic = update["topic"]
        print(f"\n[step] processing topic={topic}")

        existing = graphql(
            token,
            """
            query($topic: WebhookSubscriptionTopic!) {
              webhookSubscriptions(first: 50, topics: [$topic]) {
                nodes {
                  id
                  topic
                  endpoint {
                    __typename
                    ... on WebhookHttpEndpoint { callbackUrl }
                  }
                }
              }
            }
            """,
            {"topic": topic},
        )
        nodes = (existing.get("webhookSubscriptions") or {}).get("nodes") or []

        if not nodes:
            print(f"  [skip] no subscription found for {topic}")
            continue

        for sub in nodes:
            sub_id = sub["id"]
            current = (sub.get("endpoint") or {}).get("callbackUrl") or ""
            if current == NEW_CALLBACK:
                print(f"  [skip] {sub_id} already at {NEW_CALLBACK}")
                continue
            print(f"  [update] {sub_id}  {current}  ->  {NEW_CALLBACK}")
            updt = graphql(
                token,
                """
                mutation($id: ID!, $sub: WebhookSubscriptionInput!) {
                  webhookSubscriptionUpdate(id: $id, webhookSubscription: $sub) {
                    webhookSubscription {
                      id
                      endpoint {
                        __typename
                        ... on WebhookHttpEndpoint { callbackUrl }
                      }
                    }
                    userErrors { field message }
                  }
                }
                """,
                {
                    "id": sub_id,
                    "sub": {"callbackUrl": NEW_CALLBACK},
                },
            )
            errs = (updt.get("webhookSubscriptionUpdate") or {}).get("userErrors") or []
            if errs:
                print(f"  [err] update userErrors: {json.dumps(errs)[:400]}")
                sys.exit(1)
            updated = (updt.get("webhookSubscriptionUpdate") or {}).get("webhookSubscription") or {}
            new_url = (updated.get("endpoint") or {}).get("callbackUrl")
            print(f"  [ok] now: {new_url}")

    print("\n[done] all subscriptions point at the consolidated /api/shopify endpoint.")


if __name__ == "__main__":
    main()
