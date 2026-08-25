"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const companies = ["Binance", "Coinbase", "Kraken", "Bybit", "Uniswap", "OKX"];

  return (
    <section className="bg-white border-t border-b border-gray-200/70 py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Testimonial Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center relative max-w-3xl"
        >
          {/* Quote Icon */}
          <div className="w-12 h-12 bg-gray-50 border border-brand-border rounded-full flex items-center justify-center mb-8">
            <Quote className="w-5 h-5 text-gray-400 fill-gray-400" />
          </div>

          <blockquote className="text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-brand-dark leading-normal mb-8 text-balance">
            &quot;PredictBTC has completely redefined how I capture quick market movements. The payouts are instant, the UX is unmatched, and there are no complicated options terms to decipher.&quot;
          </blockquote>

          {/* User Details */}
          <div className="flex items-center gap-3">
            {/* Self-contained SVG Avatar */}
            <svg
              className="w-12 h-12 rounded-full border-2 border-brand-border shadow-sm"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D964" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="50" fill="url(#avatarGrad)" />
              <circle cx="50" cy="38" r="15" fill="white" />
              <path d="M 22 75 C 22 62, 78 62, 78 75" fill="white" />
            </svg>
            <div className="text-left">
              <div className="font-bold text-brand-dark text-sm">Alex Rivers</div>
              <div className="text-xs text-gray-500 font-medium">Independent DeFi Trader</div>
            </div>
          </div>
        </motion.div>

        {/* Brand Logo Cloud */}
        <div className="w-full mt-24 flex flex-col items-center border-t border-brand-border pt-12">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
            Trusted by traders from
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-center gap-x-12 gap-y-6 w-full max-w-sm md:max-w-none text-center">
            {companies.map((name, index) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 0.4, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ opacity: 0.8 }}
                className="text-lg font-black tracking-tight text-gray-500 cursor-default select-none transition-all duration-200"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
