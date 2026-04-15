#!/usr/bin/env bash
# Generate 5 author portraits via Kie.ai nano-banana-2 and update authors.image_url
set -u

KIE_KEY="${KIE_API_KEY:-b6950bc9ee85f941ecb523ce34efb4a0}"
SUPABASE_PAT="${SUPABASE_PAT:-sbp_c42487f85976568fe45b151e012df814d5df3f49}"
PROJECT_REF="aduibsyrnenzobuyetmn"

AUTHORS=(elena-whitaker callum-hayes maggie-oshea river-callahan rowan-sterling)

# Prompts as heredocs stored in separate files (Kie body built with jq)
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

cat > "$TMPDIR/elena-whitaker.txt" <<'PROMPT'
Little Souls author portrait series — Dr. Elena Whitaker, consistent character. Realistic editorial photograph, warm natural window light from camera-left, shallow depth of field. A 45-year-old white woman with ash-brown shoulder-length hair loosely tucked behind one ear, subtle grey at the temples, minimal makeup, calm hazel eyes, a faint smile with a slight asymmetry on the right. Small silver hoop earrings, no other jewelry. Wearing a soft oatmeal-colored linen shirt under an unbuttoned faded navy exam coat, a simple braided leather watch. Background: a softly blurred veterinary exam room with warm wood shelves, a potted pothos, and a cream-colored wall — cream and sage palette, not clinical white. Mood: grounded, competent, kind. Photographic style: muted film look, Kodak Portra 400 aesthetic, grain subtle, no HDR. Square crop, framed from mid-chest up, eyes slightly above center line.
PROMPT

cat > "$TMPDIR/callum-hayes.txt" <<'PROMPT'
Little Souls author portrait series — Callum Hayes, consistent character. Realistic editorial photograph, overcast natural light, outdoors. A 47-year-old white British man with close-cropped dark brown hair going grey at the sides, a short salt-and-pepper beard, weathered skin with faint crow's feet, grey-blue eyes, direct gaze, no smile but relaxed mouth. Wearing a worn waxed olive Barbour-style jacket over a charcoal merino henley, a faded leather dog lead looped over one shoulder. Background: softly blurred wet Pacific Northwest forest trail, mossy Douglas firs, damp earth palette — greens and browns, no vibrant colors. Mood: calm, watchful, understated competence. Photographic style: moody documentary, Fujifilm Pro 400H aesthetic, slightly cool tones, natural grain. Square crop, framed from mid-chest up.
PROMPT

cat > "$TMPDIR/maggie-oshea.txt" <<'PROMPT'
Little Souls author portrait series — Maggie OShea, consistent character. Realistic editorial photograph, warm afternoon window light, indoors. A 42-year-old white Irish woman with shoulder-length copper-red hair with a slight wave, pale skin with freckles across the nose and cheeks, green eyes, small silver nose stud, a warm slightly amused smile. Wearing a cream cable-knit wool jumper, a thin gold chain, tortoiseshell reading glasses pushed up on her head. Background: softly blurred home interior — a sage-green armchair, a stack of books, a black-and-white senior cat curled in soft focus on the chair behind her, warm wood bookshelves. Palette: cream, rust, sage, warm browns. Mood: inviting, intelligent, quietly playful. Photographic style: natural editorial, Portra 800 aesthetic, soft contrast, gentle grain. Square crop, framed from mid-chest up.
PROMPT

cat > "$TMPDIR/river-callahan.txt" <<'PROMPT'
Little Souls author portrait series — River Callahan, consistent character. Realistic editorial photograph with a softly illustrative quality, golden hour warm light, indoors. A 38-year-old woman of mixed Irish and Mexican heritage with long wavy dark brown hair worn loose, olive-toned skin, warm brown eyes with a calm gaze, small silver hoop earrings, a thin gold chain with a crescent moon pendant, subtle natural makeup, a soft closed-mouth smile. Wearing a rust-colored linen wrap top, a cream knit shawl draped across one shoulder, rings on two fingers. Background: softly blurred home study with a small wooden altar, dried pampas grass, a trailing plant, a candle, a Pisces cat out of focus on a windowsill. Palette: cream, rust, soft gold, sage, warm terracotta. Mood: grounded mystic, warm, attentive. Photographic style: editorial with a painterly softness, Portra 400 aesthetic, gentle glow. Square crop, framed from mid-chest up.
PROMPT

cat > "$TMPDIR/rowan-sterling.txt" <<'PROMPT'
Little Souls author portrait series — Rowan Sterling, consistent character. Realistic editorial photograph, soft overcast window light, indoors. A 52-year-old Black American woman with short natural silver-grey hair cropped close, warm brown skin, kind brown eyes behind delicate round gold-wire glasses, a gentle closed-mouth smile with visible laugh lines, small pearl stud earrings, a simple gold wedding band on a chain. Wearing a charcoal merino turtleneck under a long oatmeal cardigan, a silver pendant at her throat. Background: softly blurred quiet home interior — a low bookshelf, a framed botanical print, a potted fern, an old beagle asleep on a cushion in the distance, warm lamp glow. Palette: charcoal, cream, soft moss green, warm amber. Mood: steady, present, deeply calm. Photographic style: gentle editorial, Portra 400 aesthetic, low contrast, fine grain. Square crop, framed from mid-chest up.
PROMPT

declare -A TASK_IDS

echo "[1/3] Creating Kie.ai tasks..."
for slug in "${AUTHORS[@]}"; do
  prompt=$(cat "$TMPDIR/$slug.txt")
  body=$(jq -n --arg p "$prompt" '{model:"nano-banana-2", input:{prompt:$p, aspect_ratio:"1:1"}}')
  resp=$(curl -sS -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
    -H "Authorization: Key $KIE_KEY" \
    -H "Content-Type: application/json" \
    -d "$body")
  tid=$(echo "$resp" | jq -r '.data.taskId // empty')
  if [ -n "$tid" ]; then
    echo "  $slug: task $tid"
    TASK_IDS[$slug]=$tid
  else
    echo "  $slug: CREATE FAIL — $resp"
  fi
done

echo ""
echo "[2/3] Polling..."
declare -A URLS
SECS=0
while [ ${#TASK_IDS[@]} -gt 0 ] && [ $SECS -lt 420 ]; do
  for slug in "${!TASK_IDS[@]}"; do
    tid="${TASK_IDS[$slug]}"
    resp=$(curl -sS "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=$tid" \
      -H "Authorization: Key $KIE_KEY")
    state=$(echo "$resp" | jq -r '.data.state // empty')
    if [ "$state" = "success" ]; then
      url=$(echo "$resp" | jq -r '.data.resultJson // "{}"' | jq -r '.resultUrls[0] // empty')
      if [ -n "$url" ]; then
        echo "  $slug: $url"
        URLS[$slug]=$url
        unset 'TASK_IDS[$slug]'
      fi
    elif [ "$state" = "fail" ] || [ "$state" = "failed" ] || [ "$state" = "error" ]; then
      reason=$(echo "$resp" | jq -r '.data.failReason // .msg // "unknown"')
      echo "  $slug: FAIL — $reason"
      unset 'TASK_IDS[$slug]'
    fi
  done
  if [ ${#TASK_IDS[@]} -eq 0 ]; then break; fi
  sleep 6
  SECS=$((SECS+6))
done

if [ ${#TASK_IDS[@]} -gt 0 ]; then
  echo "  Still pending after 7 min: ${!TASK_IDS[*]}"
fi

echo ""
echo "[3/3] Updating Supabase authors..."
for slug in "${!URLS[@]}"; do
  url="${URLS[$slug]}"
  sql="UPDATE authors SET image_url='$url' WHERE slug='$slug';"
  body=$(jq -n --arg q "$sql" '{query:$q}')
  resp=$(curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_PAT" \
    -H "Content-Type: application/json" \
    -d "$body" -w "%{http_code}")
  http="${resp: -3}"
  if [ "$http" = "201" ]; then
    echo "  $slug: OK"
  else
    echo "  $slug: DB FAIL ($http)"
  fi
done

echo ""
echo "Done. ${#URLS[@]}/${#AUTHORS[@]} portraits live."
