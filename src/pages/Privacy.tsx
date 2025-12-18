import { Navbar } from "@/components/Navbar";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background">
      <StarfieldBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: December 2024</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect the following information to provide our cosmic pet reading service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pet Information:</strong> Name, species, breed, birth date, birth location, and personality traits</li>
              <li><strong>Contact Information:</strong> Email address for delivery of your reading</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we never store your card details)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate your personalized cosmic pet reading</li>
              <li>Deliver your reading via email</li>
              <li>Process payments and refunds</li>
              <li>Respond to customer support inquiries</li>
              <li>Improve our service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We use Supabase for 
              data storage and Stripe for payment processing, both of which maintain strict security standards.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We only share 
              data with service providers necessary to operate our business:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Resend:</strong> Email delivery</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
            <p>
              We use minimal cookies to track affiliate referrals (30-day duration) and maintain session 
              state. We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
            <p>
              We retain your pet reading and associated data indefinitely so you can access your report 
              at any time. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect information 
              from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes 
              via email or through our website.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at{" "}
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
