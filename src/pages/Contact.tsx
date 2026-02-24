import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { VariantBackground } from "@/components/variants/VariantBackground";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
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

      toast.success(t('contact.success'));
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <VariantBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{t('contact.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">{t('contact.getInTouch')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cosmic-gold/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cosmic-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.email')}</h3>
                    <a href="mailto:hello@astropets.cloud" className="text-cosmic-gold hover:underline">
                      hello@astropets.cloud
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-cosmic-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.responseTime')}</h3>
                    <p className="text-muted-foreground">{t('contact.responseTimeDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.guarantee')}</h3>
                    <p className="text-muted-foreground">
                      {t('contact.guaranteeDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('contact.commonQuestions')}</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → {t('contact.faq1')}
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → {t('contact.faq2')}
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-cosmic-gold transition-colors">
                    → {t('contact.faq3')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">{t('contact.sendMessage')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('contact.nameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder={t('contact.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('contact.emailLabel')}</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">{t('contact.subjectLabel')}</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  required
                >
                  <option value="">{t('contact.subjectPlaceholder')}</option>
                  <option value="refund">{t('contact.subjectRefund')}</option>
                  <option value="report">{t('contact.subjectReport')}</option>
                  <option value="gift">{t('contact.subjectGift')}</option>
                  <option value="affiliate">{t('contact.subjectAffiliate')}</option>
                  <option value="other">{t('contact.subjectOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('contact.messageLabel')}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50 min-h-[120px] resize-y"
                  placeholder={t('contact.messagePlaceholder')}
                  required
                />
              </div>

              <CosmicButton type="submit" className="w-full" disabled={isSubmitting}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? t('contact.sending') : t('contact.send')}
              </CosmicButton>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <Link to="/" className="text-cosmic-gold hover:underline">
            ← {t('nav.backHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}