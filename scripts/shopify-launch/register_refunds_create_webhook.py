"""
Register the refunds/create webhook subscription against the Little Souls
Shopify store via Admin GraphQL (webhookSubscriptionCreate).

Idempotent: queries existing subscriptions for the same callback URL +
topic; if found, prints the existing webhook ID and exits 0 without
re-creating.

Same auth pattern as register_orders_paid_webhook.py — relies on
SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET from ~/.codex/global.env, and
the SAME SHOPIFY_WEBHOOK_SECRET (one secret per app — already set if
orders/paid was registered).

Output:
  scripts/shopify-launch/refunds_create_webhook.json — sidecar.

Run:
  source ~/.codex/global.env
  python3 scripts/shopify-launch/register_refunds_create_webhook.py

ASCII-only.
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

CALLBACK_URL = "https://littlesouls.app/api/shopify/refunds-create"
TOPIC = "REFUNDS_CREATE"

OUT_PATH = os.path.join(os.path.dirname(__file__), "refunds_create_webhook.json")


def env_check():
    if not CLIENT_ID or not CLIENT_SECRET:
        sys.exit("missing SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET. source ~/.codex/global.env first.")


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
        print(f"[err] GraphQL HTTP {e.code}")
        print(e.read().decode("utf-8", errors="replace")[:1500])
        raise
    if resp.get("errors"):
        print("[err] GraphQL errors:")
        print(json.dumps(resp["errors"], indent=2)[:1500])
        sys.exit(1)
    return resp.get("data", {})


def write_sidecar(payload):
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"[ok] sidecar -> {OUT_PATH}")


def main():
    env_check()
    token = get_token()
    print(f"[ok] admin token len={len(token)}")

    print(f"[step] list existing webhookSubscriptions (topic={TOPIC})")
    existing = graphql(
        token,
        """
        query($topic: WebhookSubscriptionTopic!) {
          webhookSubscriptions(first: 50, topics: [$topic]) {
            nodes {
              id
              topic
              format
              endpoint {
                __typename
                ... on WebhookHttpEndpoint { callbackUrl }
              }
            }
          }
        }
        """,
        {"topic": TOPIC},
    )
    nodes = (existing.get("webhookSubscriptions") or {}).get("nodes") or []
    match = None
    for n in nodes:
        ep = n.get("endpoint") or {}
        if ep.get("__typename") == "WebhookHttpEndpoint" and ep.get("callbackUrl") == CALLBACK_URL:
            match = n
            break

    if match:
        print(f"[skip] webhook already subscribed: {match['id']}")
        write_sidecar({
            "id": match["id"],
            "topic": match.get("topic"),
            "format": match.get("format"),
            "callbackUrl": (match.get("endpoint") or {}).get("callbackUrl"),
            "already_existed": True,
        })
        sys.exit(0)

    print(f"[step] webhookSubscriptionCreate topic={TOPIC} url={CALLBACK_URL}")
    create_resp = graphql(
        token,
        """
        mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
            webhookSubscription {
              id
              topic
              format
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
            "topic": TOPIC,
            "sub": {
                "callbackUrl": CALLBACK_URL,
                "format": "JSON",
            },
        },
    )
    pc = create_resp.get("webhookSubscriptionCreate") or {}
    errs = pc.get("userErrors") or []
    if errs:
        print("[err] webhookSubscriptionCreate userErrors:")
        print(json.dumps(errs, indent=2))
        sys.exit(1)
    sub = pc.get("webhookSubscription") or {}
    sub_id = sub.get("id")
    print(f"[ok] webhookSubscription created: {sub_id}")
    print(f"  topic:        {sub.get('topic')}")
    print(f"  format:       {sub.get('format')}")
    print(f"  callbackUrl:  {(sub.get('endpoint') or {}).get('callbackUrl')}")
    write_sidecar({
        "id": sub_id,
        "topic": sub.get("topic"),
        "format": sub.get("format"),
        "callbackUrl": (sub.get("endpoint") or {}).get("callbackUrl"),
        "already_existed": False,
    })
    print()
    print("=" * 72)
    print("This subscription reuses SHOPIFY_WEBHOOK_SECRET — already set if you")
    print("ran register_orders_paid_webhook.py. No new env vars to add.")
    print("Deploy within ~4 hours so Shopify retry window catches up.")
    print("=" * 72)


if __name__ == "__main__":
    main()
