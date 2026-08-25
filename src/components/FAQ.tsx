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
        className="w-full flex items-center justify-between text-left font-semibold tracking-tight text-brand-dark text-base md:text-lg hover:text-black transition-colors py-2 focus:outline-none cursor-pointer"
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
        "A binary prediction market is a market where the payout is a fixed amount (usually $1.00) or nothing depending on the outcome of a future event. In our case, you trade on whether Bitcoin's price exceeds a certain price target by a specific target resolution time.",
    },
    {
      question: "How are the payouts calculated?",
      answer:
        "Each contract is priced between 1¢ and 99¢ based on current probability. If you buy a YES contract at 58¢ and it resolves successfully, your contract yields $1.00, yielding a 42¢ profit per contract. If the outcome is false, the contract resolves to 0¢.",
    },
    {
      question: "Where does the pricing and settlement index come from?",
      answer:
        "All markets settle based on the aggregated, volume-weighted average price (VWAP) index across major spot exchanges like Binance, Coinbase, and Kraken, recorded at the exact millisecond of resolution. This feed is publicly verifiable.",
    },
    {
      question: "What are the platform fees?",
      answer:
        "We charge a flat 1% fee on winning positions upon resolution. There are no fees for placing trades, cancelling orders, or holding contracts. Creating and listing custom markets remains free.",
    },
    {
      question: "Do I need a real Web3 wallet to trade here?",
      answer:
        "For this interactive UI showcase, you can play around with live simulated funds. No actual wallet connection or crypto is required. Production deployments will support major wallets like MetaMask, Coinbase Wallet, and WalletConnect.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 max-w-7xl mx-auto px-6">
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
