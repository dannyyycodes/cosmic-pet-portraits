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
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
      }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1240px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.goldDeep)}>How it works</p>
          <h2
            id="how-it-works-heading"
            style={{ ...display("clamp(34px, 5vw, 58px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            Describe it. <span style={{ color: PALETTE.rose, fontStyle: "italic" }}>See it.</span> Keep it.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE.out }}
          className="mt-14"
        >
          <img
            src={howItWorks1080}
            srcSet={`${howItWorks640} 640w, ${howItWorks1080} 1080w, ${howItWorks1600} 1600w`}
            sizes="(max-width: 1280px) calc(100vw - 48px), 1192px"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 mt-12 md:mt-14">
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
                  ...display("110px"),
                  color: PALETTE.gold,
                  opacity: 0.22,
                  position: "absolute",
                  top: "-44px",
                  right: "-6px",
                  pointerEvents: "none",
                  lineHeight: 1,
                }}
              >
                {s.index}
              </span>

              <div className="relative" style={{ paddingTop: 16 }}>
                <h3
                  style={{
                    ...display("clamp(22px, 2.4vw, 26px)"),
                    color: PALETTE.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  style={{
                    marginTop: "12px",
                    color: PALETTE.earth,
                    fontSize: "17px",
                    lineHeight: 1.6,
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
