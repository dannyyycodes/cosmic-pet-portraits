import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen" style={{ background: '#FFFDF5' }}>
      <Navbar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <div className="bg-white rounded-2xl border border-[#e8ddd0] shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-serif font-bold text-[#3d2f2a] mb-8">{t('privacy.title')}</h1>

          <div className="prose max-w-none space-y-6 text-[#5a4a42]">
            <p className="text-sm">{t('privacy.lastUpdated')}</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section1Title')}</h2>
              <p>{t('privacy.section1Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t('privacy.petInfo')}:</strong> {t('privacy.petInfoDesc')}</li>
                <li><strong>{t('privacy.contactInfo')}:</strong> {t('privacy.contactInfoDesc')}</li>
                <li><strong>{t('privacy.paymentInfo')}:</strong> {t('privacy.paymentInfoDesc')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section2Title')}</h2>
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
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section3Title')}</h2>
              <p>{t('privacy.section3Content')}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section4Title')}</h2>
              <p>{t('privacy.section4Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> {t('privacy.stripe')}</li>
                <li><strong>Resend:</strong> {t('privacy.resend')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section5Title')}</h2>
              <p>{t('privacy.section5Content')}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section6Title')}</h2>
              <p>{t('privacy.section6Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('privacy.right1')}</li>
                <li>{t('privacy.right2')}</li>
                <li>{t('privacy.right3')}</li>
                <li>{t('privacy.right4')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section7Title')}</h2>
              <p>{t('privacy.section7Content')}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section8Title')}</h2>
              <p>{t('privacy.section8Content')}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section9Title')}</h2>
              <p>{t('privacy.section9Content')}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#3d2f2a]">{t('privacy.section10Title')}</h2>
              <p>
                {t('privacy.section10Content')}{" "}
                <a href="mailto:hello@littlesouls.co" className="text-[#c4a265] hover:underline">
                  hello@littlesouls.co
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#e8ddd0]">
            <Link to="/" className="text-[#c4a265] hover:underline">
              ← {t('nav.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
