"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  faqs: FAQItem[];
  id?: string;
}

function FAQAccordion({ question, answer }: FAQItem) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left hover:text-[var(--primary)] transition-colors"
      >
        <span className="font-medium text-lg pr-4">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-500 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection({ title, faqs, id }: FAQSectionProps) {
  return (
    <section id={id} className="py-16 bg-[var(--background)] scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-heading text-center">{title}</h2>
          <div className="glass-card rounded-xl p-6 mt-8">
            {faqs.map((faq, index) => (
              <FAQAccordion key={index} {...faq} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Student FAQs
export const studentFAQs: FAQItem[] = [
  {
    question: "How do I get started with ShuttleMentor?",
    answer: "Simply sign up for a free account, complete your profile with your skill level and goals, then browse our coaches to find the perfect match. You can book sessions directly through their profiles or upload videos for analysis."
  },
  {
    question: "What types of coaching are available?",
    answer: "We offer two main types: Live video coaching sessions where you work with a coach in real-time, and asynchronous video analysis where you upload your gameplay footage and receive detailed feedback within 24 hours."
  },
  {
    question: "How much does coaching cost?",
    answer: "Coaching rates vary by coach and service type. Live sessions typically range from $30-60 per hour, while video analysis starts at around $20-30 per video. Each coach sets their own rates based on their experience and expertise."
  },
  {
    question: "Can I switch coaches if I'm not satisfied?",
    answer: "Absolutely! You're free to work with multiple coaches or switch at any time. We encourage you to find the coach whose teaching style best matches your learning preferences."
  }
];

