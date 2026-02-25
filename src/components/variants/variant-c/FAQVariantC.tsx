import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What exactly is a pet personality report?",
    a: "It's a beautifully designed 15+ page document that combines your pet's unique traits, astrological profile, and emotional patterns into a deeply personal keepsake. Think of it as a love letter to your best friend — written with real insight into who they truly are.",
  },
  {
    q: "How accurate is it?",
    a: "Our reports are created using a combination of behavioral science, astrological principles, and the personal details you share about your pet. Pet parents consistently tell us the accuracy is 'scary good' — many say it captures things they've never been able to put into words.",
  },
  {
    q: "Do I need to know my pet's exact birth date?",
    a: "An exact date is ideal, but an approximate date works great too. Even if you're not 100% sure, we can create a meaningful and accurate report based on what you know.",
  },
  {
    q: "How long does it take to get my report?",
    a: "Your report is generated instantly after you complete the short questionnaire. You'll receive it as a downloadable PDF that you can save, print, or share right away.",
  },
  {
    q: "Can I get a report for any type of pet?",
    a: "Yes! We support dogs, cats, rabbits, birds, hamsters, guinea pigs, fish, reptiles, and horses. Each report is tailored to your pet's specific species.",
  },
  {
    q: "Is this a good gift?",
    a: "Absolutely — it's one of our most popular gift options. You can purchase a gift certificate that lets the recipient create their own personalized report. Many customers tell us it's the most unique and meaningful gift they've ever given.",
  },
  {
    q: "What if I'm not satisfied?",
    a: "We offer a 100% money-back guarantee, no questions asked. If you're not delighted with your report, just reach out to us and we'll issue a full refund.",
  },
];

export const FAQVariantC = () => {
  return (
    <section id="faq" className="relative py-16 px-4 z-10">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
