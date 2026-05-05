import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";

export default function Refund() {
  return (
    <main className="min-h-screen" style={{ background: "#FFFDF5" }}>
      <Helmet>
        <title>Refund & Cancellation Policy · Little Souls</title>
        <meta
          name="description"
          content="Refund, cancellation and replacement policy for Cosmic Pet Portraits and Soul Readings under UK Consumer Contracts Regulations 2013."
        />
      </Helmet>

      <Navbar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <div
          className="bg-white rounded-2xl border p-8 md:p-12"
          style={{ borderColor: "#e8ddd0", boxShadow: "0 1px 2px rgba(20,18,16,.04)" }}
        >
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#141210" }}
          >
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm mb-10" style={{ color: "#958779" }}>
            Last updated 5 May 2026 · Little Souls Ltd, registered in England &amp; Wales
          </p>

          <div className="space-y-10" style={{ color: "#5a4a42", lineHeight: 1.7 }}>
            <Section title="1. Personalised canvas portraits — exempt from 14-day cooling off">
              <p>
                Each Cosmic Pet Portrait canvas is uniquely created from your pet's photo and birth
                details. As a personalised item, your order is exempt from the standard 14-day
                cancellation right under{" "}
                <em>Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, regulation 28(1)(b)</em>.
              </p>
              <p>
                You consent to this when you tick the "I understand my canvas is personalised"
                checkbox at checkout. Without this consent the order cannot proceed.
              </p>
            </Section>

            <Section title="2. Order changes (within 24 hours)">
              <p>
                You can change the size, frame colour, or shipping address of your canvas order
                within 24 hours of placement, free of charge — provided we haven't already submitted
                the file to print. Email{" "}
                <a className="underline" style={{ color: "#bf524a" }} href="mailto:support@littlesouls.app">
                  support@littlesouls.app
                </a>{" "}
                with your order number.
              </p>
            </Section>

            <Section title="3. Damage or print defect — 30-day replacement">
              <p>
                If your canvas arrives damaged, defective, or with a print fault, we will replace it
                free within <strong>30 days of delivery</strong>. Email{" "}
                <a className="underline" style={{ color: "#bf524a" }} href="mailto:support@littlesouls.app">
                  support@littlesouls.app
                </a>{" "}
                with your order number and a clear photo of the issue. Replacement canvases are
                produced and dispatched within 3–5 working days.
              </p>
            </Section>

            <Section title="4. Lost in transit">
              <p>
                If your canvas hasn't arrived within 14 working days of dispatch (UK domestic) or 30
                working days (international), we will open a carrier claim and either reproduce or
                refund. Reach out as soon as you suspect the parcel is lost — earlier claims resolve
                faster.
              </p>
            </Section>

            <Section title="5. Pet photo unusable">
              <p>
                If the photo you uploaded is too low-resolution, blurry, or otherwise unsuitable for
                printing, we'll email within 24 hours requesting a clearer photo. Your order pauses
                until we receive a usable one. We don't proceed silently with a poor photo — we'd
                rather wait than ship a print that disappoints.
              </p>
            </Section>

            <Section title="6. Soul Reading — digital service consent">
              <p>
                By purchasing a Soul Reading, you consent to immediate generation and delivery and
                acknowledge you waive your 14-day right to cancel under{" "}
                <em>Consumer Contracts Regulations 2013, regulation 37</em>. Once your reading is
                generated and emailed, the order cannot be cancelled.
              </p>
              <p>
                You confirm this when you tick the "I consent to immediate delivery of my Soul
                Reading" checkbox at checkout. Without this consent the order cannot proceed.
              </p>
            </Section>

            <Section title="7. Soul Reading — 7-day satisfaction (goodwill)">
              <p>
                If you're genuinely unhappy with your Soul Reading — not because the meaning challenged
                you, but because something went wrong — write to us within 7 days of receipt. Our
                goodwill policy is to consider concerns case-by-case, regenerate the reading, or refund
                where appropriate. This is a goodwill commitment, not a statutory right, but we want
                pet families to feel cared for.
              </p>
            </Section>

            <Section title="8. Refunds before generation">
              <p>
                If you cancel a Soul Reading via your Shopify order email{" "}
                <strong>before</strong> our system has begun generating it (typically a window of a
                few minutes), we'll process a full refund automatically. After generation begins the
                cancellation right is waived per §6.
              </p>
            </Section>

            <Section title="9. How refunds are issued">
              <p>
                Refunds return to the original payment method via Shopify / Stripe. Allow 5–10 working
                days for the refund to appear on your statement, depending on your card issuer.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                Questions about this policy?{" "}
                <a className="underline" style={{ color: "#bf524a" }} href="mailto:support@littlesouls.app">
                  support@littlesouls.app
                </a>{" "}
                — we read every email.
              </p>
              <p className="text-sm" style={{ color: "#958779" }}>
                See also our{" "}
                <a className="underline" style={{ color: "#bf524a" }} href="/privacy">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a className="underline" style={{ color: "#bf524a" }} href="/terms">
                  Terms of Service
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-semibold"
        style={{ fontFamily: "Georgia, serif", color: "#141210" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
