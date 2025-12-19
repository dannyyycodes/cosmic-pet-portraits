import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

export function FAQ() {
  const { t } = useLanguage();

  const faqs = [
    { questionKey: "faq.q1", answerKey: "faq.a1" },
    { questionKey: "faq.q2", answerKey: "faq.a2" },
    { questionKey: "faq.q3", answerKey: "faq.a3" },
    { questionKey: "faq.q4", answerKey: "faq.a4" },
    { questionKey: "faq.q5", answerKey: "faq.a5" },
    { questionKey: "faq.q6", answerKey: "faq.a6" },
  ];

  return (
    <section id="faq" className="relative py-20 px-4 z-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
          {t('faq.title')}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          {t('faq.subtitle')}
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-secondary/30 border border-border/50 rounded-xl px-6 data-[state=open]:border-gold/40"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-gold py-5">
                {t(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {t(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
