#!/usr/bin/env python3
"""Remove duplicate inline images (same URL) from blog post content."""
import json
import re
import subprocess

SITE = "https://aduibsyrnenzobuyetmn.supabase.co"
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzMDAzOCwiZXhwIjoyMDg4NTA2MDM4fQ.6Icy7RKDkfCYI5EoUMn1u8kYK1FNVbB9pC46JENbXdo"


def curl(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def dedupe(slug: str):
    out = curl([
        "curl", "-sS", f"{SITE}/rest/v1/blog_posts?slug=eq.{slug}&select=content",
        "-H", f"apikey: {JWT}", "-H", f"Authorization: Bearer {JWT}",
    ])
    c = json.loads(out.stdout)[0]["content"]
    seen = set()

    def keep(m):
        url = m.group(1)
        if url in seen:
            return ""  # drop duplicate
        seen.add(url)
        return m.group(0)

    new = re.sub(r"!\[[^\]]*\]\(([^)]+)\)", keep, c)
    # Clean up any tripled newlines left by deletions
    new = re.sub(r"\n{4,}", "\n\n\n", new)
    if new == c:
        print(f"  {slug}: no dupes")
        return
    with open("/tmp/body.json", "w", encoding="utf-8") as f:
        json.dump({"content": new}, f)
    patch = curl([
        "curl", "-sS", "-X", "PATCH", f"{SITE}/rest/v1/blog_posts?slug=eq.{slug}",
        "-H", f"apikey: {JWT}", "-H", f"Authorization: Bearer {JWT}",
        "-H", "Content-Type: application/json", "-H", "Prefer: return=minimal",
        "-w", "\n%{http_code}", "--data-binary", "@/tmp/body.json",
    ])
    http = patch.stdout.strip().split("\n")[-1]
    before = c.count("![")
    after = new.count("![")
    print(f"  {slug}: deduped ({before} -> {after}) PATCH={http}")


for s in ["dog-birthday-personality-astrology-guide", "dog-zodiac-signs", "cat-zodiac-signs-meanings"]:
    dedupe(s)
