import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How accurate is the pet astrology reading?",
    answer: "Our readings use Swiss Ephemeris data—the same astronomical calculations used by professional astrologers worldwide. While astrology is a spiritual practice rather than a science, 92% of pet parents say their report accurately captured their pet's personality and energy.",
  },
  {
    question: "What information do I need about my pet?",
    answer: "You'll need your pet's birth date (or estimated birth date), species, and breed. We'll also ask a few fun questions about their personality to personalize the reading. The whole process takes about 60 seconds.",
  },
  {
    question: "Can I get a reading for any type of pet?",
    answer: "Yes! We support dogs, cats, birds, rabbits, horses, hamsters, fish, and reptiles. Each species has unique soul archetypes and cosmic patterns we've developed over years of study.",
  },
  {
    question: "What's included in the report?",
    answer: "Your report includes your pet's sun sign profile, soul archetype, superpower analysis, relationship compatibility with you, daily rhythm insights, and their unique 'soul contract'—the spiritual agreement they have with you.",
  },
  {
    question: "Is this a good gift for other pet owners?",
    answer: "Absolutely! Many customers purchase our reports as gifts. You can select 'Gift' mode at checkout to receive a beautifully formatted PDF that's perfect for sharing with fellow pet lovers.",
  },
  {
    question: "What if I don't know my pet's exact birth date?",
    answer: "No worries! An estimated birth date works perfectly well. If you adopted your pet and only know their approximate age, you can enter an estimated date. The cosmic insights will still resonate with their soul energy.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-20 px-4 z-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Everything you need to know about your pet's cosmic reading
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-secondary/30 border border-border/50 rounded-xl px-6 data-[state=open]:border-gold/40"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-gold py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
