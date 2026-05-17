/**
 * HowItWorks — three-step ribbon with hero illustration above.
 *
 * Top: 3-panel illustration (phone → preview → framed wall art) carrying the
 * visual story.
 * Below: numbered text cards with stagger reveal on scroll-into-view.
 *
 * Copy reflects the real flow (verified 2026-05-09): customer generates +
 * approves the portrait on screen BEFORE paying. There is no email-the-proof
 * step. Free-trial cap (3 generations) is intentionally not surfaced here —
 * it's discovered naturally inside the studio.
 */
import { motion } from "framer-motion";
import { PALETTE, display, eyebrow, EASE } from "./tokens";
import howItWorks640 from "@/assets/how-it-works-640w.webp";
import howItWorks1080 from "@/assets/how-it-works-1080w.webp";
import howItWorks1600 from "@/assets/how-it-works-1600w.webp";

interface Step {
  index: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    index: "01",
    title: "Add a photo",
    body: "Tell us the moment you picture.",
  },
  {
    index: "02",
    title: "See them painted on screen",
    body: "Adjust until it feels like them.",
  },
  {
    index: "03",
    title: "Bring them home",
    body: "Hand-finished canvas, 3–5 days.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(245, 245, 245, 0.84)",
        paddingTop: "clamp(56px, 7vh, 88px)",
        paddingBottom: "clamp(56px, 7vh, 88px)",
      }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto text-center" style={{ maxWidth: "960px" }}>
        <p style={eyebrow(PALETTE.goldDeep)}>How it works</p>
        <h2
          id="how-it-works-heading"
          style={{ ...display("clamp(26px, 3.2vw, 38px)"), color: PALETTE.ink, marginTop: "8px" }}
        >
          Describe it. <span style={{ color: PALETTE.rose, fontStyle: "italic" }}>See it.</span> Keep it.
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE.out }}
          className="mt-8 mx-auto"
          style={{ maxWidth: "880px" }}
        >
          <img
            src={howItWorks1080}
            srcSet={`${howItWorks640} 640w, ${howItWorks1080} 1080w, ${howItWorks1600} 1600w`}
            sizes="(max-width: 920px) calc(100vw - 48px), 880px"
            width={1672}
            height={941}
            alt="From a photo to a hand-finished canvas — describe the scene, see them painted on screen, then bring them home."
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "12px",
            }}
            loading="lazy"
            decoding="async"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-9 text-left">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s.index}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: idx * 0.12, ease: EASE.out }}
              className="relative"
            >
              {/* Index numeral — display-large, gold ghost. The big number
                  is the step indicator; we don't repeat "Step 0X" as text. */}
              <span
                aria-hidden
                style={{
                  ...display("56px"),
                  color: PALETTE.gold,
                  opacity: 0.22,
                  position: "absolute",
                  top: "-20px",
                  right: "-4px",
                  pointerEvents: "none",
                  lineHeight: 1,
                }}
              >
                {s.index}
              </span>

              <div className="relative" style={{ paddingTop: 10 }}>
                <h3
                  style={{
                    ...display("clamp(18px, 2vw, 21px)"),
                    color: PALETTE.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  style={{
                    marginTop: "8px",
                    color: PALETTE.earth,
                    fontSize: "15px",
                    lineHeight: 1.55,
                  }}
                >
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
