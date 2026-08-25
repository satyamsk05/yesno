"use client";

import { useState, useEffect, useRef } from "react";
import { useInView, motion } from "framer-motion";

interface CountUpProps {
  target: number;
  duration?: number;
  format: (value: number) => string;
}

function CountUp({ target, duration = 1.8, format }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return <span ref={ref} className="tabular-nums">{format(count)}</span>;
}

export default function StatsStrip() {
  const stats = [
    {
      label: "Total Volume Traded",
      target: 2482910,
      format: (val: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(val) + "+",
    },
    {
      label: "Active Traders",
      target: 12450,
      format: (val: number) => val.toLocaleString() + "+",
    },
    {
      label: "Markets Resolved",
      target: 890,
      format: (val: number) => val.toLocaleString(),
    },
  ];

  return (
    <section className="bg-white border-y border-brand-border py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 text-center md:divide-x md:divide-gray-200">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center py-8 md:py-0 border-b border-gray-100 last:border-b-0 md:border-b-0 md:px-6"
            >
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-brand-dark mb-2">
                <CountUp target={stat.target} format={stat.format} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
