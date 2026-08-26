"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarketCard from "@/components/MarketCard";
import StatsStrip from "@/components/StatsStrip";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Database aggregates
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalTraders, setTotalTraders] = useState<number>(0);
  const [resolvedMarkets, setResolvedMarkets] = useState<number>(0);

  useEffect(() => {
    let active = true;

    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        if (!res.ok) throw new Error("Binance API error");
        const data = (await res.json()) as { price: string };
        const currentPrice = parseFloat(data.price);
        
        if (!active) return;

        setPrice((prev) => {
          if (prev !== null) {
            setPriceDirection(currentPrice >= prev ? "up" : "down");
          }
          return currentPrice;
        });

        setError(false);
        setLoading(false);

        setPriceHistory((prevHistory) => {
          if (prevHistory.length === 0) {
            // Initialize history with 30 slightly fluctuated points leading up to the current price
            const history: number[] = [];
            let tempPrice = currentPrice - 150; // start slightly lower
            for (let i = 0; i < 30; i++) {
              tempPrice += (Math.random() * 20 - 10) + 5; // upward drift
              history.push(tempPrice);
            }
            // Ensure last item is exactly currentPrice
            history[history.length - 1] = currentPrice;
            return history;
          } else {
            const nextHistory = [...prevHistory, currentPrice];
            if (nextHistory.length > 30) {
              nextHistory.shift();
            }
            return nextHistory;
          }
        });
      } catch (err) {
        if (!active) return;
        console.error("Failed to fetch live BTC price:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchPrice(); // initial fetch
    const interval = setInterval(fetchPrice, 5000); // fetch every 5s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch total volume (sum of all bets amount)
        const { data: betsData } = await supabase
          .from("bets")
          .select("amount");
        const volSum = betsData ? betsData.reduce((sum, b) => sum + Number(b.amount), 0) : 0;
        setTotalVolume(volSum);

        // 2. Fetch total registered users count
        const { count: tradersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        setTotalTraders(tradersCount || 0);

        // 3. Fetch resolved bets count
        const { count: resolvedCount } = await supabase
          .from("bets")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved");
        setResolvedMarkets(resolvedCount || 0);
      } catch (err) {
        console.error("Failed to fetch landing database stats:", err);
      }
    };

    fetchLandingStats();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0A0A0A] overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[30%] left-[-200px] w-[600px] h-[600px] rounded-full bg-brand-green/3 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[60%] right-[-200px] w-[600px] h-[600px] rounded-full bg-brand-red/3 blur-[120px] pointer-events-none -z-10" />

      {/* Landing Page Layout */}
      <Navbar />
      <main>
        <Hero price={price} priceDirection={priceDirection} loading={loading} error={error} />
        <MarketCard 
          price={price} 
          priceHistory={priceHistory} 
          priceDirection={priceDirection} 
          loading={loading} 
          totalVolume={totalVolume}
          totalTraders={totalTraders}
        />
        <StatsStrip 
          totalVolume={totalVolume}
          activeTraders={totalTraders}
          resolvedMarkets={resolvedMarkets}
        />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
