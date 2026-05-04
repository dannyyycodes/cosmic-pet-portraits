/**
 * PortraitsFAQ — six objection-handling questions.
 * Uses radix Accordion (already installed via shadcn).
 *
 * Questions cover the obvious checkout-blockers: turnaround, photo
 * requirements, framing material, sizing, refund/revision policy,
 * multi-pet portraits.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PALETTE, display, cormorantItalic, eyebrow } from "./tokens";

interface QA {
  q: string;
  a: React.ReactNode;
}

const QAS: QA[] = [
  {
    q: "How long does it take?",
    a: (
      <>
        Cinematic preview in roughly <strong>30 seconds</strong>. Full framed parcel arrives in{" "}
        <strong>3–5 business days</strong> across UK · EU · US — we print at the partner closest to
        your delivery address, so it almost never crosses borders.
      </>
    ),
  },
  {
    q: "What kind of photo do I need?",
    a: (
      <>
        Anything clear-ish. A phone snap is fine. Daylight is best, but candle-lit sofa moments
        also work. We compress and clean it on your device before upload — the original never
        leaves your phone in full quality. <strong>JPG, PNG, HEIC, WebP up to 50MB.</strong>
      </>
    ),
  },
  {
    q: "What are the frames made of?",
    a: (
      <>
        Slim FSC-certified poplar/pine frames in three finishes (natural · walnut · ink black).
        Print is on cotton-poly canvas, archival inks, matte finish. Built to outlast every
        sofa you'll ever own.
      </>
    ),
  },
  {
    q: "What if I don't love it?",
    a: (
      <>
        We re-do it free. If a second pass still doesn't feel like <em>them</em>, we refund every
        cent — no return required, keep the proof. Our job isn't a sale, it's a portrait you'll
        actually hang.
      </>
    ),
  },
  {
    q: "Can I order more than one pet in the same portrait?",
    a: (
      <>
        Multi-pet portraits launch shortly after the single-pet flow stabilises (Phase 2 of the
        roadmap). For now, the cleanest result comes from a single subject per frame. Drop us a
        note if you'd like to be in the early-access cohort.
      </>
    ),
  },
  {
    q: "Is this AI? Do you really paint these?",
    a: (
      <>
        We use a hand-tuned cinematic image pipeline — not stock filters, not a one-click
        generator. Each character world is prompted, lit, colour-graded and proofed by a real
        person. Think of it as a director and DP working with a very fast cinematographer.
      </>
    ),
  },
];

export function PortraitsFAQ() {
  return (
    <section
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(245, 245, 245, 0.84)",
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
      }}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12" style={{ maxWidth: "1080px" }}>
        <div className="lg:col-span-4">
          <p style={eyebrow(PALETTE.goldDeep)}>Honest answers</p>
          <h2
            id="faq-heading"
            style={{ ...display("clamp(32px, 4vw, 50px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            The bits people{" "}
            <span style={{ color: PALETTE.rose, fontStyle: "italic" }}>
              actually
            </span>{" "}
            ask before clicking buy.
          </h2>
          <p style={{ ...cormorantItalic("19px"), color: PALETTE.earth, marginTop: "16px" }}>
            Not in the list? Email{" "}
            <a
              href="mailto:hello@littlesouls.app"
              className="ls-link"
            >
              hello@littlesouls.app
            </a>{" "}
            — a real human reads everything.
          </p>
        </div>

        <div className="lg:col-span-8">
          <Accordion type="single" collapsible className="space-y-2">
            {QAS.map((qa, idx) => (
              <AccordionItem
                key={qa.q}
                value={`item-${idx}`}
                className="rounded-sm overflow-hidden"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                }}
              >
                <AccordionTrigger
                  className="px-5 py-5 hover:no-underline text-left"
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: "18px",
                    fontWeight: 500,
                    color: PALETTE.ink,
                  }}
                >
                  {qa.q}
                </AccordionTrigger>
                <AccordionContent
                  className="px-5 pb-5"
                  style={{
                    color: PALETTE.earth,
                    fontSize: "16px",
                    lineHeight: 1.65,
                  }}
                >
                  {qa.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
