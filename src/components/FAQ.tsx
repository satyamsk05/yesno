"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-brand-border py-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left font-semibold tracking-tight text-brand-dark text-base md:text-lg hover:text-black transition-colors py-4 focus:outline-none cursor-pointer"
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 p-1"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="text-gray-500 text-sm md:text-base leading-relaxed pt-2 pb-4 pr-6 text-balance">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is a binary prediction market?",
      answer:
        "A binary prediction market is a platform where the payout is a fixed amount or nothing depending on the outcome of a future event. In our case, you place predictions on whether Bitcoin's price will go UP or DOWN over specified timeframes (e.g. 1 minute, 5 minutes).",
    },
    {
      question: "How are the payouts calculated?",
      answer:
        "All winning predictions receive a fixed payout of 1.8x of their stake (representing an 80% net return). For example, if you place a ₹100 bet on UP and win, you will be credited with ₹180 in your wallet. If your prediction is wrong, the stake is lost.",
    },
    {
      question: "Where does the pricing and settlement index come from?",
      answer:
        "All predictions settle dynamically using real-time spot index feeds from the Binance public API (https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT). It is queried at the exact expiration timestamp of the round to guarantee absolute transparency.",
    },
    {
      question: "What are the platform fees?",
      answer:
        "Our platform fees are flat 0%. You keep 100% of your earnings to continue trading on future prediction markets.",
    },
    {
      question: "Do I need real money to start trading?",
      answer:
        "No, this platform acts as a prediction simulator. All registered users start with a free virtual INR balance of ₹10,000. You can simulate deposits and withdrawals on the deposit page to manage your play balance.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Header Block */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-brand-border text-xs font-semibold text-gray-500 mb-4"
          >
            FAQ
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight text-brand-dark mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-500 text-sm md:text-base leading-relaxed"
          >
            Can&apos;t find what you are looking for? Reach out to our support team or check our extensive documentation docs.
          </motion.p>
        </div>

        {/* Accordion Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="lg:col-span-2 flex flex-col"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
