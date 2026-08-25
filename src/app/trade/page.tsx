"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, ChevronDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";

// Dynamic import of the Price Path Chart to prevent SSR errors
const ProbabilityChart = dynamic(() => import("@/components/ProbabilityChart"), { ssr: false });

import { useBinancePrice } from "@/hooks/useBinance";

interface ActivePosition {
  id: string;
  marketQuestion: string;
  side: "YES" | "NO";
  shares: number;
  avgPrice: number; // in cents (e.g. 42)
  invested: number; // in dollars
  windowEnd: number;
}

interface ResolvedTrade {
  id: string;
  marketQuestion: string;
  side: "YES" | "NO";
  amount: number;
  avgPrice: number; // in cents
  result: "WIN" | "LOSS";
  payout: number;
  timestamp: number;
}


interface ChartPoint {
  time: number;
  value: number;
}

export default function TradePage() {
  // 1. LIVE DATA - Custom Binance Hook
  const { price: btcPrice, priceDirection } = useBinancePrice();

  // 2. TIMEFRAME & DYNAMIC 5-MIN WINDOW STATE
  const [timeWindow, setTimeWindow] = useState<{ start: number; end: number; timeLeft: number }>({
    start: 0,
    end: 0,
    timeLeft: 300,
  });
  const [referencePrice, setReferencePrice] = useState<number>(0);
  const [demoBalance, setDemoBalance] = useState<number>(1000.00);

  // 3. PROBABILITY / PRICE ENGINE
  const [probabilityYes, setProbabilityYes] = useState<number>(50);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [selectedPill, setSelectedPill] = useState<string>("5m");

  // 4. ORDER / BUY PANEL STATE
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO">("YES");
  const [positions, setPositions] = useState<ActivePosition[]>([]);
  const [resolvedTrades, setResolvedTrades] = useState<ResolvedTrade[]>([
    {
      id: "h1",
      marketQuestion: "Will Bitcoin resolve above $64,250.00 at 7:05 PM?",
      side: "YES",
      amount: 5,
      avgPrice: 42,
      result: "WIN",
      payout: 11.90,
      timestamp: Date.now() - 360000,
    },
  ]);

  // Collapsible sections
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [isFAQOpen, setIsFAQOpen] = useState<boolean>(true);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const prevBtcPriceRef = useRef<number>(0);

  // Settle previous 5-min market positions
  const settleCurrentMarket = useCallback((marketEnd: number) => {
    setPositions((prev) => {
      const active: ActivePosition[] = [];

      prev.forEach((pos) => {
        if (pos.windowEnd <= marketEnd) {
          // YES wins if btcPrice is higher than referencePrice
          const yesWon = btcPrice > referencePrice;
          const userWon = (pos.side === "YES" && yesWon) || (pos.side === "NO" && !yesWon);
          const payout = userWon ? pos.shares : 0;

          if (userWon) {
            setDemoBalance((bal) => bal + payout);
            showToast(`🎉 WIN! Resolved ${pos.side} share payout: $${payout.toFixed(2)}`);
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#2F80ED", "#ffffff"],
            });
          } else {
            showToast(`❌ LOSS! Contract resolved against your prediction.`);
          }

          setResolvedTrades((hist) => [
            {
              id: pos.id,
              marketQuestion: pos.marketQuestion,
              side: pos.side,
              amount: pos.invested,
              avgPrice: pos.avgPrice,
              result: userWon ? "WIN" : "LOSS",
              payout,
              timestamp: Date.now(),
            },
            ...hist,
          ]);
        } else {
          active.push(pos);
        }
      });
      return active;
    });

    // Clear chartPoints for new cycle and seed with current spot
    setChartPoints([{ time: Math.floor(Date.now() / 1000), value: btcPrice }]);
  }, [btcPrice, referencePrice, showToast]);

  // Dynamic 5-minute window computation
  useEffect(() => {
    const calculateWindow = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const duration = 300; // 5 mins
      const start = Math.floor(nowSec / duration) * duration;
      const end = start + duration;
      const timeLeft = end - nowSec;

      setTimeWindow((prev) => {
        // If window rolls over, trigger settlement of previous positions
        if (prev.end !== 0 && end > prev.end) {
          settleCurrentMarket(prev.end);
        }
        return { start, end, timeLeft };
      });
    };

    calculateWindow();
    const interval = setInterval(calculateWindow, 1000);
    return () => clearInterval(interval);
  }, [settleCurrentMarket]);

  // Lock Reference Price at start of 5-min slot
  useEffect(() => {
    if (btcPrice > 0 && referencePrice === 0) {
      setReferencePrice(btcPrice);
      prevBtcPriceRef.current = btcPrice;
      // Seed initial chart point
      setChartPoints([{ time: Math.floor(Date.now() / 1000), value: btcPrice }]);
    }

    // When the window changes, reset reference price to lock the new boundary
    if (timeWindow.timeLeft === 300 && btcPrice > 0) {
      setReferencePrice(btcPrice);
    }
  }, [timeWindow.start, btcPrice, referencePrice, timeWindow.timeLeft]);

  // 5. PRICE TRACKING & PROBABILITY CALCULATION (Sigmoid path for Yes price)
  useEffect(() => {
    if (btcPrice === 0 || referencePrice === 0) return;

    const delta = btcPrice - referencePrice;
    // Scale sensitivity as time decays
    const timeFactor = Math.max(1, 300 / Math.max(10, timeWindow.timeLeft));
    const scaledDelta = delta * 0.04 * timeFactor;
    
    // Sigmoid math: 1 / (1 + exp(-x))
    const calculated = 1 / (1 + Math.exp(-scaledDelta));
    const percent = Math.max(2, Math.min(98, Math.round(calculated * 100)));

    setProbabilityYes(percent);

    // Save actual BTC spot prices to chartPoints
    const nowSec = Math.floor(Date.now() / 1000);
    setChartPoints((pts) => {
      // Limit frequency to avoid duplicating timestamps in lightweight-charts
      if (pts.length > 0 && pts[pts.length - 1].time === nowSec) {
        return [...pts.slice(0, -1), { time: nowSec, value: btcPrice }];
      }
      return [...pts, { time: nowSec, value: btcPrice }].slice(-60);
    });
  }, [btcPrice, referencePrice, timeWindow.timeLeft]);

  // Helper date formatting
  const formatTime = (timeSecs: number) => {
    if (timeSecs === 0) return "7:00 PM";
    const date = new Date(timeSecs * 1000);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = String(minutes).padStart(2, "0");
    return `${hours}:${minStr}${ampm}`;
  };

  const getTimerDisplay = () => {
    const m = Math.floor(timeWindow.timeLeft / 60);
    const s = timeWindow.timeLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Get current date string (e.g. Aug 25th)
  const getMarketDateStr = () => {
    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    
    // Day ordinal
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${month} ${day}${suffix}`;
  };

  // One-tap Buy execution handler
  const handleOneTapBuy = (amount: number) => {
    if (amount > demoBalance) {
      showToast("⚠️ Insufficient balance.");
      return;
    }

    // Deduct Balance
    setDemoBalance((bal) => bal - amount);

    const pricePerShare = selectedSide === "YES" ? probabilityYes : 100 - probabilityYes;
    const pricePerShareDec = pricePerShare / 100;
    const sharesCount = amount / pricePerShareDec;

    const question = `Will Bitcoin resolve above $${referencePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} at ${formatTime(timeWindow.end)}?`;

    const newPos: ActivePosition = {
      id: Math.random().toString(),
      marketQuestion: question,
      side: selectedSide,
      shares: sharesCount,
      avgPrice: pricePerShare,
      invested: amount,
      windowEnd: timeWindow.end,
    };

    setPositions((prev) => [newPos, ...prev]);
    showToast(`📈 Bought ${Math.round(sharesCount)} shares of ${selectedSide} @ ${pricePerShare}¢`);
    
    // Confetti
    confetti({
      particleCount: 50,
      angle: selectedSide === "YES" ? 60 : 120,
      spread: 40,
      origin: { y: 0.85 },
      colors: selectedSide === "YES" ? ["#2F80ED"] : ["#FF3B57"],
    });
  };

  // Cents price for UP/DOWN buttons
  const yesPrice = probabilityYes;
  const noPrice = 100 - probabilityYes;
  const pricePerShare = selectedSide === "YES" ? yesPrice : noPrice;

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans pb-[340px] md:pb-16 antialiased select-none">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full bg-brand-dark text-white text-sm font-semibold shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-brand-green" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-brand-border py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
              Prediction Market
            </span>
          </div>

          {/* Balance Tracker */}
          <div className="flex items-center gap-2 bg-brand-dark text-white px-3.5 py-1.5 rounded-full shadow-sm">
            <Wallet className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold tabular-nums">
              ${demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-brand-green bg-brand-green/10 px-1.5 py-0.2 rounded-full font-bold uppercase">
              USDC
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* 2. HEADER BLOCK (Replicating top section of screenshot) */}
        <div className="flex flex-col gap-1 border-b border-brand-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* BTC Badge with "15m" overlay */}
              <div className="relative w-10 h-10 rounded-full bg-[#f2a900] flex items-center justify-center font-bold text-white text-lg shadow-xs select-none">
                ₿
                <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-black text-white px-1 py-0.2 rounded-md scale-90 border border-white/20 uppercase">
                  5m
                </span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-brand-dark flex items-center gap-1.5 leading-none">
                  BTC Up or Down 5m
                  <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                </h1>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span>Total Vol</span>
                  <span className="font-bold text-brand-dark">$838.82</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button className="p-2 border border-brand-border hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" aria-label="Favorite option">
                <svg className="w-4 h-4 text-gray-400 fill-none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.828l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.888a1 1 0 00-1.176 0l-3.97 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.777-.576-.38-1.828.582-1.828h4.908a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </button>
              <button className="p-2 border border-brand-border hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" aria-label="Share options">
                <svg className="w-4 h-4 text-gray-400 fill-none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="text-xs font-bold text-gray-400 mt-2">
            {getMarketDateStr()}, {formatTime(timeWindow.start)} - {formatTime(timeWindow.end)}
          </div>
        </div>

        {/* 3. PRICE & COUNTDOWN STRIP (Replicating second row of screenshot) */}
        <div className="grid grid-cols-3 items-center border-b border-brand-border pb-4">
          {/* Price to Beat */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price to Beat</div>
            <div className="text-base font-extrabold text-brand-dark tabular-nums mt-0.5">
              ${referencePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Current Price */}
          <div className="text-center flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Price</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-base font-extrabold tabular-nums transition-colors duration-300 ${
                priceDirection === "up" ? "text-[#00C853]" : "text-[#FF3B57]"
              }`}>
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-extrabold flex items-center ${
                priceDirection === "up" ? "text-[#00C853]" : "text-[#FF3B57]"
              }`}>
                {priceDirection === "up" ? "▲" : "▼"} 0.12%
              </span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="text-right">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex justify-end gap-3.5 pr-1">
              <span>Min</span>
              <span>Sec</span>
            </div>
            <div className={`text-xl font-black mt-0.5 tabular-nums ${
              timeWindow.timeLeft <= 10 ? "text-[#FF3B57] animate-pulse" : "text-brand-dark"
            }`}>
              {getTimerDisplay().replace(":", " ")}
            </div>
          </div>
        </div>

        {/* 4. PRICE CHART CARD */}
        <div className="relative">
          {/* Floating executed trades indicators on the left margin */}
          <div className="absolute left-2 top-8 z-10 flex flex-col gap-2 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EAFBF0] text-[#00C853] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#CFF8DD] shadow-xs">
              + $50
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-[#FFEBEF] text-[#FF3B57] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#FFD2DA] shadow-xs">
              + $5
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="bg-[#EAFBF0] text-[#00C853] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#CFF8DD] shadow-xs">
              + $100
            </motion.div>
          </div>

          {/* Actual Price path chart */}
          <ProbabilityChart data={chartPoints} loading={false} error={null} side={selectedSide} referencePrice={referencePrice} />
        </div>

        {/* 5. INTERVAL TIME PILLS (Replicating capsules row below chart) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 border-b border-brand-border">
          {/* Pill 1 */}
          <button
            onClick={() => setSelectedPill("5m")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
              selectedPill === "5m"
                ? "bg-[#ECECFF] text-[#6C5CE7] border border-[#D5D0FF]"
                : "border border-brand-border text-gray-500 hover:text-brand-dark hover:bg-gray-50"
            }`}
          >
            {selectedPill === "5m" && <span>✓</span>}
            {formatTime(timeWindow.start)}
          </button>
          
          {/* Pill 2 */}
          <button
            onClick={() => setSelectedPill("15m")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              selectedPill === "15m"
                ? "bg-[#ECECFF] text-[#6C5CE7] border border-[#D5D0FF]"
                : "border border-brand-border text-gray-500 hover:text-brand-dark hover:bg-gray-50"
            }`}
          >
            {selectedPill === "15m" && <span>✓</span>}
            {formatTime(timeWindow.start + 900)}
          </button>

          {/* Pill 3 */}
          <button
            onClick={() => setSelectedPill("30m")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
              selectedPill === "30m"
                ? "bg-[#ECECFF] text-[#6C5CE7] border border-[#D5D0FF]"
                : "border border-brand-border text-gray-500 hover:text-brand-dark hover:bg-gray-50"
            }`}
          >
            {selectedPill === "30m" && <span>✓</span>}
            {formatTime(timeWindow.start + 1800)}
          </button>

          {/* Pill 4 */}
          <button
            onClick={() => setSelectedPill("1h")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
              selectedPill === "1h"
                ? "bg-[#ECECFF] text-[#6C5CE7] border border-[#D5D0FF]"
                : "border border-brand-border text-gray-500 hover:text-brand-dark hover:bg-gray-50"
            }`}
          >
            {selectedPill === "1h" && <span>✓</span>}
            {formatTime(timeWindow.start + 3600)}
          </button>

          <button className="px-3 py-1.5 rounded-full text-xs font-bold border border-brand-border text-gray-500 flex items-center gap-1 cursor-pointer">
            More ▾
          </button>

          {/* Icons right */}
          <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-brand-border">
            <button className="p-1.5 border border-brand-border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer" aria-label="Token options">
              ₿
            </button>
            <button className="p-1.5 border border-brand-border rounded-lg text-xs hover:bg-gray-50 cursor-pointer" aria-label="Toggle visual path">
              📈
            </button>
          </div>
        </div>

        {/* 6. LP REWARDS BOX (Replicating gold-tint card) */}
        <div className="bg-[#FFFDF4] border border-[#F1E0B3] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[#D09A0A] uppercase tracking-wider">Current LP Rewards</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[#D09A0A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D09A0A]"></span>
              </span>
              <span className="text-[10px] font-semibold text-gray-500">Live</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-[#D09A0A] flex items-center justify-end gap-1 leading-none">
              750 <span className="bg-[#D09A0A] text-white text-[8px] font-black px-1 py-0.2 rounded-sm uppercase tracking-tighter scale-95">pp</span>
            </div>
            <span className="text-[9px] font-bold text-[#D09A0A]/70">to be earned</span>
          </div>
        </div>

        {/* 7. UP/DOWN CENTS BUTTONS (Replicating the YES/NO buy panel of screenshot) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-border p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-2xl md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:border md:rounded-xl md:p-5 md:shadow-none flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSide("YES")}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold tracking-wider cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                selectedSide === "YES"
                  ? "bg-[#2F80ED] border-transparent text-white shadow-lg shadow-[#2F80ED]/15"
                  : "bg-transparent border-brand-border text-[#2F80ED] hover:bg-[#2F80ED]/5"
              }`}
            >
              UP {yesPrice}¢
            </button>

            <button
              onClick={() => setSelectedSide("NO")}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold tracking-wider cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                selectedSide === "NO"
                  ? "bg-[#FFF3F5] border-[#FFD0D6] text-[#FF3B57] shadow-lg shadow-[#FF3B57]/5"
                  : "bg-transparent border-brand-border text-[#FF3B57] hover:bg-[#FF3B57]/5"
              }`}
            >
              DOWN {noPrice}¢
            </button>

            {/* Three dot menu */}
            <button className="p-3 border border-brand-border rounded-xl text-gray-500 hover:bg-gray-50 cursor-pointer" aria-label="More actions">
              •••
            </button>
          </div>

          {/* 8. ONE-TAP BUY AMOUNT CARDS (Replicating three quick buy boxes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">One-tap Buy</span>
              <button className="text-[10px] font-bold text-gray-400 hover:text-brand-dark flex items-center gap-0.5 cursor-pointer">
                ✏️ Edit
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Card 1: $5 */}
              <button
                onClick={() => handleOneTapBuy(5)}
                className="bg-white hover:bg-gray-50 border border-brand-border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              >
                <span className="text-base font-extrabold text-brand-dark">$5</span>
                <span className="text-[10px] text-gray-400 font-semibold leading-none">
                  Win <span className="text-[#00C853] font-bold">${(5 / (pricePerShare / 100)).toFixed(2)}</span>
                </span>
              </button>

              {/* Card 2: $25 */}
              <button
                onClick={() => handleOneTapBuy(25)}
                className="bg-white hover:bg-gray-50 border border-brand-border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              >
                <span className="text-base font-extrabold text-brand-dark">$25</span>
                <span className="text-[10px] text-gray-400 font-semibold leading-none">
                  Win <span className="text-[#00C853] font-bold">${(25 / (pricePerShare / 100)).toFixed(2)}</span>
                </span>
              </button>

              {/* Card 3: $100 */}
              <button
                onClick={() => handleOneTapBuy(100)}
                className="bg-white hover:bg-gray-50 border border-brand-border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              >
                <span className="text-base font-extrabold text-brand-dark">$100</span>
                <span className="text-[10px] text-gray-400 font-semibold leading-none">
                  Win <span className="text-[#00C853] font-bold">${(100 / (pricePerShare / 100)).toFixed(2)}</span>
                </span>
              </button>
            </div>

            {/* Error state */}
            {demoBalance < 5 && (
              <div className="text-[10px] text-[#FF3B57] font-semibold mt-2.5">
                Insufficient Funds
              </div>
            )}

            {/* Balance strip */}
            <div className="flex justify-between text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-brand-border">
              <span>Balance</span>
              <span className="text-brand-dark tabular-nums">${demoBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* YOUR ACTIVE POSITIONS LIST */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm mt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Positions</h3>
          {positions.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400 font-medium">
              You have no positions in this market
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {positions.map((pos) => {
                const currentSharePrice = pos.side === "YES" ? probabilityYes : 100 - probabilityYes;
                const currentValue = pos.shares * (currentSharePrice / 100);
                const pnl = currentValue - pos.invested;
                const pnlPercent = (pnl / pos.invested) * 100;

                return (
                  <div key={pos.id} className="bg-gray-50 border border-brand-border rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase ${
                        pos.side === "YES" ? "bg-[#2F80ED]/10 text-[#2F80ED]" : "bg-[#FF3B57]/10 text-[#FF3B57]"
                      }`}>
                        {pos.side}
                      </span>
                      <span className="text-gray-400 font-semibold">Ends: {formatTime(pos.windowEnd)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-[10px] text-gray-400 mt-1">
                      <div>
                        <div>Shares</div>
                        <div className="text-brand-dark font-bold tabular-nums">{Math.round(pos.shares)}</div>
                      </div>
                      <div>
                        <div>Avg Cost</div>
                        <div className="text-brand-dark font-bold tabular-nums">{pos.avgPrice}¢</div>
                      </div>
                      <div>
                        <div>Current Value</div>
                        <div className="text-brand-dark font-bold tabular-nums">${currentValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div>Unrealized P&L</div>
                        <div className={`font-black tabular-nums ${pnl >= 0 ? "text-[#00C853]" : "text-[#FF3B57]"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RESOLVED TRADE HISTORY TABLE */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm mt-4">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-400 hover:text-brand-dark border-b border-brand-border focus:outline-none cursor-pointer"
          >
            <span>Resolved Markets History</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHistoryOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence initial={false}>
            {isHistoryOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-4">Expiry</th>
                        <th className="pb-3 px-4">Position</th>
                        <th className="pb-3 px-4">Cost Share</th>
                        <th className="pb-3 px-4">Result</th>
                        <th className="pb-3 pl-4 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pr-4 text-gray-500 font-medium">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-4 px-4 font-semibold">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              trade.side === "YES" ? "bg-[#2F80ED]/10 text-[#2F80ED]" : "bg-[#FF3B57]/10 text-[#FF3B57]"
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-500 font-medium">{trade.avgPrice}¢</td>
                          <td className="py-4 px-4">
                            <span className={`font-bold ${trade.result === "WIN" ? "text-[#00C853]" : "text-[#FF3B57]"}`}>
                              {trade.result}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right font-bold text-brand-dark tabular-nums">
                            ${trade.payout.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RULES ACCORDION */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm mt-4">
          <button
            onClick={() => setIsFAQOpen(!isFAQOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-400 hover:text-brand-dark border-b border-brand-border focus:outline-none cursor-pointer"
          >
            <span>Trading Rules & Info</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFAQOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence initial={false}>
            {isFAQOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 flex flex-col">
                  {/* Rule 1 */}
                  <div className="border-b border-brand-border py-4 first:pt-0">
                    <button
                      onClick={() => setFaqOpenIndex(faqOpenIndex === 0 ? null : 0)}
                      className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark py-1 cursor-pointer focus:outline-none"
                    >
                      <span>How is this market resolved?</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${faqOpenIndex === 0 ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {faqOpenIndex === 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden text-xs text-gray-500 pt-2.5 leading-relaxed"
                        >
                          Contracts settle based on the official Binance BTCUSDT spot ticker price. The market locks a reference price at the start of the 5-minute interval. If the final price when the timer reaches 0 is higher than the reference price, YES resolves to $1.00 and NO to $0.00.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Rule 2 */}
                  <div className="py-4 last:pb-0">
                    <button
                      onClick={() => setFaqOpenIndex(faqOpenIndex === 1 ? null : 1)}
                      className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark py-1 cursor-pointer focus:outline-none"
                    >
                      <span>What is the data source?</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${faqOpenIndex === 1 ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {faqOpenIndex === 1 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden text-xs text-gray-500 pt-2.5 leading-relaxed"
                        >
                          This demo connects directly to Binance&apos;s live WebSocket data feed. Prices represent the spot value of BTCUSDT in US Dollars.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
