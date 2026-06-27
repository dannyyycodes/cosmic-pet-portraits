/**
 * /pawtraits/art/:id — single premade-artwork product page.
 *
 * One library pawtrait (the same pieces shown in /pawtraits/gallery and posted
 * to Pinterest) sold as a ready-made print. The customer buys this EXACT image
 * — no upload, no generation. Downstream is the proven flow: printMaster_asis
 * crops the finished art to the chosen canvas ratio → /api/cart/checkout builds
 * the Shopify draft order → Gelato fulfils. Nothing here distinguishes a premade
 * sale from a custom one once it reaches checkout.
 *
 * Palette + framed preview match /pawtraits (tokens.ts + FramedCanvasPreview).
 * Sacred-copy: no "AI", no "report".
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { PALETTE, display, body, eyebrow } from "@/components/portraits/tokens";
import { FramedCanvasPreview } from "@/components/portraits/FramedCanvasPreview";
import {
  CANVAS_SIZES,
  FRAME_COLORS,
  resolveUnframedCanvasVariant,
  resolveFramedCanvasVariant,
  resolveDigitalVariant,
  type FrameColor,
} from "@/components/portraits/gelatoFramedCanvas";

type ArtRow = {
  id: string;
  pet_kind: string;
  breed: string;
  pet_name: string | null;
  art_style: string;
  aspect_ratio: string;
  backstory: string | null;
  prompt?: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
};

// "none" = unframed canvas; a FrameColor = framed canvas in that wood tone.
type FrameChoice = "none" | FrameColor;

// Lock-step with api/portraits.ts (handlePrintMasterAsis) + StudioFlow.
const ASIS_PPI_CLEAN = 150;
const ASIS_PPI_HIDE = 50;
// Digital deliverable = full-frame master; crop at native 2:3 (art is 1024×1536).
const DIGITAL_PM_SIZE = "12x18";
const DIGITAL_PRICE = resolveDigitalVariant().priceMajor;

const SITE = "https://www.littlesouls.app";

function prettyArtStyle(s: string): string {
  return (s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function detailPpi(srcW: number, srcH: number, inW: number, inH: number): number | null {
  if (!srcW || !srcH) return null;
  const pw = inW * 1000;
  const ph = inH * 1000;
  const scale = Math.max(pw / srcW, ph / srcH);
  return Math.floor(Math.min((pw / scale) / inW, (ph / scale) / inH));
}

function gcdInt(a: number, b: number): number {
  return b === 0 ? a : gcdInt(b, a % b);
}

// The artwork's true aspect ratio, reduced. Premade library art is uniformly
// 2:3 (1024×1536), but read it from the row so any future ratio just works.
function artRatio(r: ArtRow): { rw: number; rh: number; dec: number } {
  let w = 0;
  let h = 0;
  const m = (r.aspect_ratio || "").match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
  if (m) { w = parseInt(m[1], 10); h = parseInt(m[2], 10); }
  else if (r.width > 0 && r.height > 0) { w = r.width; h = r.height; }
  else { w = 2; h = 3; }
  const g = gcdInt(w, h) || 1;
  const rw = w / g;
  const rh = h / g;
  return { rw, rh, dec: rw / rh };
}

function cleanPrompt(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/^Vertical \d+:\d+\s*Type [AB]\s*Pawtraits\s*(portrait|customer-style room scene)\b/i, "Portrait")
    .replace(/\bPet-only\s+/gi, "")
    .replace(/,?\s*print-safe margins,?\s*sRGB\.?/gi, ".")
    .replace(/\s*No room,?\s*no wall,?\s*no canvas,?\s*no human,?\s*no second animal,?\s*no text,?\s*no logo,?\s*no watermark\.?\s*$/i, "")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export default function PawtraitArt() {
  const { id = "" } = useParams<{ id: string }>();
  const [row, setRow] = useState<ArtRow | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound">("loading");

  const [frame, setFrame] = useState<FrameChoice>("none");
  const [sizeKey, setSizeKey] = useState<string>("8x10");
  const [consent, setConsent] = useState(false);
  const [buying, setBuying] = useState<null | "print" | "digital">(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) { setLoadState("notfound"); return; }
    fetch("/api/portraits?action=library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "get", id }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.row?.id) { setRow(d.row as ArtRow); setLoadState("ready"); }
        else setLoadState("notfound");
      })
      .catch(() => { if (!cancelled) setLoadState("notfound"); });
    return () => { cancelled = true; };
  }, [id]);

  const title = row ? `${row.pet_name ? `${row.pet_name} the ` : ""}${row.breed}` : "Pawtrait";
  const description = row ? (row.backstory?.trim() || cleanPrompt(row.prompt)) : "";

  const framed = frame !== "none";
  const productType = framed ? "framed-canvas" : "canvas";

  // The artwork's true ratio — drives the preview so it always shows the FULL
  // piece and never changes shape as you switch size (premade art is 2:3).
  const ratio = useMemo(() => (row ? artRatio(row) : { rw: 2, rh: 3, dec: 2 / 3 }), [row]);

  const sizeDef = CANVAS_SIZES.find((s) => s.uid === sizeKey) ?? CANVAS_SIZES[4];
  const frameUpgrade = sizeDef.frameUpgradeGBP;

  // Per-size PPI quality + price (for the current frame mode).
  const sizeMeta = useMemo(() => {
    const map = new Map<string, { band: "sharp" | "good" | "low"; price: number | null }>();
    for (const s of CANVAS_SIZES) {
      const ppi = row ? detailPpi(row.width, row.height, s.inches.w, s.inches.h) : null;
      const band = ppi == null ? "good" : ppi >= ASIS_PPI_CLEAN ? "sharp" : ppi >= ASIS_PPI_HIDE ? "good" : "low";
      const v = framed ? resolveFramedCanvasVariant(s.uid, frame as FrameColor) : resolveUnframedCanvasVariant(s.uid);
      map.set(s.uid, { band, price: v?.priceMajor ?? null });
    }
    return map;
  }, [row, framed, frame]);

  const price = sizeMeta.get(sizeKey)?.price ?? null;
  const variant = framed ? resolveFramedCanvasVariant(sizeKey, frame as FrameColor) : resolveUnframedCanvasVariant(sizeKey);
  const canBuy = !!row && !!variant && buying === null && consent;

  /** Shared print-master + checkout. mode picks digital vs physical. */
  async function doCheckout(mode: "print" | "digital") {
    if (!row) return;
    setBuying(mode);
    try {
      const pmSizeKey = mode === "digital" ? DIGITAL_PM_SIZE : sizeKey;
      const pmRes = await fetch("/api/portraits?action=printMaster_asis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: row.image_url, sizeKey: pmSizeKey, source: "library" }),
        signal: AbortSignal.timeout(60_000),
      });
      const pm = await pmRes.json().catch(() => ({}));
      if (pmRes.status === 422 && pm?.error === "source_too_low_res") {
        const meta = typeof pm.largestUsableSize === "string"
          ? CANVAS_SIZES.find((s) => s.uid === pm.largestUsableSize) : null;
        toast.error(
          meta ? `This piece prints sharply up to ${meta.label}. Pick that size or smaller.`
               : "This size is too large for this piece — pick a smaller one.",
          { duration: 8000 },
        );
        setBuying(null);
        return;
      }
      if (!pmRes.ok || pm?.status !== "completed" || !pm?.printMasterPath) {
        throw new Error(pm?.error || pm?.message || `print prep failed (HTTP ${pmRes.status})`);
      }

      const item = mode === "digital"
        ? {
            kind: "template" as const, productType: "digital", sizeKey: "default",
            packId: `art-${row.id}`, packName: title, style: "photographic" as const,
            sourcePhotoUrl: row.image_url, previewUrl: row.image_url,
            printMasterPath: pm.printMasterPath as string,
            properties: { _print_mode: "premade-art", _library_id: row.id, _art_style: row.art_style },
          }
        : {
            kind: "template" as const, productType, sizeKey,
            ...(framed ? { frameColor: frame as FrameColor } : {}),
            packId: `art-${row.id}`, packName: title, style: "photographic" as const,
            sourcePhotoUrl: row.image_url, previewUrl: row.image_url,
            printMasterPath: pm.printMasterPath as string,
            properties: {
              _print_mode: "premade-art", _library_id: row.id, _art_style: row.art_style,
              ...(row.pet_name ? { _pet_name: row.pet_name } : {}),
            },
          };

      const coRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "GBP",
          items: [item],
          ...(mode === "print" ? { consent: { canvasPersonalisedAt: new Date().toISOString() } } : {}),
        }),
      });
      const co = await coRes.json().catch(() => ({}));
      // Provider-agnostic: Stripe path returns `url`, Shopify returns `invoiceUrl`.
      const redirectUrl = co?.url ?? co?.invoiceUrl;
      if (!coRes.ok || !redirectUrl) throw new Error(co?.error || `checkout failed (HTTP ${coRes.status})`);
      window.location.href = redirectUrl as string;
    } catch (e) {
      toast.error(`Couldn't start checkout: ${(e as Error).message?.slice(0, 120) || "unknown error"}. Try again.`, { duration: 8000 });
      setBuying(null);
    }
  }

  // ── states ────────────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div style={{ background: PALETTE.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="h-6 w-6 rounded-full border-2 animate-spin" style={{ borderColor: PALETTE.sandDeep, borderTopColor: PALETTE.rose }} />
      </div>
    );
  }
  if (loadState === "notfound" || !row) {
    return (
      <div style={{ background: PALETTE.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...body("16px"), color: PALETTE.earth, marginBottom: 18 }}>This piece isn't available.</p>
          <Link to="/pawtraits/gallery" style={{ background: PALETTE.rose, color: "#fff", padding: "13px 22px", borderRadius: 999, fontWeight: 700, ...body("15px") }}>Browse the gallery →</Link>
        </div>
      </div>
    );
  }

  const canonical = `${SITE}/pawtraits/art/${row.id}`;
  const metaTitle = `${title} — ${prettyArtStyle(row.art_style)} Pet Portrait Print | Little Souls`;
  const metaDesc = (description || `A ${prettyArtStyle(row.art_style).toLowerCase()} ${row.breed} portrait, printed locally on gallery canvas — from £39.`).slice(0, 320);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={row.image_url} />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="Little Souls" />
        <meta property="product:price:amount" content={`${price ?? 39}.00`} />
        <meta property="product:price:currency" content="GBP" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:image" content={row.image_url} />
      </Helmet>

      <div style={{ background: PALETTE.cream, minHeight: "100vh", color: PALETTE.earth }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4" style={{ borderBottom: `1px solid ${PALETTE.sand}` }}>
          <Link to="/pawtraits/gallery" style={{ color: PALETTE.earthMuted, ...body("14px"), fontWeight: 600 }}>← Gallery</Link>
          <Link to="/pawtraits" style={{ ...display("17px"), color: PALETTE.ink }}>Little Souls · Pawtraits</Link>
          <Link to="/pawtraits#studio" style={{ background: PALETTE.rose, color: "#fff", padding: "8px 16px", borderRadius: 999, ...body("13px"), fontWeight: 700 }}>Make yours</Link>
        </div>

        <div className="mx-auto" style={{ maxWidth: 1120, padding: "28px 20px 96px" }}>
          <div className="ls-art-grid" style={{ display: "grid", gap: 36, gridTemplateColumns: "1fr", alignItems: "start" }}>
            {/* Live framed preview — real wood-tone frame, reflects size + frame */}
            <div style={{ position: "sticky", top: 24 }}>
              <FramedCanvasPreview
                imageUrl={row.image_url}
                sizeKey={sizeKey}
                frameColor={framed ? (frame as FrameColor) : null}
                maxWidth={540}
                aspectOverride={`${ratio.rw} / ${ratio.rh}`}
              />
            </div>

            {/* Buy panel */}
            <div>
              <p style={{ ...eyebrow(PALETTE.gold), marginBottom: 8 }}>{prettyArtStyle(row.art_style)} · ready-made print</p>
              <h1 style={{ ...display("34px"), color: PALETTE.ink, margin: "0 0 14px" }}>{title}</h1>
              {description && <p style={{ ...body("15.5px"), color: PALETTE.earth, margin: "0 0 24px", maxWidth: "52ch" }}>{description}</p>}

              {/* Frame — each wood option shows its +£ upgrade for the chosen size */}
              <p style={{ ...eyebrow(PALETTE.earthMuted), marginBottom: 10 }}>Frame</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                <FrameBtn active={frame === "none"} onClick={() => setFrame("none")} label="No frame" sub="included" />
                {FRAME_COLORS.map((f) => (
                  <FrameBtn key={f.uid} active={frame === f.uid} onClick={() => setFrame(f.uid)} label={f.label} sub={`+£${frameUpgrade}`} swatch={f.swatchHex} />
                ))}
              </div>

              {/* Size — price on every button */}
              <p style={{ ...eyebrow(PALETTE.earthMuted), marginBottom: 10 }}>Size</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8, marginBottom: 24 }}>
                {CANVAS_SIZES.map((s) => {
                  const m = sizeMeta.get(s.uid);
                  const active = sizeKey === s.uid;
                  return (
                    <button
                      key={s.uid}
                      type="button"
                      onClick={() => setSizeKey(s.uid)}
                      title={m?.band === "sharp" ? "Sharp" : "Great on the wall"}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                        background: active ? PALETTE.roseSoft : "#fff",
                        border: active ? `1.5px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sandDeep}`,
                        textAlign: "left",
                      }}
                    >
                      <span style={{ ...body("13.5px"), fontWeight: 700, color: PALETTE.ink }}>{s.label}</span>
                      <span style={{ ...body("13px"), fontWeight: 700, color: active ? PALETTE.rose : PALETTE.earth, fontVariantNumeric: "tabular-nums" }}>
                        {m?.price != null ? `£${m.price}` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Price + consent + buy */}
              <div style={{ borderTop: `1px solid ${PALETTE.sand}`, paddingTop: 22 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
                  <span style={{ ...display("30px"), color: PALETTE.ink, fontVariantNumeric: "tabular-nums" }}>{price != null ? `£${price}` : "—"}</span>
                  <span style={{ ...body("13px"), color: PALETTE.earthMuted }}>
                    {framed ? `${sizeDef.label} canvas + £${frameUpgrade} frame · ` : ""}printed locally · ships worldwide
                  </span>
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", ...body("13px"), color: PALETTE.earthMuted, marginBottom: 16, cursor: "pointer" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, accentColor: PALETTE.rose }} />
                  <span>I understand this print is made to order for me and starts production once I order.</span>
                </label>

                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => doCheckout("print")}
                  style={{
                    width: "100%", padding: "16px 24px", borderRadius: 14, ...display("16px"), fontWeight: 700,
                    background: canBuy ? PALETTE.rose : "#e7c9c6", color: "#fff", border: "none",
                    cursor: canBuy ? "pointer" : "not-allowed",
                    boxShadow: canBuy ? "0 10px 26px rgba(191,82,74,0.30)" : "none",
                  }}
                >
                  {buying === "print" ? "Starting checkout…" : "Buy this print →"}
                </button>

                {/* Digital — kept available but quiet, out of the main flow */}
                <button
                  type="button"
                  disabled={buying !== null}
                  onClick={() => doCheckout("digital")}
                  style={{
                    display: "block", margin: "12px auto 0", background: "none", border: "none",
                    color: PALETTE.earthMuted, ...body("13px"), cursor: buying !== null ? "default" : "pointer",
                    textDecoration: "underline", textUnderlineOffset: 3,
                  }}
                >
                  {buying === "digital" ? "Starting download checkout…" : `Prefer just the digital file? Download for £${DIGITAL_PRICE} →`}
                </button>

                {/* Make-your-own — distinct GOLD callout so it stands out from
                    the rose "buy this print" without competing for primary. */}
                <div style={{
                  marginTop: 24,
                  padding: "20px 22px",
                  borderRadius: 18,
                  background: "linear-gradient(180deg, #fffdf6 0%, #fbf3e3 100%)",
                  border: `1.5px solid ${PALETTE.goldSoft}`,
                  boxShadow: "0 8px 26px rgba(196,162,101,0.18)",
                }}>
                  <p style={{ ...eyebrow(PALETTE.goldDeep), marginBottom: 7 }}>Make it your own</p>
                  <p style={{ ...display("20px"), color: PALETTE.ink, margin: "0 0 6px" }}>
                    Want <em style={{ fontStyle: "italic" }}>your</em> pet in this exact style?
                  </p>
                  <p style={{ ...body("13.5px"), color: PALETTE.earth, margin: "0 0 16px", maxWidth: "44ch" }}>
                    Send one photo and we'll create a one-of-a-kind {prettyArtStyle(row.art_style).toLowerCase()} portrait of your own little soul.
                  </p>
                  <Link
                    to={`/pawtraits?style=${encodeURIComponent(row.art_style)}#studio`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: PALETTE.gold, color: "#fff",
                      padding: "14px 26px", borderRadius: 999,
                      ...display("15px"), fontWeight: 700, textDecoration: "none",
                      boxShadow: "0 10px 24px rgba(196,162,101,0.42)",
                    }}
                  >
                    Create your pet's portrait →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (min-width: 860px){ .ls-art-grid{ grid-template-columns: 1.05fr 0.95fr !important; gap: 48px !important; } }`}</style>
    </>
  );
}

function FrameBtn({ active, onClick, label, sub, swatch }: { active: boolean; onClick: () => void; label: string; sub?: string; swatch?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: 10,
        color: PALETTE.ink, cursor: "pointer",
        background: active ? PALETTE.roseSoft : "#fff",
        border: active ? `1.5px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sandDeep}`,
      }}
    >
      {swatch && <span style={{ width: 15, height: 15, borderRadius: 4, background: swatch, border: "1px solid rgba(0,0,0,0.15)" }} />}
      <span style={{ ...body("13.5px"), fontWeight: 700 }}>{label}</span>
      {sub && <span style={{ ...body("12px"), fontWeight: 700, color: active ? PALETTE.rose : PALETTE.earthMuted, fontVariantNumeric: "tabular-nums" }}>{sub}</span>}
    </button>
  );
}
