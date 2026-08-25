"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Sliders, Zap } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Pick a side",
      description: "Analyze the trend and buy YES if you think the target will be exceeded, or NO if you think it won't.",
      icon: MousePointerClick,
      color: "text-brand-green bg-brand-green/10",
    },
    {
      step: "02",
      title: "Set your amount",
      description: "Choose how many contracts you want to buy. Trade with pennies or large amounts—it's entirely up to you.",
      icon: Sliders,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      step: "03",
      title: "Instant payout",
      description: "When the market countdown expires, resolutions settle automatically and payouts land in your wallet.",
      icon: Zap,
      color: "text-brand-red bg-brand-red/10",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-brand-border text-xs font-semibold text-gray-500 mb-4"
        >
          How it works
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark"
        >
          Trade in 3 simple steps
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.06)" }}
              className="bg-white rounded-2xl border border-brand-border p-8 relative flex flex-col items-start shadow-sm transition-all duration-300 group"
            >
              {/* Step indicator */}
              <span className="absolute top-6 right-8 text-sm font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                {step.step}
              </span>

              {/* Icon Container */}
              <div className={`p-3 rounded-xl mb-6 flex items-center justify-center ${step.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Heading */}
              <h3 className="text-xl font-bold text-brand-dark mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
