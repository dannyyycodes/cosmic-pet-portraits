import { Navbar } from "@/components/Navbar";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const { t } = useLanguage();
  
  return (
    <main className="min-h-screen bg-background">
      <StarfieldBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">{t('privacy.title')}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">{t('privacy.lastUpdated')}</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section1Title')}</h2>
            <p>{t('privacy.section1Intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t('privacy.petInfo')}:</strong> {t('privacy.petInfoDesc')}</li>
              <li><strong>{t('privacy.contactInfo')}:</strong> {t('privacy.contactInfoDesc')}</li>
              <li><strong>{t('privacy.paymentInfo')}:</strong> {t('privacy.paymentInfoDesc')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section2Title')}</h2>
            <p>{t('privacy.section2Intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.use1')}</li>
              <li>{t('privacy.use2')}</li>
              <li>{t('privacy.use3')}</li>
              <li>{t('privacy.use4')}</li>
              <li>{t('privacy.use5')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section3Title')}</h2>
            <p>{t('privacy.section3Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section4Title')}</h2>
            <p>{t('privacy.section4Intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> {t('privacy.stripe')}</li>
              <li><strong>Resend:</strong> {t('privacy.resend')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section5Title')}</h2>
            <p>{t('privacy.section5Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section6Title')}</h2>
            <p>{t('privacy.section6Intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.right1')}</li>
              <li>{t('privacy.right2')}</li>
              <li>{t('privacy.right3')}</li>
              <li>{t('privacy.right4')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section7Title')}</h2>
            <p>{t('privacy.section7Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section8Title')}</h2>
            <p>{t('privacy.section8Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section9Title')}</h2>
            <p>{t('privacy.section9Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('privacy.section10Title')}</h2>
            <p>
              {t('privacy.section10Content')}{" "}
              <a href="mailto:support@astropets.cloud" className="text-cosmic-gold hover:underline">
                support@astropets.cloud
              </a>
            </p>
          </section>
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