/**
 * HowItWorks — 3 transparent step illustrations laid directly on the section
 * background (no card, no white box, no panel) so it reads seamless with the
 * page. Each step image is its own asset (src/assets/howitworks/stepN.webp,
 * alpha) so any single one can be re-iterated without touching the others.
 *
 * Copy reflects the real flow (verified 2026-05-09): the customer creates +
 * approves the portrait on screen BEFORE paying. No email-the-proof step.
 * Free-trial cap (3 generations) is intentionally not surfaced here.
 */
import { motion } from "framer-motion";
import { PALETTE, display, eyebrow, EASE } from "./tokens";
import step1 from "@/assets/howitworks/step1.webp";
import step2 from "@/assets/howitworks/step2.webp";
import step3 from "@/assets/howitworks/step3.webp";

interface Step {
  index: string;
  img: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    index: "01",
    img: step1,
    title: "Add a photo",
    body: "Tell us the moment you picture.",
  },
  {
    index: "02",
    img: step2,
    title: "See them painted on screen",
    body: "Adjust until it feels like them.",
  },
  {
    index: "03",
    img: step3,
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
        background: PALETTE.cream,
        paddingTop: "clamp(56px, 7vh, 88px)",
        paddingBottom: "clamp(56px, 7vh, 88px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto text-center" style={{ maxWidth: "1040px" }}>
        <p style={eyebrow(PALETTE.goldDeep)}>How it works</p>
        <h2
          id="how-it-works-heading"
          style={{ ...display("clamp(26px, 3.2vw, 38px)"), color: PALETTE.ink, marginTop: "8px" }}
        >
          Describe it. <span style={{ color: PALETTE.rose, fontStyle: "italic" }}>See it.</span> Keep it.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 mt-10 md:mt-12">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s.index}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: EASE.out }}
              className="flex flex-col items-center"
            >
              {/* Transparent illustration — no box/radius/bg, floats on the
                  section so it stays seamless with the page. */}
              <img
                src={s.img}
                width={1024}
                height={1024}
                alt={s.title}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  maxWidth: 260,
                  height: "auto",
                  display: "block",
                }}
              />

              <span
                aria-hidden
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: PALETTE.gold,
                  marginTop: 8,
                }}
              >
                {s.index}
              </span>

              <h3
                style={{
                  ...display("clamp(18px, 2vw, 21px)"),
                  color: PALETTE.ink,
                  lineHeight: 1.2,
                  marginTop: 6,
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  marginTop: "6px",
                  color: PALETTE.earth,
                  fontSize: "15px",
                  lineHeight: 1.55,
                  maxWidth: 240,
                }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
