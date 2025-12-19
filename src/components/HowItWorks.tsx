import { PawPrint, Stars, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function HowItWorks() {
  const { t } = useLanguage();
  
  const steps = [
    {
      icon: PawPrint,
      titleKey: 'howItWorks.step1.title',
      descKey: 'howItWorks.step1.desc',
    },
    {
      icon: Stars,
      titleKey: 'howItWorks.step2.title',
      descKey: 'howItWorks.step2.desc',
    },
    {
      icon: FileText,
      titleKey: 'howItWorks.step3.title',
      descKey: 'howItWorks.step3.desc',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 px-4 z-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
          {t('howItWorks.title')}
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
          {t('howItWorks.subtitle')}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-gold/50 to-transparent" />
              )}
              
              <div className="text-center">
                {/* Step number */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gold text-background text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary/50 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-colors">
                  <step.icon className="w-10 h-10 text-gold" />
                </div>
                
                <h3 className="text-xl font-serif text-foreground mb-3">
                  {t(step.titleKey)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
