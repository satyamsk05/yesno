"use client";

import { ArrowRight, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface HeroProps {
  price: number | null;
  priceDirection: "up" | "down" | null;
  loading: boolean;
  error: boolean;
}

export default function Hero({ price, priceDirection, loading, error }: HeroProps) {

  // Format currency
  const formatPrice = (value: number | null) => {
    if (value === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Background radial gradient to give a premium SaaS feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 opacity-70">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute top-[10%] right-[20%] w-[600px] h-[600px] rounded-full bg-brand-red/5 blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center w-full">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 shadow-sm text-xs font-semibold text-emerald-800 mb-6 select-none"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live BTC/USD Price Feed
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-brand-dark max-w-3xl leading-[1.1] mb-6 text-balance"
          >
            Will Bitcoin go up today?
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed mb-10 text-balance"
          >
            Trade Yes or No on BTC price direction. Real-time odds, instant settlement, and no complicated setup.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto"
          >
            <Link href="/markets" passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-dark text-white font-semibold flex items-center justify-center gap-2 hover:bg-black/95 transition-all duration-200 shadow-md group cursor-pointer"
              >
                Trade Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </Link>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-brand-border text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-brand-dark transition-all duration-200 cursor-pointer"
            >
              <Play className="w-4 h-4 text-gray-400 fill-gray-400" />
              How it works
            </motion.a>
          </motion.div>

          {/* Live Animated Price Ticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-1.5 px-8 py-4 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 w-full max-w-sm sm:w-auto sm:min-w-[280px]"
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {error ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                  </>
                )}
              </span>
              <span>Live BTC Price</span>
              {error && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  reconnecting
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-[40px] w-40 animate-pulse rounded-lg mt-1" style={{ backgroundColor: "#F3F3F3" }} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={price ?? "loading"}
                  initial={{ y: priceDirection === "up" ? 4 : -4, opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`text-3xl md:text-4xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
                    priceDirection === "up"
                      ? "text-brand-green"
                      : priceDirection === "down"
                      ? "text-brand-red"
                      : "text-brand-dark"
                  }`}
                >
                  {formatPrice(price)}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
