import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, subject, message }
      });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you within 24 hours.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try emailing us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <StarfieldBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Have a question about your cosmic pet reading? We're here to help!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cosmic-gold/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cosmic-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Email</h3>
                    <a href="mailto:support@astropaws.site" className="text-cosmic-gold hover:underline">
                      support@astropaws.site
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-cosmic-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Response Time</h3>
                    <p className="text-muted-foreground">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Money-Back Guarantee</h3>
                    <p className="text-muted-foreground">
                      Not satisfied? Get a full refund within 7 days, no questions asked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Common Questions</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → How accurate are the readings?
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → How do I access my report?
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → Can I get a refund?
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="refund">Refund Request</option>
                  <option value="report">Question About My Report</option>
                  <option value="gift">Gift Certificate Help</option>
                  <option value="affiliate">Affiliate Program</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50 min-h-[120px] resize-y"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <CosmicButton type="submit" className="w-full" disabled={isSubmitting}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </CosmicButton>
            </form>
          </div>
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
