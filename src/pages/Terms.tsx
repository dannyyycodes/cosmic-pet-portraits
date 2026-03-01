import { Navbar } from "@/components/Navbar";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();
  
  return (
    <main className="min-h-screen bg-background">
      <StarfieldBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">{t('terms.title')}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">{t('terms.lastUpdated')}</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section1Title')}</h2>
            <p>{t('terms.section1Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section2Title')}</h2>
            <p>{t('terms.section2Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section3Title')}</h2>
            <p>{t('terms.section3Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section4Title')}</h2>
            <p>{t('terms.section4Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section5Title')}</h2>
            <p>{t('terms.section5Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section6Title')}</h2>
            <p>{t('terms.section6Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section7Title')}</h2>
            <p>{t('terms.section7Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section8Title')}</h2>
            <p>{t('terms.section8Content')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('terms.section9Title')}</h2>
            <p>
              {t('terms.section9Content')}{" "}
              <a href="mailto:hello@littlesouls.co" className="text-cosmic-gold hover:underline">
                hello@littlesouls.co
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