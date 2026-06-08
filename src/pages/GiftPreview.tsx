import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Gift, Check } from "lucide-react";

/* Static visual mockups of 3 elevated /gift directions. No checkout logic —
   purely to choose the look. The winner gets applied to the real GiftPurchase
   (flow preserved). Reviews removed in all three. */

const OCCASIONS = [
  { emoji: "🌱", label: "They just got a new pet" },
  { emoji: "🔮", label: "They've had their pet for years" },
  { emoji: "🕊️", label: "Their pet has passed" },
  { emoji: "🎂", label: "It's their pet's birthday" },
];

const TIERS = [
  {
    name: "Soul Reading",
    tag: "The reading they'll keep coming back to.",
    price: "£29",
    was: "£39",
    badge: null as string | null,
    feats: [
      "A 30-section reading written for their pet",
      "Their pet's photo, woven into the reveal",
      "Theirs forever — on any device",
    ],
  },
  {
    name: "Soul Bond",
    tag: "Them and their pet, read side by side.",
    price: "£49",
    was: "£69",
    badge: "MOST GIFTED",
    feats: [
      "Everything in Soul Reading, plus:",
      "Their chart against their pet's — why the universe paired them",
      "The soul-reasons they found each other",
    ],
  },
];

/* ════ OPTION 1 — THE ENVELOPE (artifact, centered, deep) ════ */
function OptionEnvelope() {
  const [occ, setOcc] = useState(1);
  const [tier, setTier] = useState(1);
  return (
    <section className="gpv gpv1">
      <span className="gpv-chip">Option 1 · The Envelope</span>

      <div className="gpv1-card">
        <span className="gpv1-seal" aria-hidden="true">✦</span>
        <p className="gpv1-eyebrow">A Soul Reading — written for their pet</p>
        <h1 className="gpv1-h1">Give them the soul<br /><em>behind the pet.</em></h1>
        <p className="gpv1-sub">A keepsake reading, mapped from their pet's real birth sky. Opened like a gift, kept forever.</p>
        <button className="gpv1-cta"><Gift size={17} /> Begin the gift — from £29</button>
        <p className="gpv1-trust">Instant digital delivery · Valid 1 year · 100% loved or refunded</p>
      </div>

      <p className="gpv1-kick">Who's it for?</p>
      <div className="gpv1-toc">
        {OCCASIONS.map((o, i) => (
          <button key={o.label} className={`gpv1-row ${occ === i ? "is-active" : ""}`} onClick={() => setOcc(i)}>
            <span className="gpv1-glyph">{o.emoji}</span>
            <span className="gpv1-label">{o.label}</span>
            <span className="gpv1-arrow">→</span>
          </button>
        ))}
      </div>

      <div className="gpv1-tiers">
        {TIERS.map((t, i) => (
          <button key={t.name} className={`gpv1-tier ${tier === i ? "is-active" : ""}`} onClick={() => setTier(i)}>
            {t.badge && <span className="gpv1-badge">{t.badge}</span>}
            <div className="gpv1-tier-head">
              <div>
                <p className="gpv1-tier-name">{t.name}</p>
                <p className="gpv1-tier-tag">{t.tag}</p>
              </div>
              <div className="gpv1-tier-price">
                <span className="gpv1-was">{t.was}</span>
                <span className="gpv1-now">{t.price}</span>
              </div>
            </div>
            <div className="gpv1-feats">
              {t.feats.map((f) => (
                <p key={f} className={f.endsWith(":") ? "gpv1-feat-div" : "gpv1-feat"}>
                  {!f.endsWith(":") && <Check size={13} />}<span>{f}</span>
                </p>
              ))}
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .gpv1 { background: radial-gradient(120% 80% at 50% -8%, rgba(60,44,86,0.4), transparent 55%), #0a0810; }
        .gpv1-card {
          position: relative; max-width: 560px; margin: 0 auto;
          text-align: center; padding: clamp(56px,8vw,82px) clamp(26px,5vw,52px) clamp(40px,5vw,52px);
          border: 1px solid rgba(212,182,122,0.35);
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(245,239,230,0.05), rgba(8,6,12,0.4));
          box-shadow: inset 0 0 0 1px rgba(212,182,122,0.1), inset 0 0 60px rgba(212,182,122,0.05), 0 40px 100px rgba(0,0,0,0.55);
        }
        .gpv1-seal {
          position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
          width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%;
          background: #0a0810; border: 1px solid rgba(212,182,122,0.5); color: #d4b67a;
          font-size: 1rem; box-shadow: 0 0 22px rgba(212,182,122,0.4);
        }
        .gpv1-eyebrow { color: #d4b67a; font: 600 0.72rem/1 Lato,system-ui,sans-serif; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 26px; }
        .gpv1-h1 { font-family: "Playfair Display",Georgia,serif; font-weight: 500; color: #f7f0e3; font-size: clamp(2.1rem,6vw,3.1rem); line-height: 1.08; margin-bottom: 22px; }
        .gpv1-h1 em { font-style: italic; color: #d4b67a; }
        .gpv1-sub { color: rgba(245,239,230,0.7); font: 400 clamp(0.98rem,1.8vw,1.12rem)/1.6 Lato,system-ui,sans-serif; max-width: 40ch; margin: 0 auto 30px; }
        .gpv1-cta { display: inline-flex; align-items: center; gap: 10px; padding: 15px 30px; border: none; border-radius: 50px; background: #d4b67a; color: #0a0810; font: 700 0.98rem Lato,system-ui,sans-serif; cursor: pointer; box-shadow: 0 14px 36px rgba(212,182,122,0.28); }
        .gpv1-trust { margin-top: 18px; color: rgba(245,239,230,0.4); font: 400 0.74rem Lato,system-ui,sans-serif; letter-spacing: 0.02em; }
        .gpv1-kick { text-align: center; color: #d4b67a; font: 600 0.72rem/1 Lato,system-ui,sans-serif; letter-spacing: 0.22em; text-transform: uppercase; margin: clamp(48px,7vw,80px) 0 18px; }
        .gpv1-toc { max-width: 480px; margin: 0 auto; border-top: 1px solid rgba(212,182,122,0.18); }
        .gpv1-row { width: 100%; display: flex; align-items: center; gap: 14px; padding: 18px 16px; background: transparent; border: 0; border-bottom: 1px solid rgba(212,182,122,0.18); border-left: 3px solid transparent; cursor: pointer; color: #f5efe6; font: italic 400 clamp(1.02rem,3vw,1.18rem) Lato,system-ui,sans-serif; text-align: left; transition: all 0.2s; }
        .gpv1-row:hover { background: rgba(245,239,230,0.04); }
        .gpv1-row.is-active { color: #d4b67a; border-left-color: #d4b67a; background: rgba(245,239,230,0.05); }
        .gpv1-glyph { width: 24px; text-align: center; opacity: 0.85; }
        .gpv1-label { flex: 1; }
        .gpv1-arrow { color: rgba(245,239,230,0.4); font-style: normal; }
        .gpv1-row.is-active .gpv1-arrow { color: #d4b67a; transform: translateX(3px); }
        .gpv1-tiers { display: grid; gap: 16px; max-width: 560px; margin: 30px auto 0; }
        .gpv1-tier { position: relative; text-align: left; padding: 24px 22px; border-radius: 20px; cursor: pointer; border: 2px solid rgba(212,182,122,0.22); background: rgba(245,239,230,0.04); transition: all 0.2s; }
        .gpv1-tier.is-active { border-color: #d4b67a; background: rgba(245,239,230,0.07); box-shadow: 0 6px 24px rgba(212,182,122,0.18); }
        .gpv1-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #d4b67a; color: #0a0810; font: 800 0.58rem Lato,system-ui,sans-serif; letter-spacing: 0.1em; padding: 3px 14px; border-radius: 20px; }
        .gpv1-tier-head { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
        .gpv1-tier-name { font-family: "Playfair Display",Georgia,serif; font-size: 1.3rem; color: #f7f0e3; margin-bottom: 4px; }
        .gpv1-tier-tag { font: italic 400 0.86rem Lato,system-ui,sans-serif; color: rgba(245,239,230,0.66); }
        .gpv1-tier-price { text-align: right; flex-shrink: 0; }
        .gpv1-was { display: block; font-family: "Playfair Display",serif; color: rgba(245,239,230,0.4); text-decoration: line-through; font-size: 0.95rem; }
        .gpv1-now { font-family: "Playfair Display",serif; font-size: 2rem; color: #f7f0e3; }
        .gpv1-feats { display: flex; flex-direction: column; gap: 7px; }
        .gpv1-feat { display: flex; align-items: flex-start; gap: 8px; color: rgba(245,239,230,0.78); font: 400 0.85rem/1.4 Lato,system-ui,sans-serif; }
        .gpv1-feat svg { color: #4a8c5c; flex-shrink: 0; margin-top: 2px; }
        .gpv1-feat-div { color: #d4b67a; font: italic 600 0.85rem Lato,system-ui,sans-serif; }
      `}</style>
    </section>
  );
}

/* ════ OPTION 2 — EDITORIAL SPLIT (live gift-card preview) ════ */
function OptionSplit() {
  const [occ, setOcc] = useState(0);
  const [tier, setTier] = useState(1);
  const [to, setTo] = useState("Sarah");
  const [msg, setMsg] = useState("You and Bella were always meant to find each other. Here's the proof. ✦");
  return (
    <section className="gpv gpv2">
      <span className="gpv-chip">Option 2 · Editorial Split</span>
      <div className="gpv2-grid">
        {/* LEFT: live gift-card preview */}
        <aside className="gpv2-left">
          <div className="gpv2-giftcard">
            <span className="gpv2-gc-seal" aria-hidden="true">✦</span>
            <p className="gpv2-gc-eyebrow">A Little Souls gift</p>
            <p className="gpv2-gc-to">For <strong>{to || "…"}</strong></p>
            <p className="gpv2-gc-msg">“{msg || "Your message appears here…"}”</p>
            <div className="gpv2-gc-foot">
              <span>{TIERS[tier].name}</span>
              <span>{TIERS[tier].price}</span>
            </div>
          </div>
          <p className="gpv2-left-note">This is what they'll open. It updates as you write.</p>
        </aside>

        {/* RIGHT: the flow */}
        <div className="gpv2-right">
          <p className="gpv2-eyebrow">The gift</p>
          <h1 className="gpv2-h1">A soul reading, made for the pet they love.</h1>

          <p className="gpv2-step">1 · What's the moment?</p>
          <div className="gpv2-occ">
            {OCCASIONS.map((o, i) => (
              <button key={o.label} className={`gpv2-occ-btn ${occ === i ? "is-active" : ""}`} onClick={() => setOcc(i)}>
                <span>{o.emoji}</span> {o.label}
              </button>
            ))}
          </div>

          <p className="gpv2-step">2 · Which reading?</p>
          <div className="gpv2-tiers">
            {TIERS.map((t, i) => (
              <button key={t.name} className={`gpv2-tier ${tier === i ? "is-active" : ""}`} onClick={() => setTier(i)}>
                <div>
                  <p className="gpv2-tier-name">{t.name} {t.badge && <em>· {t.badge}</em>}</p>
                  <p className="gpv2-tier-tag">{t.tag}</p>
                </div>
                <span className="gpv2-tier-price">{t.price}</span>
              </button>
            ))}
          </div>

          <p className="gpv2-step">3 · Make it personal</p>
          <input className="gpv2-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Their name" />
          <textarea className="gpv2-input gpv2-textarea" value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="Write them a message…" />

          <button className="gpv2-cta">Continue to checkout <ArrowRight size={17} /></button>
        </div>
      </div>

      <style>{`
        .gpv2 { background: #0d0a14; }
        .gpv2-grid { max-width: 1080px; margin: 0 auto; display: grid; gap: clamp(24px,4vw,52px); grid-template-columns: 1fr; }
        @media (min-width: 920px) { .gpv2-grid { grid-template-columns: 0.92fr 1.08fr; align-items: start; } .gpv2-left { position: sticky; top: 80px; } }
        .gpv2-giftcard { position: relative; padding: clamp(30px,4vw,44px); border-radius: 20px; background: linear-gradient(150deg, rgba(212,182,122,0.16), rgba(124,92,214,0.12) 60%, rgba(13,10,20,0.6)); border: 1px solid rgba(212,182,122,0.3); box-shadow: 0 30px 80px rgba(0,0,0,0.5); min-height: 280px; display: flex; flex-direction: column; }
        .gpv2-gc-seal { position: absolute; top: 18px; right: 20px; color: #d4b67a; font-size: 1.2rem; text-shadow: 0 0 14px rgba(212,182,122,0.7); }
        .gpv2-gc-eyebrow { color: #d4b67a; font: 600 0.68rem/1 Lato,system-ui,sans-serif; letter-spacing: 0.22em; text-transform: uppercase; }
        .gpv2-gc-to { margin-top: 18px; color: #f5efe6; font-family: "Playfair Display",serif; font-size: 1.5rem; }
        .gpv2-gc-to strong { color: #d4b67a; font-weight: 500; }
        .gpv2-gc-msg { margin-top: 14px; flex: 1; color: rgba(245,239,230,0.86); font: italic 400 1.05rem/1.55 "Playfair Display",Georgia,serif; }
        .gpv2-gc-foot { display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid rgba(212,182,122,0.25); color: rgba(245,239,230,0.8); font: 600 0.85rem Lato,system-ui,sans-serif; }
        .gpv2-left-note { margin-top: 14px; text-align: center; color: rgba(245,239,230,0.45); font: italic 0.82rem Lato,system-ui,sans-serif; }
        .gpv2-eyebrow { color: #d4b67a; font: 600 0.72rem/1 Lato,system-ui,sans-serif; letter-spacing: 0.2em; text-transform: uppercase; }
        .gpv2-h1 { font-family: "Playfair Display",Georgia,serif; font-weight: 500; color: #f7f0e3; font-size: clamp(1.8rem,4vw,2.6rem); line-height: 1.12; margin: 12px 0 30px; max-width: 18ch; }
        .gpv2-step { color: #d4b67a; font: 700 0.74rem Lato,system-ui,sans-serif; letter-spacing: 0.06em; margin: 26px 0 12px; }
        .gpv2-occ { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .gpv2-occ-btn { padding: 13px 14px; border-radius: 12px; border: 1px solid rgba(212,182,122,0.22); background: rgba(245,239,230,0.04); color: #f5efe6; font: 500 0.9rem Lato,system-ui,sans-serif; cursor: pointer; text-align: left; transition: all 0.2s; }
        .gpv2-occ-btn.is-active { border-color: #d4b67a; background: rgba(212,182,122,0.12); }
        .gpv2-tiers { display: grid; gap: 10px; }
        .gpv2-tier { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 14px; border: 1px solid rgba(212,182,122,0.22); background: rgba(245,239,230,0.04); cursor: pointer; text-align: left; transition: all 0.2s; }
        .gpv2-tier.is-active { border-color: #d4b67a; background: rgba(212,182,122,0.1); }
        .gpv2-tier-name { color: #f7f0e3; font: 600 1rem "Playfair Display",serif; }
        .gpv2-tier-name em { color: #d4b67a; font-style: normal; font-size: 0.7rem; letter-spacing: 0.08em; }
        .gpv2-tier-tag { color: rgba(245,239,230,0.6); font: italic 0.8rem Lato,system-ui,sans-serif; margin-top: 2px; }
        .gpv2-tier-price { color: #f7f0e3; font: 500 1.5rem "Playfair Display",serif; flex-shrink: 0; }
        .gpv2-input { width: 100%; padding: 13px 15px; margin-bottom: 10px; border-radius: 12px; border: 1px solid rgba(212,182,122,0.22); background: rgba(245,239,230,0.05); color: #f5efe6; font: 400 0.95rem Lato,system-ui,sans-serif; outline: none; box-sizing: border-box; }
        .gpv2-textarea { resize: none; }
        .gpv2-cta { width: 100%; margin-top: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; border: none; border-radius: 50px; background: #d4b67a; color: #0a0810; font: 700 0.98rem Lato,system-ui,sans-serif; cursor: pointer; box-shadow: 0 12px 32px rgba(212,182,122,0.26); }
      `}</style>
    </section>
  );
}

/* ════ OPTION 3 — REVEAL RITUAL (full-bleed scenes, white serif) ════ */
function OptionRitual() {
  const [occ, setOcc] = useState(2);
  const [tier, setTier] = useState(1);
  return (
    <section className="gpv gpv3">
      <span className="gpv-chip">Option 3 · Reveal Ritual</span>

      <div className="gpv3-scene">
        <h1 className="gpv3-h1">Some gifts are opened.<br /><span className="gpv3-em">This one is felt.</span></h1>
      </div>

      <div className="gpv3-scene gpv3-scene--alt">
        <h2 className="gpv3-h2">What's the moment?</h2>
        <div className="gpv3-occ">
          {OCCASIONS.map((o, i) => (
            <button key={o.label} className={`gpv3-occ-btn ${occ === i ? "is-active" : ""}`} onClick={() => setOcc(i)}>
              <span className="gpv3-occ-emoji">{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gpv3-scene">
        <h2 className="gpv3-h2">How deep should it go?</h2>
        <div className="gpv3-tiers">
          {TIERS.map((t, i) => (
            <button key={t.name} className={`gpv3-tier ${tier === i ? "is-active" : ""}`} onClick={() => setTier(i)}>
              {t.badge && <span className="gpv3-tier-badge">{t.badge}</span>}
              <p className="gpv3-tier-name">{t.name}</p>
              <p className="gpv3-tier-price">{t.price}</p>
              <p className="gpv3-tier-tag">{t.tag}</p>
            </button>
          ))}
        </div>
        <button className="gpv3-cta">Begin the gift <ArrowRight size={18} /></button>
      </div>

      <style>{`
        .gpv3 { background: radial-gradient(130% 90% at 50% -10%, rgba(60,44,86,0.5), transparent 55%), #07050c; padding: 0 !important; }
        .gpv3-scene { min-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 12vh 6vw; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .gpv3-scene--alt { background: rgba(255,255,255,0.015); }
        .gpv3-eyebrow { color: rgba(255,255,255,0.6); font: 600 0.74rem/1 Lato,system-ui,sans-serif; letter-spacing: 0.26em; text-transform: uppercase; margin-bottom: 28px; }
        .gpv3-h1 { font-family: "Playfair Display",Georgia,serif; font-weight: 500; color: #fff; font-size: clamp(2.4rem,8vw,5rem); line-height: 1.05; }
        .gpv3-em { font-style: italic; color: rgba(255,255,255,0.92); }
        .gpv3-sub { margin-top: 26px; color: rgba(255,255,255,0.66); font: 400 clamp(1rem,2vw,1.3rem)/1.6 Lato,system-ui,sans-serif; max-width: 36ch; }
        .gpv3-divider { display: block; margin: 38px 0 10px; color: rgba(255,255,255,0.5); font-size: 0.9rem; letter-spacing: 0.4em; }
        .gpv3-scroll { color: rgba(255,255,255,0.4); font: 400 0.78rem Lato,system-ui,sans-serif; letter-spacing: 0.2em; text-transform: uppercase; }
        .gpv3-num { font-family: "Playfair Display",serif; font-style: italic; color: rgba(255,255,255,0.35); font-size: 1.4rem; margin-bottom: 12px; }
        .gpv3-h2 { font-family: "Playfair Display",Georgia,serif; font-weight: 500; color: #fff; font-size: clamp(1.9rem,5vw,3.2rem); line-height: 1.1; margin-bottom: 40px; }
        .gpv3-occ { display: flex; flex-direction: column; gap: 12px; width: min(100%, 500px); }
        .gpv3-occ-btn { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); color: #fff; font: 400 clamp(1.05rem,2.4vw,1.35rem) "Playfair Display",Georgia,serif; cursor: pointer; text-align: left; transition: all 0.25s; }
        .gpv3-occ-btn:hover { background: rgba(255,255,255,0.06); }
        .gpv3-occ-btn.is-active { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); }
        .gpv3-occ-emoji { font-size: 1.3rem; }
        .gpv3-tiers { display: grid; gap: 16px; width: min(100%, 560px); grid-template-columns: 1fr 1fr; }
        @media (max-width: 560px) { .gpv3-tiers { grid-template-columns: 1fr; } }
        .gpv3-tier { position: relative; padding: 28px 22px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); cursor: pointer; text-align: center; transition: all 0.25s; }
        .gpv3-tier.is-active { border-color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.08); }
        .gpv3-tier-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; color: #07050c; font: 800 0.56rem Lato,system-ui,sans-serif; letter-spacing: 0.1em; padding: 3px 12px; border-radius: 20px; white-space: nowrap; }
        .gpv3-tier-name { color: #fff; font: 500 1.25rem "Playfair Display",serif; }
        .gpv3-tier-price { color: #fff; font: 500 2.4rem "Playfair Display",serif; margin: 6px 0; }
        .gpv3-tier-tag { color: rgba(255,255,255,0.6); font: italic 0.86rem/1.4 Lato,system-ui,sans-serif; }
        .gpv3-cta { margin-top: 40px; display: inline-flex; align-items: center; gap: 10px; padding: 17px 38px; border: 1px solid rgba(255,255,255,0.5); border-radius: 50px; background: transparent; color: #fff; font: 600 1rem Lato,system-ui,sans-serif; cursor: pointer; transition: all 0.25s; }
        .gpv3-cta:hover { background: #fff; color: #07050c; }
      `}</style>
    </section>
  );
}

export default function GiftPreview() {
  return (
    <main className="gpv-page">
      <header className="gpv-head">
        <Link to="/" className="gpv-back"><ArrowLeft size={15} /> Home</Link>
        <span>Gift page — 3 directions · reviews removed · tell me 1, 2 or 3</span>
      </header>
      <OptionEnvelope />
      <OptionSplit />
      <OptionRitual />
      <style>{`
        .gpv-page { background: #07050c; color: #f5efe6; }
        .gpv-head { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; padding: 11px 16px; background: rgba(7,5,12,0.82); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,0.08); font: 600 12px/1.4 Lato,system-ui,sans-serif; color: rgba(255,255,255,0.72); text-align: center; }
        .gpv-back { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.6); text-decoration: none; }
        .gpv { position: relative; padding: clamp(56px,8vw,110px) 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .gpv-chip { position: absolute; top: clamp(16px,3vw,26px); left: clamp(16px,3vw,26px); z-index: 5; font: 700 11px/1 Lato,system-ui,sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.62); border: 1px solid rgba(255,255,255,0.2); padding: 6px 11px; border-radius: 999px; }
      `}</style>
    </main>
  );
}
