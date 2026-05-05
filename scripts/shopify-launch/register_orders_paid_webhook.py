"""
Register the orders/paid webhook subscription against the Little Souls Shopify
store via Admin GraphQL (webhookSubscriptionCreate).

Idempotent: queries existing subscriptions for the same callback URL +
topic; if found, prints the existing webhook ID and exits 0 without
re-creating.

Auth: OAuth client-credentials grant (same pattern as create_soul_reading_product.py).
Required env (load via `source ~/.codex/global.env` first):
  SHOPIFY_STORE_DOMAIN     e.g. littlesouls-3.myshopify.com
  SHOPIFY_CLIENT_ID
  SHOPIFY_CLIENT_SECRET
  SHOPIFY_API_VERSION      e.g. 2025-10 (default)

Notes on the webhook signing secret:
  Shopify uses ONE signing secret per app for app-managed webhooks created via
  the Admin API or a custom-app config. That secret is the API client secret
  (SHOPIFY_CLIENT_SECRET) for custom apps. For private apps with per-subscription
  secrets, the secret is shown in the Shopify admin under Notifications -> Webhooks.
  We standardise on `SHOPIFY_WEBHOOK_SECRET` — set this to whichever one your
  app uses. For a custom app it equals SHOPIFY_CLIENT_SECRET.

Output:
  scripts/shopify-launch/orders_paid_webhook.json — sidecar with the
  webhook subscription ID + callbackUrl + topic.

Run:
  source ~/.codex/global.env
  python3 scripts/shopify-launch/register_orders_paid_webhook.py

ASCII-only (Windows cp1252 safe).
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

CALLBACK_URL = "https://littlesouls.app/api/shopify/order-paid"
TOPIC = "ORDERS_PAID"

OUT_PATH = os.path.join(os.path.dirname(__file__), "orders_paid_webhook.json")


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


def graphql(token, query, variables=None, raise_on_errors=True):
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
        if raise_on_errors:
            print("[err] GraphQL errors:")
            print(json.dumps(resp["errors"], indent=2)[:1500])
            sys.exit(1)
        return {"_errors": resp["errors"], **(resp.get("data") or {})}
    return resp.get("data", {})


def write_sidecar(payload):
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"[ok] sidecar -> {OUT_PATH}")


def main():
    env_check()
    token = get_token()
    print(f"[ok] admin token len={len(token)}")

    # 1. Idempotency: scan existing subscriptions for an exact match.
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
        print(f"  topic:        {match.get('topic')}")
        print(f"  format:       {match.get('format')}")
        print(f"  callbackUrl:  {(match.get('endpoint') or {}).get('callbackUrl')}")
        write_sidecar({
            "id": match["id"],
            "topic": match.get("topic"),
            "format": match.get("format"),
            "callbackUrl": (match.get("endpoint") or {}).get("callbackUrl"),
            "already_existed": True,
        })
        print()
        print_secret_instructions()
        sys.exit(0)

    # 2. Create
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
    print_secret_instructions()


def print_secret_instructions():
    print("=" * 72)
    print("ACTION REQUIRED — SHOPIFY_WEBHOOK_SECRET")
    print("=" * 72)
    print()
    print("Shopify uses ONE signing secret per app for API-managed webhooks.")
    print("For a Shopify Custom App (which is how Little Souls is configured),")
    print("the signing secret IS the app's Client Secret.")
    print()
    print("  -> SHOPIFY_WEBHOOK_SECRET should be set to the SAME value as")
    print("     SHOPIFY_CLIENT_SECRET (which already lives in ~/.codex/global.env)")
    print()
    print("Add it to Vercel env (production AND preview) for the cosmic-pet-portraits project:")
    print()
    print("  vercel env add SHOPIFY_WEBHOOK_SECRET production")
    print("  vercel env add SHOPIFY_WEBHOOK_SECRET preview")
    print()
    print("Paste in the SAME value as SHOPIFY_CLIENT_SECRET when prompted.")
    print()
    print("If your store later moves to per-subscription secrets (private app /")
    print("admin -> Notifications -> Webhooks), the secret is shown there once at")
    print("creation. Update the env var to that value instead.")
    print()
    print("After setting the env var, redeploy (`vercel deploy --prod`) so the")
    print("webhook handler picks it up. Shopify retries failed deliveries 8x")
    print("over 4 hours, so a deploy within that window catches up.")
    print("=" * 72)


if __name__ == "__main__":
    main()
