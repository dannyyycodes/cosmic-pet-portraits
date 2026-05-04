"""
One-shot launch script — creates the 6 launch products in Shopify with all
variants and pins each variant to its Gelato productUid via metafield so the
Gelato Shopify app picks up fulfillment automatically.

Run:
    source ~/.codex/global.env
    python3 scripts/shopify-launch/create_products.py

Outputs:
    scripts/shopify-launch/created_variants.json  (variant ID map)

Re-running is safe-ish — Shopify will return a 422 if SKUs collide. To recreate
from scratch, delete the products in admin first.

Source spec: vault/01-projects/little-souls/pet-portraits/launch-sku-spec-2026-05-03.md
"""

import os
import json
import sys
import ssl
import time
import urllib.request
import urllib.error
import urllib.parse

# msys2/ucrt64 Python ships without a CA bundle. This is a one-shot admin
# script hitting a single known Shopify endpoint — unverified context is
# acceptable here. Don't copy this pattern into production code.
SSL_CTX = ssl._create_unverified_context()

# ─── Config ────────────────────────────────────────────────────────────
STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "littlesouls-3.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-10")

if not CLIENT_ID or not CLIENT_SECRET:
    sys.exit("SHOPIFY_CLIENT_ID/SECRET missing from env. source ~/.codex/global.env first.")


def get_token() -> str:
    body = urllib.parse.urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }
    ).encode()
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


def shopify(method: str, path: str, body=None) -> dict:
    """Hit Shopify Admin REST API; raise on non-2xx with response body printed."""
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
        print(e.read().decode("utf-8", errors="replace")[:1000])
        raise


# ─── Product specs (matches launch-sku-spec-2026-05-03) ────────────────

DESC_FRAMED = """\
<p>Your pet, painted into a cinematic character world and framed for your wall.</p>

<p>Six character archetypes to choose from at the upload step — 1920s Underworld Boss, Wizard School Prodigy, Galaxy Smuggler Captain, Regency Court Darling, Gothic Academy Star, Cosmic Birth Chart. Drop in their photo, pick a world, and we bring you a hand-finished portrait of THEM in that world. <strong>Their ears, fur, eyes and markings stay theirs</strong> — only the wardrobe and the world change.</p>

<p>Slim FSC-certified poplar/pine frame in natural wood. Cotton-poly canvas. Archival inks. Printed locally at the partner closest to your address (UK · EU · USA). Lands on your doormat in 3–5 days.</p>

<p><em>The first cinematic preview is free — pay only when it feels like them.</em></p>"""

DESC_MUG = """\
<p>Your pet, painted into a cinematic character world, on the side of an 11oz ceramic mug.</p>

<p>Same identity-locked artwork as our framed canvas — only the surface changes. Six character archetypes to choose from at the upload step. Dishwasher and microwave safe. Printed locally at the partner closest to your address.</p>

<p><em>The first cinematic preview is free — pay only when it feels like them.</em></p>"""

DESC_TOTE = """\
<p>Your pet, painted into a cinematic character world, on a sturdy cotton tote.</p>

<p>Carry them everywhere. The same identity-locked artwork as our framed canvas. Six character archetypes to choose from at the upload step. Reinforced handles. Printed locally at the partner closest to your address.</p>

<p><em>The first cinematic preview is free — pay only when it feels like them.</em></p>"""

DESC_TEE = """\
<p>Your pet, painted into a cinematic character world, on a soft unisex crewneck tee.</p>

<p>The same identity-locked artwork as our framed canvas. Six character archetypes to choose from at the upload step. 100% cotton classic-fit unisex crewneck in white. Sizes XS through 2XL. Printed locally at the partner closest to your address.</p>

<p><em>The first cinematic preview is free — pay only when it feels like them.</em></p>"""

DESC_HOODIE = """\
<p>Your pet, painted into a cinematic character world, on a soft pullover hoodie.</p>

<p>The same identity-locked artwork as our framed canvas. Six character archetypes to choose from at the upload step. Classic-fit unisex pullover in black. Sizes XS through 2XL. Printed locally at the partner closest to your address.</p>

<p><em>The first cinematic preview is free — pay only when it feels like them.</em></p>"""


PRODUCTS = [
    {
        "title": "Cosmic Pet Portrait — Framed Canvas",
        "handle": "cosmic-pet-portrait-framed-canvas",
        "body_html": DESC_FRAMED,
        "product_type": "Framed Canvas",
        "vendor": "Little Souls",
        "tags": "pet-portrait,framed-canvas,wall-art,cosmic,launch",
        "option_name": "Size",
        "variants": [
            {"size": "8×10″",  "price": "69.00",  "sku": "LS-FC-8X10",
             "gelato_uid": "framed_canvas_wood_w14xt32-mm_8x10-inch_ver_natural-wood_10x12-inch_wood-fsc-2-cm_canvas_4-0_canvas-mounting",
             "weight_kg": 1.1},
            {"size": "12×16″", "price": "99.00",  "sku": "LS-FC-12X16",
             "gelato_uid": "framed_canvas_wood_w14xt32-mm_12x16-inch_ver_natural-wood_14x18-inch_wood-fsc-2-cm_canvas_4-0_canvas-mounting",
             "weight_kg": 1.6},
            {"size": "16×20″", "price": "149.00", "sku": "LS-FC-16X20",
             "gelato_uid": "framed_canvas_wood_w14xt32-mm_16x20-inch_ver_natural-wood_18x22-inch_wood-fsc-2-cm_canvas_4-0_canvas-mounting",
             "weight_kg": 2.2},
            {"size": "20×30″", "price": "199.00", "sku": "LS-FC-20X30",
             "gelato_uid": "framed_canvas_wood_w14xt32-mm_20x30-inch_ver_natural-wood_22x32-inch_wood-fsc-2-cm_canvas_4-0_canvas-mounting",
             "weight_kg": 3.4},
        ],
    },
    {
        "title": "Cosmic Pet Portrait — Ceramic Mug",
        "handle": "cosmic-pet-portrait-mug",
        "body_html": DESC_MUG,
        "product_type": "Mug",
        "vendor": "Little Souls",
        "tags": "pet-portrait,mug,gift,cosmic,launch",
        "option_name": "Size",
        "variants": [
            {"size": "11oz", "price": "19.00", "sku": "LS-MUG-11",
             "gelato_uid": "mug_product_msz_11-oz_mmat_ceramic-white_cl_4-0",
             "weight_kg": 0.45},
        ],
    },
    {
        "title": "Cosmic Pet Portrait — Tote Bag",
        "handle": "cosmic-pet-portrait-tote",
        "body_html": DESC_TOTE,
        "product_type": "Tote Bag",
        "vendor": "Little Souls",
        "tags": "pet-portrait,tote-bag,cosmic,launch",
        "option_name": "Size",
        "variants": [
            {"size": "Standard", "price": "29.00", "sku": "LS-TOTE-STD",
             "gelato_uid": "bag_product_bsc_tote-bag_bqa_clc_bsi_std-t_bco_white_bpr_4-0",
             "weight_kg": 0.18},
        ],
    },
    {
        "title": "Cosmic Pet Portrait — Unisex Tee",
        "handle": "cosmic-pet-portrait-tee",
        "body_html": DESC_TEE,
        "product_type": "T-Shirt",
        "vendor": "Little Souls",
        "tags": "pet-portrait,t-shirt,apparel,cosmic,launch",
        "option_name": "Size",
        "variants": [
            {"size": "XS",  "price": "29.00", "sku": "LS-TEE-XS",  "weight_kg": 0.18,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xs_gco_white_gpr_0-4"},
            {"size": "S",   "price": "29.00", "sku": "LS-TEE-S",   "weight_kg": 0.20,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_s_gco_white_gpr_0-4"},
            {"size": "M",   "price": "29.00", "sku": "LS-TEE-M",   "weight_kg": 0.22,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_0-4"},
            {"size": "L",   "price": "29.00", "sku": "LS-TEE-L",   "weight_kg": 0.24,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_l_gco_white_gpr_0-4"},
            {"size": "XL",  "price": "32.00", "sku": "LS-TEE-XL",  "weight_kg": 0.26,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xl_gco_white_gpr_0-4"},
            {"size": "2XL", "price": "34.00", "sku": "LS-TEE-2XL", "weight_kg": 0.28,
             "gelato_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_2xl_gco_white_gpr_0-4"},
        ],
    },
    {
        "title": "Cosmic Pet Portrait — Unisex Hoodie",
        "handle": "cosmic-pet-portrait-hoodie",
        "body_html": DESC_HOODIE,
        "product_type": "Hoodie",
        "vendor": "Little Souls",
        "tags": "pet-portrait,hoodie,apparel,cosmic,launch",
        "option_name": "Size",
        "variants": [
            {"size": "XS",  "price": "49.00", "sku": "LS-HOOD-XS",  "weight_kg": 0.55,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_xs_gco_black_gpr_0-4"},
            {"size": "S",   "price": "49.00", "sku": "LS-HOOD-S",   "weight_kg": 0.60,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_s_gco_black_gpr_0-4"},
            {"size": "M",   "price": "49.00", "sku": "LS-HOOD-M",   "weight_kg": 0.65,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_m_gco_black_gpr_0-4"},
            {"size": "L",   "price": "49.00", "sku": "LS-HOOD-L",   "weight_kg": 0.70,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_l_gco_black_gpr_0-4"},
            {"size": "XL",  "price": "52.00", "sku": "LS-HOOD-XL",  "weight_kg": 0.75,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_xl_gco_black_gpr_0-4"},
            {"size": "2XL", "price": "55.00", "sku": "LS-HOOD-2XL", "weight_kg": 0.80,
             "gelato_uid": "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_2xl_gco_black_gpr_0-4"},
        ],
    },
]


# ─── Run ───────────────────────────────────────────────────────────────
results = {}

for spec in PRODUCTS:
    payload = {
        "product": {
            "title": spec["title"],
            "handle": spec["handle"],
            "body_html": spec["body_html"],
            "product_type": spec["product_type"],
            "vendor": spec["vendor"],
            "tags": spec["tags"],
            "status": "active",
            "options": [{"name": spec["option_name"]}],
            "variants": [
                {
                    "option1": v["size"],
                    "price": v["price"],
                    "sku": v["sku"],
                    "weight": v["weight_kg"],
                    "weight_unit": "kg",
                    "inventory_management": None,  # POD: don't track
                    "inventory_policy": "continue",
                    "requires_shipping": True,
                    "taxable": True,
                }
                for v in spec["variants"]
            ],
        }
    }

    res = shopify("POST", "products.json", payload)
    product = res["product"]
    pid = product["id"]
    print(f"\n[product] {spec['title']}  →  id={pid}  handle={product['handle']}")

    variant_map = {}
    for created_v, spec_v in zip(product["variants"], spec["variants"]):
        vid = created_v["id"]
        # Set Gelato productUid metafield on the variant so the Gelato app
        # routes fulfillment to the correct print target.
        meta_payload = {
            "metafield": {
                "namespace": "gelato",
                "key": "product_uid",
                "value": spec_v["gelato_uid"],
                "type": "single_line_text_field",
            }
        }
        shopify("POST", f"variants/{vid}/metafields.json", meta_payload)

        variant_map[spec_v["size"]] = {
            "variant_id": vid,
            "variant_gid": f"gid://shopify/ProductVariant/{vid}",
            "sku": spec_v["sku"],
            "price": spec_v["price"],
            "gelato_uid": spec_v["gelato_uid"],
        }
        print(f"  [variant] {spec_v['size']:8s}  vid={vid}  sku={spec_v['sku']}  £{spec_v['price']}")
        time.sleep(0.06)  # gentle on rate limits

    results[spec["handle"]] = {
        "product_id": pid,
        "product_title": spec["title"],
        "product_type": spec["product_type"],
        "variants": variant_map,
    }


# ─── Persist variant-id map ────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "created_variants.json")
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"\n[done] wrote variant ID map to {out_path}")
print(f"[done] {len(results)} products created across {sum(len(p['variants']) for p in results.values())} variants")
