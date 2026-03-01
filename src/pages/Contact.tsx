import { useState } from "react";
import { Navbar } from "@/components/Navbar";
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
    <main style={{ background: '#FFFDF5', minHeight: '100vh' }}>
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{t('contact.title')}</h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#9a8578' }}>
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="p-6" style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{t('contact.getInTouch')}</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#faf6ef' }}>
                    <Mail className="w-5 h-5" style={{ color: '#c4a265' }} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: '#3d2f2a' }}>{t('contact.email')}</h3>
                    <a href="mailto:hello@littlesouls.co" className="hover:underline" style={{ color: '#c4a265' }}>
                      hello@littlesouls.co
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#faf6ef' }}>
                    <Clock className="w-5 h-5" style={{ color: '#c4a265' }} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: '#3d2f2a' }}>{t('contact.responseTime')}</h3>
                    <p style={{ color: '#9a8578' }}>{t('contact.responseTimeDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#faf6ef' }}>
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: '#3d2f2a' }}>{t('contact.guarantee')}</h3>
                    <p style={{ color: '#9a8578' }}>
                      {t('contact.guaranteeDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6" style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{t('contact.commonQuestions')}</h2>
              <ul className="space-y-3" style={{ color: '#9a8578' }}>
                <li>
                  <Link to="/#faq" className="transition-colors hover:opacity-80" style={{ color: '#c4a265' }}>
                    → {t('contact.faq1')}
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="transition-colors hover:opacity-80" style={{ color: '#c4a265' }}>
                    → {t('contact.faq2')}
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="transition-colors hover:opacity-80" style={{ color: '#c4a265' }}>
                    → {t('contact.faq3')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-6" style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>{t('contact.sendMessage')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#5a4a42' }}>{t('contact.nameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                  placeholder={t('contact.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#5a4a42' }}>{t('contact.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#5a4a42' }}>{t('contact.subjectLabel')}</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
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
                <label className="block text-sm font-medium mb-2" style={{ color: '#5a4a42' }}>{t('contact.messageLabel')}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', borderRadius: '10px' }}
                  placeholder={t('contact.messagePlaceholder')}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                disabled={isSubmitting}
              >
                <MessageCircle className="w-4 h-4" />
                {isSubmitting ? t('contact.sending') : t('contact.send')}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: '1px solid #e8ddd0' }}>
          <Link to="/" className="hover:underline" style={{ color: '#c4a265' }}>
            ← {t('nav.backHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
