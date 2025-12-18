import { Navbar } from "@/components/Navbar";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background">
      <StarfieldBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: December 2024</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Astropaws ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Service Description</h2>
            <p>
              Astropaws provides entertainment-based cosmic personality readings for pets. Our readings are 
              created for entertainment purposes only and should not be considered as veterinary, behavioral, 
              or professional advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Payment & Refunds</h2>
            <p>
              All payments are processed securely through Stripe. We offer a <strong className="text-cosmic-gold">30-day money-back guarantee</strong>. 
              If you're not completely satisfied with your pet's cosmic reading, contact us within 30 days 
              of purchase for a full refund.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Gift Certificates</h2>
            <p>
              Gift certificates are valid for 12 months from the date of purchase. Gift certificates are 
              non-refundable but may be transferred to another recipient by contacting customer support.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              All content, including text, graphics, logos, and cosmic readings, are the property of Astropaws 
              and protected by intellectual property laws. You may share your personal reading but may not 
              reproduce our content for commercial purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. User Conduct</h2>
            <p>
              You agree to provide accurate information about your pet and to use the service for personal, 
              non-commercial purposes only. Any misuse of the service may result in termination of access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>
              Astropaws provides readings for entertainment purposes. We are not liable for any decisions 
              made based on our readings. Always consult qualified professionals for pet health and behavior concerns.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a href="mailto:support@astropaws.site" className="text-cosmic-gold hover:underline">
                support@astropaws.site
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <Link to="/" className="text-cosmic-gold hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
