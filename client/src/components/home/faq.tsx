import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    question: "How does the deposit system work?",
    answer: "When you borrow Baby Banz Earmuffs from any of our gemach locations, you'll be asked to provide a $20 deposit. This deposit is fully refundable when you return the earmuffs in good, clean condition. The deposit helps ensure the earmuffs are returned and also helps cover any potential damages."
  },
  {
    question: "How long can I borrow the earmuffs?",
    answer: "The standard borrowing period is 3-5 days, which is typically enough time for a simcha or event. If you need the earmuffs for a longer period, please discuss this with your local gemach operator. Extended borrowing may be possible depending on availability and demand."
  },
  {
    question: "Are the earmuffs sanitized between uses?",
    answer: "Yes, all gemach locations follow strict sanitization protocols. After each return, earmuffs are thoroughly cleaned with medical-grade disinfectant wipes, focusing on all surfaces including the ear cups, headband, and adjustment mechanisms. The cushions are carefully sanitized with a gentle antibacterial solution safe for infant skin. Each gemach location maintains a cleaning log to ensure every pair undergoes this full sanitization process before being made available again."
  },
  {
    question: "What if I have concerns about cleanliness?",
    answer: "In addition to our standard cleaning protocols, you can request to see the cleaning log for your specific pair of earmuffs. You're also welcome to clean them again before use if you prefer. We provide guidance on proper cleaning methods that won't damage the earmuffs while ensuring they're safe for your baby."
  },
  {
    question: "What ages are the earmuffs suitable for?",
    answer: "Baby Banz Earmuffs are designed for babies from newborn up to approximately 2 years old. They have an adjustable headband to accommodate growth. For older children, some gemach locations may offer different sizes, but availability varies by location."
  },
  {
    question: "How do I start a gemach in my community?",
    answer: "To start a Baby Banz Earmuffs Gemach in your community, fill out our application form on this website. We'll contact you to discuss the process, which includes purchasing an initial inventory of earmuffs, setting up a system for deposits and returns, establishing cleaning protocols, and adding your location to our directory."
  }
];

export function FAQ() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Find answers to common questions about the Baby Banz Earmuffs Gemach.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <AccordionTrigger className="px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors font-medium text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-neutral-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
