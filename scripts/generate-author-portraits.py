#!/usr/bin/env python3
"""Generate 5 author portraits via Kie.ai nano-banana-2 and update authors.image_url.

Uses subprocess(curl) to avoid Python SSL cert issues on some Windows toolchains.
"""
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

KIE_KEY = os.environ.get("KIE_API_KEY", "b6950bc9ee85f941ecb523ce34efb4a0")
SUPABASE_PAT = os.environ.get("SUPABASE_PAT", "sbp_c42487f85976568fe45b151e012df814d5df3f49")
PROJECT_REF = "aduibsyrnenzobuyetmn"

PROMPTS = {
    "elena-whitaker": "Little Souls author portrait series — Dr. Elena Whitaker, consistent character. Realistic editorial photograph, warm natural window light from camera-left, shallow depth of field. A 45-year-old white woman with ash-brown shoulder-length hair loosely tucked behind one ear, subtle grey at the temples, minimal makeup, calm hazel eyes, a faint smile with a slight asymmetry on the right. Small silver hoop earrings, no other jewelry. Wearing a soft oatmeal-colored linen shirt under an unbuttoned faded navy exam coat. Background: a softly blurred veterinary exam room with warm wood shelves, a potted pothos, and a cream-colored wall — cream and sage palette, not clinical white. Mood: grounded, competent, kind. Photographic style: muted film look, Kodak Portra 400 aesthetic, grain subtle, no HDR. Square crop, framed from mid-chest up.",
    "callum-hayes": "Little Souls author portrait series — Callum Hayes, consistent character. Realistic editorial photograph, overcast natural light, outdoors. A 47-year-old white British man with close-cropped dark brown hair going grey at the sides, a short salt-and-pepper beard, weathered skin with faint crow's feet, grey-blue eyes, direct gaze, no smile but relaxed mouth. Wearing a worn waxed olive Barbour-style jacket over a charcoal merino henley, a faded leather dog lead looped over one shoulder. Background: softly blurred wet Pacific Northwest forest trail, mossy Douglas firs, damp earth palette — greens and browns, no vibrant colors. Mood: calm, watchful, understated competence. Photographic style: moody documentary, Fujifilm Pro 400H aesthetic, slightly cool tones, natural grain. Square crop, framed from mid-chest up.",
    "maggie-oshea": "Little Souls author portrait series — Maggie OShea, consistent character. Realistic editorial photograph, warm afternoon window light, indoors. A 42-year-old white Irish woman with shoulder-length copper-red hair with a slight wave, pale skin with freckles across the nose and cheeks, green eyes, small silver nose stud, a warm slightly amused smile. Wearing a cream cable-knit wool jumper, a thin gold chain, tortoiseshell reading glasses pushed up on her head. Background: softly blurred home interior — a sage-green armchair, a stack of books, a black-and-white senior cat curled in soft focus on the chair behind her, warm wood bookshelves. Palette: cream, rust, sage, warm browns. Mood: inviting, intelligent, quietly playful. Photographic style: natural editorial, Portra 800 aesthetic, soft contrast, gentle grain. Square crop, framed from mid-chest up.",
    "river-callahan": "Little Souls author portrait series — River Callahan, consistent character. Realistic editorial photograph with a softly illustrative quality, golden hour warm light, indoors. A 38-year-old woman of mixed Irish and Mexican heritage with long wavy dark brown hair worn loose, olive-toned skin, warm brown eyes with a calm gaze, small silver hoop earrings, a thin gold chain with a crescent moon pendant, subtle natural makeup, a soft closed-mouth smile. Wearing a rust-colored linen wrap top, a cream knit shawl draped across one shoulder, rings on two fingers. Background: softly blurred home study with a small wooden altar, dried pampas grass, a trailing plant, a candle, a Pisces cat out of focus on a windowsill. Palette: cream, rust, soft gold, sage, warm terracotta. Mood: grounded mystic, warm, attentive. Photographic style: editorial with a painterly softness, Portra 400 aesthetic, gentle glow. Square crop, framed from mid-chest up.",
    "rowan-sterling": "Little Souls author portrait series — Rowan Sterling, consistent character. Realistic editorial photograph, soft overcast window light, indoors. A 52-year-old Black American woman with short natural silver-grey hair cropped close, warm brown skin, kind brown eyes behind delicate round gold-wire glasses, a gentle closed-mouth smile with visible laugh lines, small pearl stud earrings, a simple gold wedding band on a chain. Wearing a charcoal merino turtleneck under a long oatmeal cardigan, a silver pendant at her throat. Background: softly blurred quiet home interior — a low bookshelf, a framed botanical print, a potted fern, an old beagle asleep on a cushion in the distance, warm lamp glow. Palette: charcoal, cream, soft moss green, warm amber. Mood: steady, present, deeply calm. Photographic style: gentle editorial, Portra 400 aesthetic, low contrast, fine grain. Square crop, framed from mid-chest up.",
}


def curl_json(method, url, headers, body=None, timeout=60):
    args = ["curl", "-sS", "-X", method, url]
    for k, v in headers.items():
        args.extend(["-H", f"{k}: {v}"])
    if body is not None:
        args.extend(["--data", json.dumps(body)])
    try:
        out = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        if not out.stdout.strip():
            return None, f"empty response (stderr: {out.stderr[:200]})"
        return json.loads(out.stdout), None
    except subprocess.TimeoutExpired:
        return None, "timeout"
    except json.JSONDecodeError as e:
        return None, f"json decode: {e} (out: {out.stdout[:200]})"
    except Exception as e:
        return None, str(e)


def create_task(slug, prompt):
    resp, err = curl_json(
        "POST",
        "https://api.kie.ai/api/v1/jobs/createTask",
        {"Authorization": f"Bearer {KIE_KEY}", "Content-Type": "application/json"},
        {"model": "nano-banana-2", "input": {"prompt": prompt, "aspect_ratio": "1:1"}},
    )
    if err:
        return slug, None, err
    tid = (resp.get("data") or {}).get("taskId")
    if not tid:
        return slug, None, f"no taskId: {resp}"
    return slug, tid, None


def poll_task(slug, task_id, timeout_s=420, interval_s=6):
    started = time.time()
    while time.time() - started < timeout_s:
        resp, err = curl_json(
            "GET",
            f"https://api.kie.ai/api/v1/jobs/recordInfo?taskId={task_id}",
            {"Authorization": f"Bearer {KIE_KEY}"},
        )
        if err:
            time.sleep(interval_s)
            continue
        d = resp.get("data") or {}
        state = d.get("state")
        if state == "success":
            rjson = d.get("resultJson")
            if isinstance(rjson, str):
                try:
                    parsed = json.loads(rjson)
                    urls = parsed.get("resultUrls") or parsed.get("result_urls") or []
                    if urls:
                        return slug, urls[0], None
                except Exception as e:
                    return slug, None, f"resultJson parse: {e}"
            return slug, None, "no url in resultJson"
        if state in ("fail", "failed", "error"):
            return slug, None, f"state={state}: {d.get('failReason') or d}"
        time.sleep(interval_s)
    return slug, None, "timeout"


def update_author(slug, image_url):
    sql = f"UPDATE authors SET image_url = $$'${image_url}'$$  WHERE slug = '{slug}';"
    # Simpler — interpolate directly since URL is a known-safe string
    sql = "UPDATE authors SET image_url = %s WHERE slug = %s;" % (
        "'" + image_url.replace("'", "''") + "'",
        "'" + slug + "'",
    )
    args = [
        "curl", "-sS", "-X", "POST",
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        "-H", f"Authorization: Bearer {SUPABASE_PAT}",
        "-H", "Content-Type: application/json",
        "-w", "\n%{http_code}",
        "--data", json.dumps({"query": sql}),
    ]
    out = subprocess.run(args, capture_output=True, text=True, timeout=30)
    http = out.stdout.strip().split("\n")[-1]
    return http == "201"


def main():
    slug_to_task = {}
    print("[1/3] Creating tasks...")
    with ThreadPoolExecutor(max_workers=5) as ex:
        results_iter = ex.map(lambda p: create_task(*p), PROMPTS.items())
        for slug, tid, err in results_iter:
            if err:
                print(f"  {slug}: CREATE FAIL — {err}")
            else:
                print(f"  {slug}: task {tid}")
                slug_to_task[slug] = tid

    if not slug_to_task:
        print("No tasks created. Aborting.")
        sys.exit(1)

    print(f"\n[2/3] Polling {len(slug_to_task)} tasks (up to 7 min)...")
    results = {}
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(poll_task, s, t): s for s, t in slug_to_task.items()}
        for f in as_completed(futures):
            slug, url, err = f.result()
            if err:
                print(f"  {slug}: POLL FAIL — {err}")
            else:
                print(f"  {slug}: {url}")
                results[slug] = url

    print(f"\n[3/3] Updating {len(results)} authors...")
    for slug, url in results.items():
        ok = update_author(slug, url)
        print(f"  {slug}: {'OK' if ok else 'DB UPDATE FAIL'}")

    print(f"\nDone. {len(results)}/{len(PROMPTS)} portraits live.")


if __name__ == "__main__":
    main()
