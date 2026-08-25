"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Users, Info } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface MarketCardProps {
  price: number;
  priceHistory: number[];
  priceDirection: "up" | "down" | null;
}

export default function MarketCard({ price, priceHistory, priceDirection }: MarketCardProps) {
  // MOCK DATA - Countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 14, seconds: 45 });
  const [yesOdds, setYesOdds] = useState(58);
  const [volume, setVolume] = useState(384120);
  const [traders, setTraders] = useState(2450);

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset timer when it hits 0 (simulate new round starting)
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update Yes/No probabilities and volume on price tick
  useEffect(() => {
    if (priceDirection) {
      // Simulate minor odds fluctuation based on price direction
      setYesOdds((prev) => {
        const change = priceDirection === "up" ? 1 : -1;
        const newOdds = prev + change;
        return Math.max(15, Math.min(85, newOdds));
      });

      // Increment volume slightly to simulate live trading action
      setVolume((prev) => prev + Math.floor(Math.random() * 150 + 20));
      
      // Occasionally add a trader
      if (Math.random() > 0.6) {
        setTraders((prev) => prev + 1);
      }
    }
  }, [price, priceDirection]);

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 160;
  const padding = 10;

  // Generate SVG path for sparkline
  const getSvgPath = () => {
    if (priceHistory.length < 2) return "";
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const range = max - min || 1;

    return priceHistory
      .map((val, index) => {
        const x = padding + (index * (chartWidth - padding * 2)) / (priceHistory.length - 1);
        const y =
          chartHeight -
          padding -
          ((val - min) / range) * (chartHeight - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Generate SVG fill path for gradient background
  const getSvgFillPath = () => {
    const linePath = getSvgPath();
    if (!linePath) return "";
    return `${linePath} L ${chartWidth - padding} ${chartHeight} L ${padding} ${chartHeight} Z`;
  };

  // Confetti celebration handlers
  const handleVoteYes = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#00D964", "#00b252", "#ffffff"],
    });
  };

  const handleVoteNo = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#FF3B30", "#d32f2f", "#ffffff"],
    });
  };

  // Determine chart trend color
  const isTrendingUp =
    priceHistory.length > 1 &&
    priceHistory[priceHistory.length - 1] >= priceHistory[0];

  const strokeColor = isTrendingUp ? "#00D964" : "#FF3B30";
  const fillColorId = isTrendingUp ? "greenGradient" : "redGradient";

  return (
    <section id="markets" className="py-20 md:py-24 max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark mb-4">
            Active Prediction Market
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Take a position on Bitcoin&apos;s short-term price movement with high-odds instant resolution.
          </p>
        </div>

        {/* The Card */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-subtle overflow-hidden hover:shadow-md transition-shadow duration-300">
          {/* Header */}
          <div className="p-6 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Daily Price Target
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-brand-dark mt-1">
                BTC will be above $64,300.00
              </h3>
            </div>
            
            {/* Timer */}
            <div className="flex items-center gap-2 bg-gray-50 border border-brand-border px-4 py-2 rounded-full w-fit">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold tabular-nums text-gray-700">
                {String(timeLeft.hours).padStart(2, "0")}h :{" "}
                {String(timeLeft.minutes).padStart(2, "0")}m :{" "}
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>

          {/* Chart Display */}
          <div className="relative p-6 bg-gradient-to-b from-white to-gray-50/50">
            {/* Legend / Hovering price */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">Live Trend</span>
                {isTrendingUp ? (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" /> Upward
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3.5 h-3.5" /> Downward
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-400">Past 60s performance</span>
            </div>

            {/* Sparkline SVG */}
            <div className="w-full overflow-hidden h-[160px] flex items-center justify-center">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D964" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00D964" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                {priceHistory.length > 0 && (
                  <path
                    d={getSvgFillPath()}
                    fill={`url(#${fillColorId})`}
                    className="transition-all duration-300 ease-in-out"
                  />
                )}

                {/* Line Path */}
                {priceHistory.length > 0 && (
                  <motion.path
                    d={getSvgPath()}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 ease-in-out"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-6 border-t border-brand-border bg-white flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              {/* YES BUTTON */}
              <motion.button
                onClick={handleVoteYes}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group py-4 px-6 rounded-2xl bg-brand-green hover:bg-[#00c95c] text-white flex flex-col items-center justify-center gap-0.5 shadow-sm transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  Buy YES
                </span>
                <span className="text-2xl font-black">{yesOdds}¢</span>
                <span className="text-[10px] opacity-75">Wins if BTC &gt; $64,300</span>
              </motion.button>

              {/* NO BUTTON */}
              <motion.button
                onClick={handleVoteNo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group py-4 px-6 rounded-2xl bg-brand-red hover:bg-[#eb3329] text-white flex flex-col items-center justify-center gap-0.5 shadow-sm transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  Buy NO
                </span>
                <span className="text-2xl font-black">{100 - yesOdds}¢</span>
                <span className="text-[10px] opacity-75">Wins if BTC &le; $64,300</span>
              </motion.button>
            </div>

            {/* Footer Metadata */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4 gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>
                  Volume: <strong className="text-gray-700 font-semibold">${volume.toLocaleString()}</strong>
                </span>
                <span className="mx-1.5 text-gray-300">·</span>
                <span>
                  Traders: <strong className="text-gray-700 font-semibold">{traders.toLocaleString()}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1 cursor-help group/info relative">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="underline decoration-dotted">Resolution Rules</span>
                
                {/* Popover */}
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed hidden group-hover/info:block z-10 shadow-lg">
                  Settles based on Binance BTCUSDT spot index price at the target resolution time. Fully automated payout.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
