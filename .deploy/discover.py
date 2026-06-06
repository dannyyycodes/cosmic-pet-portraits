#!/usr/bin/env python3
"""Affiliate lead discovery — YouTube Data API -> regex email -> Reoon validate.
Keys come from env (YT_KEY, REOON_KEY) so no secrets live in this file.
Dry by default: discovers + validates + prints. (Insert/pitch/send wired separately.)
"""
import os, re, json, time, urllib.parse, subprocess

YT = os.environ["YT_KEY"]
REOON = os.environ["REOON_KEY"]
KEYWORDS = ["pet loss grief support", "pet memorial keepsake", "rainbow bridge pet", "dog mom vlog",
            "cat parent channel", "rescue dog diary", "pet bereavement", "losing a pet comfort"]
PER_KW = 10  # channels per keyword (search.list = 100 units each)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

def get(url):
    out = subprocess.run(["curl", "-sS", url], capture_output=True, timeout=40)
    return json.loads(out.stdout.decode("utf-8", "replace"))

def yt(path, **params):
    params["key"] = YT
    return get("https://www.googleapis.com/youtube/v3/" + path + "?" + urllib.parse.urlencode(params))

def reoon(email):
    try:
        d = get(f"https://emailverifier.reoon.com/api/v1/verify?{urllib.parse.urlencode({'email':email,'key':REOON,'mode':'quick'})}")
        return d.get("status", "?")
    except Exception as e:
        return f"err:{e}"

seen, leads = set(), []
for kw in KEYWORDS:
    try:
        s = yt("search", part="snippet", q=kw, type="channel", maxResults=PER_KW)
    except Exception as e:
        print(f"[search err {kw}] {e}"); continue
    cids = [it["id"]["channelId"] for it in s.get("items", []) if it.get("id", {}).get("channelId")]
    if not cids: continue
    ch = yt("channels", part="snippet", id=",".join(cids), maxResults=len(cids))
    for c in ch.get("items", []):
        sn = c.get("snippet", {})
        desc = sn.get("description", "")
        title = sn.get("title", "")
        m = EMAIL_RE.search(desc)
        if not m: continue
        email = m.group(0).lower()
        if email in seen: continue
        seen.add(email)
        status = reoon(email); time.sleep(0.3)
        leads.append({"keyword": kw, "channel": title, "email": email,
                      "url": f"https://youtube.com/channel/{c['id']}", "reoon": status})

print(f"\n=== {len(leads)} leads with email (from {len(KEYWORDS)} keywords x {PER_KW}) ===")
for l in leads:
    print(f"  [{l['reoon']:>8}] {l['email']:<38} {l['channel'][:40]}  ({l['keyword']})")
good = [l for l in leads if l["reoon"] in ("safe", "valid")]
print(f"\nValid/safe: {len(good)} / {len(leads)}")
