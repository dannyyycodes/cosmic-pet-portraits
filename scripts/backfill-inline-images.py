#!/usr/bin/env python3
"""One-off backfill: add 2 inline Pexels images to the first 2 posts."""
import json
import subprocess

SITE = "https://aduibsyrnenzobuyetmn.supabase.co"
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzMDAzOCwiZXhwIjoyMDg4NTA2MDM4fQ.6Icy7RKDkfCYI5EoUMn1u8kYK1FNVbB9pC46JENbXdo"
PEXELS = "okUyRy6l876v4eV0vh42MAay9MRNrb3iPNBIoR7Qqii5MGaJv4oVNeWA"

# Hand-curated pairs — section-specific Pexels queries chosen to match content
PLANS = []  # manual-splice branch below for post 2


def curl(args, timeout=30):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, encoding="utf-8", errors="replace")


def fetch_pexels(query: str) -> dict | None:
    out = curl([
        "curl", "-sS",
        f"https://api.pexels.com/v1/search?query={query.replace(' ', '+')}&orientation=landscape&per_page=5&size=large",
        "-H", f"Authorization: {PEXELS}",
    ])
    try:
        j = json.loads(out.stdout)
        photo = (j.get("photos") or [None])[0]
        if not photo:
            return None
        url = (photo.get("src") or {}).get("large2x") or (photo.get("src") or {}).get("large")
        if not url:
            return None
        return {"url": url, "alt": photo.get("alt") or query}
    except Exception as e:
        print("  pexels err:", e)
        return None


def get_content(slug: str) -> str | None:
    out = curl([
        "curl", "-sS",
        f"{SITE}/rest/v1/blog_posts?slug=eq.{slug}&select=content,featured_image_url",
        "-H", f"apikey: {JWT}", "-H", f"Authorization: Bearer {JWT}",
    ])
    try:
        d = json.loads(out.stdout)
        return d[0] if d else None
    except Exception:
        return None


def patch_content(slug: str, content: str) -> bool:
    with open("/tmp/body.json", "w", encoding="utf-8") as f:
        json.dump({"content": content}, f)
    out = curl([
        "curl", "-sS", "-X", "PATCH",
        f"{SITE}/rest/v1/blog_posts?slug=eq.{slug}",
        "-H", f"apikey: {JWT}", "-H", f"Authorization: Bearer {JWT}",
        "-H", "Content-Type: application/json", "-H", "Prefer: return=minimal",
        "-w", "\n%{http_code}", "--data-binary", "@/tmp/body.json",
    ])
    return out.stdout.strip().split("\n")[-1] in ("204", "200")


def main():
    for plan in PLANS:
        slug = plan["slug"]
        print(f"\n=== {slug} ===")
        row = get_content(slug)
        if not row:
            print("  NOT FOUND"); continue
        content = row["content"]
        hero_url = row.get("featured_image_url")
        used = {hero_url}
        for img in plan["images"]:
            marker = f"## {img['after_heading']}"
            if marker not in content:
                print(f"  heading not found: {img['after_heading']}"); continue
            pick = fetch_pexels(img["query"])
            if not pick or pick["url"] in used:
                # try a second query variant
                pick = fetch_pexels(img["query"] + " photo")
            if not pick or pick["url"] in used:
                print(f"  no pexels for '{img['query']}'"); continue
            used.add(pick["url"])
            alt = pick["alt"].replace("[", "").replace("]", "")
            insertion = f"\n\n![{alt}]({pick['url']})\n"
            # Insert right after the heading line
            idx = content.index(marker) + len(marker)
            # Skip to end of heading line
            nl = content.find("\n", idx)
            if nl == -1:
                nl = idx
            content = content[:nl] + insertion + content[nl:]
            print(f"  + after '{img['after_heading']}' -> {pick['url']}")
        ok = patch_content(slug, content)
        print(f"  PATCH: {'OK' if ok else 'FAIL'}")


if __name__ == "__main__":
    main()
