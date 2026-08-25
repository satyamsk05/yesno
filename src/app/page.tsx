"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarketCard from "@/components/MarketCard";
import StatsStrip from "@/components/StatsStrip";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  // MOCK DATA - Unified state for simulated live BTC price updates
  const [price, setPrice] = useState(64250.80);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    // Generate initial realistic price history points
    let current = 64250.80;
    const historyPoints: number[] = [];
    for (let i = 0; i < 30; i++) {
      current += Math.random() * 50 - 24; // Small fluctuations
      historyPoints.push(current);
    }
    setPriceHistory(historyPoints);
    setPrice(current);

    // Live update interval every 2 seconds
    const interval = setInterval(() => {
      const change = Math.random() * 44 - 20; // Simulated price change
      setPrice((prevPrice) => {
        const nextPrice = prevPrice + change;
        setPriceDirection(change >= 0 ? "up" : "down");
        
        // Append new price to history, keep length at 30 points
        setPriceHistory((prevHistory) => {
          const newHistory = [...prevHistory, nextPrice];
          if (newHistory.length > 30) {
            newHistory.shift();
          }
          return newHistory;
        });

        return nextPrice;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0A0A0A] overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[30%] left-[-200px] w-[600px] h-[600px] rounded-full bg-brand-green/3 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[60%] right-[-200px] w-[600px] h-[600px] rounded-full bg-brand-red/3 blur-[120px] pointer-events-none -z-10" />

      {/* Landing Page Layout */}
      <Navbar />
      <main>
        <Hero price={price} priceDirection={priceDirection} />
        <MarketCard price={price} priceHistory={priceHistory} priceDirection={priceDirection} />
        <StatsStrip />
        <HowItWorks />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
