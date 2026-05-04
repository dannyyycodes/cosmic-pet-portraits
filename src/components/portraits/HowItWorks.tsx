/**
 * HowItWorks — three-step ribbon with hero illustration above.
 *
 * Top: 3-panel illustration (phone → proof → framed wall art) carrying the
 * visual story.
 * Below: numbered text cards with stagger reveal on scroll-into-view.
 */
import { motion } from "framer-motion";
import { SplitWords } from "./SplitWords";
import { PALETTE, display, cormorantItalic, eyebrow, EASE } from "./tokens";
import howItWorks640 from "@/assets/how-it-works-640w.webp";
import howItWorks1080 from "@/assets/how-it-works-1080w.webp";
import howItWorks1600 from "@/assets/how-it-works-1600w.webp";

interface Step {
  index: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    index: "01",
    title: "Upload your pet's photo.",
    body: (
      <>
        Pick your favourite art style, upload a picture of your pet, and{" "}
        <strong style={{ fontWeight: 600 }}>place your order.</strong>
      </>
    ),
  },
  {
    index: "02",
    title: "Review and approve your custom artwork.",
    body: (
      <>
        We'll prepare a proof of your pet's portrait for you to review. Look it over,
        request any changes you'd like, and approve the final design. Then we'll get it
        ready for printing and shipping.{" "}
        <strong style={{ fontWeight: 600 }}>Your happiness is 100% guaranteed.</strong>
      </>
    ),
  },
  {
    index: "03",
    title: "Keep them close forever.",
    body: (
      <>
        Hang your best friend on the wall or give the art as a heartfelt gift. Don't
        forget to share a photo on Instagram and tag{" "}
        <strong style={{ fontWeight: 600 }}>@littlesouls.app</strong> — we'd love to see it.
      </>
    ),
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
            <SplitWords text="Three steps." />{" "}
            <SplitWords text="Three minutes" style={{ color: PALETTE.rose, fontStyle: "italic" }} delay={0.3} />{" "}
            <SplitWords text="from photo to wall." delay={0.55} />
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
            alt="Three steps to a custom pet portrait — upload your pet's photo on your phone, approve the proof, then hang the framed artwork on your wall."
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-12 md:mt-14">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s.index}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: idx * 0.12, ease: EASE.out }}
              className="relative"
            >
              {/* Index numeral — display-large, gold ghost */}
              <span
                aria-hidden
                style={{
                  ...display("84px"),
                  color: PALETTE.gold,
                  opacity: 0.18,
                  position: "absolute",
                  top: "-30px",
                  right: "-6px",
                  pointerEvents: "none",
                }}
              >
                {s.index}
              </span>

              <div className="relative">
                <p
                  style={{
                    ...eyebrow(PALETTE.rose),
                    marginBottom: "14px",
                  }}
                >
                  Step {s.index}
                </p>

                <h3
                  style={{
                    ...display("clamp(22px, 2.4vw, 28px)"),
                    color: PALETTE.ink,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  style={{
                    marginTop: "14px",
                    color: PALETTE.earth,
                    fontSize: "16.5px",
                    lineHeight: 1.7,
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
