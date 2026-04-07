import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const GIFT_REVIEWS = [
  {
    text: "Got this for my sister's birthday. She called me sobbing saying it was the most thoughtful gift she's ever received.",
    name: "Stephanie H.",
    context: "Birthday gift",
  },
  {
    text: "Valentine's Day gift for my girlfriend. She loved it more than flowers or jewellery. The compatibility reading was the cherry on top.",
    name: "Dave W.",
    context: "Valentine's gift",
  },
  {
    text: "My grandson got this for my 75th. I've had cats all my life and thought I knew everything. It called Duchess an old soul. Makes perfect sense.",
    name: "Margaret & Tom",
    context: "75th birthday gift",
  },
];

export const GiftSection = () => {
  const { ref, visible } = useScrollReveal(0.1);
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-22 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(191,82,74,0.03) 0%, var(--cream, #FFFDF5) 40%, rgba(196,162,101,0.04) 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
          }}
        >
          <div className="mb-4">
            <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5.5vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            The Most Thoughtful Gift
            <br />a Pet Parent Can Receive
          </h2>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.5vw, 1.1rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            A beautiful digital gift card delivered instantly. They choose their pet,
            fill in the details, and watch their reading come to life.
          </p>
        </div>

        {/* Gift options */}
        <div
          className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-3 mb-10 transition-all duration-1000`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.15s",
          }}
        >
          {[
            { name: "Soul Reading", price: "$27", desc: "Full cosmic portrait with SoulSpeak chat", tag: null },
            { name: "Soul Bond", price: "$35", desc: "Everything plus pet & owner compatibility", tag: "Most Gifted" },
            { name: "Hardcover Book", price: "$99", desc: "Printed keepsake book, shipped worldwide", tag: "Premium Gift" },
          ].map((tier, i) => (
            <a
              key={i}
              href="/gift"
              className="block rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: i === 1 ? "2px solid var(--rose, #bf524a)" : "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                textDecoration: "none",
              }}
            >
              {tier.tag && (
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-white mb-2"
                  style={{ fontSize: "0.6rem", fontWeight: 700, background: i === 2 ? "var(--gold, #c4a265)" : "var(--rose, #bf524a)" }}
                >
                  {tier.tag}
                </span>
              )}
              <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.95rem", color: "var(--ink, #1f1c18)", marginBottom: 2 }}>
                {tier.name}
              </h3>
              <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.3rem", color: "var(--ink, #1f1c18)", marginBottom: 4 }}>
                {tier.price}
              </p>
              <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.8rem", color: "var(--muted, #958779)", lineHeight: 1.4 }}>
                {tier.desc}
              </p>
            </a>
          ))}
        </div>

        {/* Gift testimonials */}
        <div
          className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-3 mb-8 transition-all duration-1000`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.25s",
          }}
        >
          {GIFT_REVIEWS.map((review, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.04)" }}
            >
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-3 h-3 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.5, marginBottom: 6 }}>
                "{review.text}"
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--muted, #958779)" }}>
                {review.name} · <span style={{ color: "var(--rose, #bf524a)", fontWeight: 600 }}>{review.context}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Memorial mention + CTA */}
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionDelay: "0.35s",
          }}
        >
          <a
            href="/gift"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "var(--rose, #bf524a)",
              boxShadow: "0 4px 20px rgba(191,82,74,0.2)",
              textDecoration: "none",
              minHeight: 52,
            }}
          >
            Send a Gift
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          <p
            className="mt-5"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "0.85rem",
              color: "var(--muted, #958779)",
              lineHeight: 1.5,
            }}
          >
            Also available in memorial mode for pets who've crossed the rainbow bridge.
            <br />
            <span style={{ fontSize: "0.8rem" }}>A way to honour a soul that will never be forgotten.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
