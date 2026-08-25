"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Clock, ChevronDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";

// Dynamic import of Lightweight Chart to prevent SSR window reference errors
const TradeChart = dynamic(() => import("@/components/TradeChart"), { ssr: false });

import { useBinancePrice, useBinanceKlines, useBinance24h } from "@/hooks/useBinance";

interface ActivePosition {
  id: string;
  side: "UP" | "DOWN";
  amount: number;
  entryPrice: number;
  targetPrice: number;
  expiryTime: number; // UNIX timestamp in seconds
  timeLeft: number; // in seconds
}

interface ResolvedTrade {
  id: string;
  side: "UP" | "DOWN";
  amount: number;
  entryPrice: number;
  resolvePrice: number;
  result: "WIN" | "LOSS";
  payout: number;
  timestamp: number;
}

interface RecentTrade {
  id: string;
  user: string;
  amount: number;
  side: "UP" | "DOWN";
  timeAgo: string;
}

export default function TradePage() {
  // 1. LIVE DATA - Custom Binance Hooks
  const { price: btcPrice, priceDirection } = useBinancePrice();
  const [timeframe, setTimeframe] = useState<string>("1m");
  const { candles, loading: chartLoading, error: chartError } = useBinanceKlines(timeframe, 60);
  const ticker24h = useBinance24h();

  // 2. STATE MANAGEMENT
  const [demoBalance, setDemoBalance] = useState<number>(1000.00);
  const [selectedExpiry, setSelectedExpiry] = useState<string>("5 Min");
  const [selectedSide, setSelectedSide] = useState<"UP" | "DOWN" | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [positions, setPositions] = useState<ActivePosition[]>([]);
  const [resolvedTrades, setResolvedTrades] = useState<ResolvedTrade[]>([
    // MOCK DATA - Initial history
    {
      id: "1",
      side: "UP",
      amount: 50,
      entryPrice: 64180.50,
      resolvePrice: 64210.00,
      result: "WIN",
      payout: 91.00,
      timestamp: Date.now() - 120000,
    },
    {
      id: "2",
      side: "DOWN",
      amount: 100,
      entryPrice: 64250.00,
      resolvePrice: 64265.20,
      result: "LOSS",
      payout: 0.00,
      timestamp: Date.now() - 300000,
    },
  ]);

  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([
    { id: "r1", user: "Trade***82", amount: 50, side: "UP", timeAgo: "1s ago" },
    { id: "r2", user: "Crypt***14", amount: 150, side: "DOWN", timeAgo: "4s ago" },
    { id: "r3", user: "SatsM***90", amount: 200, side: "UP", timeAgo: "7s ago" },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Timeframes available
  const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1h", value: "1h" },
  ];

  // Expiry Targets configuration
  const expiries = [
    { label: "5 Min", duration: 300 },
    { label: "15 Min", duration: 900 },
    { label: "1 Hour", duration: 3600 },
    { label: "Today", duration: 18000 },
  ];

  // 3. EFFECT - Live countdown ticking for Active Positions & Auto Resolution
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => {
        const updated: ActivePosition[] = [];
        prev.forEach((pos) => {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = Math.max(0, pos.expiryTime - now);

          if (timeLeft === 0) {
            // RESOLVE BET: Compare live price with entry/target price
            const isWinning =
              pos.side === "UP"
                ? btcPrice > pos.entryPrice
                : btcPrice < pos.entryPrice;

            const payout = isWinning ? pos.amount * 1.85 : 0;
            if (isWinning) {
              setDemoBalance((bal) => bal + payout);
              showToast(`🎉 WIN! Resolution payout: $${payout.toFixed(2)}`);
              confetti({
                particleCount: 60,
                spread: 50,
                origin: { y: 0.8 },
                colors: ["#00D964", "#ffffff"],
              });
            } else {
              showToast(`❌ LOSS! Contract resolved below strike.`);
            }

            // Save to history
            setResolvedTrades((prevHist) => [
              {
                id: pos.id,
                side: pos.side,
                amount: pos.amount,
                entryPrice: pos.entryPrice,
                resolvePrice: btcPrice,
                result: isWinning ? "WIN" : "LOSS",
                payout,
                timestamp: Date.now(),
              },
              ...prevHist,
            ]);
          } else {
            updated.push({ ...pos, timeLeft });
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [btcPrice]);

  // 4. EFFECT - Stream/Simulate recent trades feed (every 4 seconds)
  useEffect(() => {
    const users = ["Jack***", "BTC_***", "Satoshi***", "Whale***", "DeFi***", "Option***"];
    const interval = setInterval(() => {
      const newUser = users[Math.floor(Math.random() * users.length)] + Math.floor(Math.random() * 99);
      const newAmount = [10, 25, 50, 100, 250, 500][Math.floor(Math.random() * 6)];
      const newSide = Math.random() > 0.4 ? "UP" : "DOWN";
      
      const newTrade: RecentTrade = {
        id: Math.random().toString(),
        user: newUser,
        amount: newAmount,
        side: newSide as "UP" | "DOWN",
        timeAgo: "Just now",
      };

      setRecentTrades((prev) => [
        newTrade,
        ...prev.map((t) => {
          if (t.timeAgo === "Just now") return { ...t, timeAgo: "3s ago" };
          if (t.timeAgo.includes("3s")) return { ...t, timeAgo: "7s ago" };
          return { ...t, timeAgo: "15s ago" };
        }),
      ].slice(0, 5));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Resolve Expiry countdown timer value
  const getExpiryCountdown = (label: string) => {
    const now = Math.floor(Date.now() / 1000);
    let cycle = 300;
    if (label === "15 Min") cycle = 900;
    if (label === "1 Hour") cycle = 3600;
    if (label === "Today") cycle = 86400;

    const remaining = cycle - (now % cycle);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Place Trade Action Handler
  const handlePlaceTrade = () => {
    if (!selectedSide || !betAmount) return;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("⚠️ Enter a valid amount.");
      return;
    }
    if (amount > demoBalance) {
      showToast("⚠️ Insufficient balance.");
      return;
    }

    // Deduct Balance
    setDemoBalance((bal) => bal - amount);

    const now = Math.floor(Date.now() / 1000);
    let duration = 300;
    if (selectedExpiry === "15 Min") duration = 900;
    if (selectedExpiry === "1 Hour") duration = 3600;
    if (selectedExpiry === "Today") duration = 18000;

    const expiryTime = now + duration;

    const newPos: ActivePosition = {
      id: Math.random().toString(),
      side: selectedSide,
      amount,
      entryPrice: btcPrice,
      targetPrice: btcPrice,
      expiryTime,
      timeLeft: duration,
    };

    setPositions((prev) => [newPos, ...prev]);
    showToast(`📈 Trade placed: $${amount} on ${selectedSide}`);
    
    // Confetti on placement
    confetti({
      particleCount: 40,
      angle: selectedSide === "UP" ? 60 : 120,
      spread: 40,
      origin: { y: 0.85 },
      colors: selectedSide === "UP" ? ["#00D964"] : ["#FF3B30"],
    });

    // Reset Betting inputs
    setBetAmount("");
    setSelectedSide(null);
  };

  // Calculate live P&L for ongoing trade
  const calculateLivePnL = (pos: ActivePosition) => {
    const isWinning =
      pos.side === "UP" ? btcPrice > pos.entryPrice : btcPrice < pos.entryPrice;
    return isWinning ? pos.amount * 0.85 : -pos.amount;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans pb-[340px] md:pb-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-brand-green" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-brand-border py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              Predict<span className="text-brand-green">BTC</span>
            </span>
          </div>

          {/* Live Price Display */}
          <div className="flex items-center gap-3 bg-gray-50 border border-brand-border px-4 py-1.5 rounded-full">
            <span className="text-xs font-bold text-gray-400 tracking-wider">BTC/USDT</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={btcPrice}
                initial={{ opacity: 0.9, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-base sm:text-lg font-bold tabular-nums transition-colors duration-300 ${
                  priceDirection === "up"
                    ? "text-brand-green"
                    : priceDirection === "down"
                    ? "text-brand-red"
                    : "text-brand-dark"
                }`}
              >
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.span>
            </AnimatePresence>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ticker24h.priceChangePercent >= 0
                  ? "text-brand-green bg-brand-green/10"
                  : "text-brand-red bg-brand-red/10"
              }`}
            >
              {ticker24h.priceChangePercent >= 0 ? "+" : ""}
              {ticker24h.priceChangePercent.toFixed(2)}%
            </span>
          </div>

          {/* Balance Tracker */}
          <div className="flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-full shadow-sm">
            <Wallet className="w-4 h-4 text-brand-green" />
            <span className="text-sm font-semibold tabular-nums">
              ${demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-brand-green bg-brand-green/10 px-1.5 py-0.2 rounded-full font-bold uppercase hidden sm:inline">
              Demo
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Chart and stats */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* CHART CARD */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-brand-dark">Live Market Graph</h2>
                <p className="text-xs text-gray-500 mt-0.5">Real-time candlesticks from Binance</p>
              </div>

              {/* Timeframe Selectors */}
              <div className="flex items-center bg-gray-50 border border-brand-border p-1 rounded-full w-fit">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                      timeframe === tf.value
                        ? "bg-brand-dark text-white shadow-sm"
                        : "text-gray-500 hover:text-brand-dark"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Candlestick TradingView Chart */}
            <TradeChart candles={candles} loading={chartLoading} error={chartError} />
          </div>

          {/* MARKET STATS BAR */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">24h Market Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-400">24h High</div>
                <div className="text-lg font-bold text-brand-dark mt-1 tabular-nums">
                  ${ticker24h.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">24h Low</div>
                <div className="text-lg font-bold text-brand-dark mt-1 tabular-nums">
                  ${ticker24h.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">24h Volume</div>
                <div className="text-lg font-bold text-brand-dark mt-1 tabular-nums">
                  {ticker24h.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} BTC
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">Open Interest (Demo)</div>
                <div className="text-lg font-bold text-brand-green mt-1">
                  $4.2M
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE TRADES LIST */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Your Active Positions</h2>
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <Clock className="w-8 h-8 text-gray-300" />
                <div>
                  <div className="text-sm font-semibold text-gray-600">No active trades yet</div>
                  <div className="text-xs text-gray-400 mt-0.5">Select UP or DOWN to place a prediction.</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {positions.map((pos) => {
                  const livePnL = calculateLivePnL(pos);
                  return (
                    <div
                      key={pos.id}
                      className="border border-brand-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            pos.side === "UP" ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"
                          }`}
                        >
                          {pos.side}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-brand-dark">
                            BTC target ${pos.entryPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Amount: ${pos.amount.toFixed(2)} · Entry: ${pos.entryPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                        {/* Expiry Countdown */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold bg-white border border-brand-border px-3 py-1 rounded-full">
                          <Clock className={`w-3.5 h-3.5 ${pos.timeLeft <= 10 ? "text-brand-red animate-pulse" : ""}`} />
                          <span className={`${pos.timeLeft <= 10 ? "text-brand-red font-bold" : ""}`}>
                            {pos.timeLeft}s
                          </span>
                        </div>

                        {/* Live P&L */}
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-400">Live P&L</div>
                          <span className={`text-sm font-black tabular-nums ${livePnL >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                            {livePnL >= 0 ? "+" : ""}
                            ${livePnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Betting Panel & scrolling feed */}
        <div className="flex flex-col gap-8 pb-20 md:pb-0">
          
          {/* BETTING PANEL - Sticky at bottom on mobile, relative card on desktop */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-border p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-2xl md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:border md:rounded-2xl md:p-6 md:shadow-premium md:bg-white md:border-brand-border">
            <h2 className="text-base sm:text-lg font-bold text-brand-dark mb-4 hidden md:block">Prediction Betting Panel</h2>
            
            {/* Expiry select bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 md:pb-4 mb-4 md:mb-6 overflow-x-auto scrollbar-none">
              {expiries.map((exp) => (
                <button
                  key={exp.label}
                  onClick={() => setSelectedExpiry(exp.label)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedExpiry === exp.label
                      ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                      : "bg-gray-50 border border-brand-border text-gray-500 hover:text-brand-dark"
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>

            {/* Locked target and countdown */}
            <div className="flex items-center justify-between border border-brand-border rounded-xl p-3 md:p-4 bg-gray-50/50 mb-4 md:mb-6">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Price</span>
                <div className="text-sm sm:text-lg font-bold text-brand-dark tabular-nums mt-0.5">${btcPrice.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Closes In</span>
                <div className="text-sm sm:text-lg font-bold text-brand-dark tabular-nums mt-0.5 flex items-center gap-1.5 justify-end">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {getExpiryCountdown(selectedExpiry)}
                </div>
              </div>
            </div>

            {/* UP/DOWN CARDS */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* UP CARD */}
              <motion.button
                onClick={() => setSelectedSide(selectedSide === "UP" ? null : "UP")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 md:p-4 rounded-xl flex flex-col items-center justify-center gap-1 md:gap-2 border cursor-pointer transition-all duration-200 ${
                  selectedSide === "UP"
                    ? "bg-brand-green text-white border-transparent shadow-lg shadow-brand-green/20"
                    : "bg-white border-brand-border text-brand-green hover:bg-brand-green/5"
                }`}
              >
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs sm:text-sm font-bold">UP / YES</span>
                <span className="text-[10px] md:text-xs opacity-75">Payout: 1.85x</span>
              </motion.button>

              {/* DOWN CARD */}
              <motion.button
                onClick={() => setSelectedSide(selectedSide === "DOWN" ? null : "DOWN")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 md:p-4 rounded-xl flex flex-col items-center justify-center gap-1 md:gap-2 border cursor-pointer transition-all duration-200 ${
                  selectedSide === "DOWN"
                    ? "bg-brand-red text-white border-transparent shadow-lg shadow-brand-red/20"
                    : "bg-white border-brand-border text-brand-red hover:bg-brand-red/5"
                }`}
              >
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs sm:text-sm font-bold">DOWN / NO</span>
                <span className="text-[10px] md:text-xs opacity-75">Payout: 1.85x</span>
              </motion.button>
            </div>

            {/* Amount input block with animation */}
            <AnimatePresence>
              {selectedSide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-4 md:mb-6"
                >
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                    Bet Amount
                  </label>
                  <div className="relative mb-2.5">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full py-2.5 px-3 border border-brand-border rounded-xl bg-gray-50 focus:outline-none focus:border-brand-dark focus:bg-white text-sm sm:text-base font-bold tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      USD
                    </span>
                  </div>

                  {/* Quick select chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBetAmount(String(amt))}
                        className="px-2.5 py-1 border border-brand-border hover:border-brand-dark rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setBetAmount(String(demoBalance))}
                      className="px-2.5 py-1 border border-brand-border hover:border-brand-dark rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Max
                    </button>
                  </div>

                  {/* Potential payout readout */}
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 bg-gray-50 border border-brand-border rounded-lg p-2.5">
                    <span>Payout (1.85x):</span>
                    <span className="text-brand-green text-xs sm:text-sm">
                      $
                      {betAmount
                        ? (parseFloat(betAmount) * 1.85).toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : "0.00"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action button */}
            <motion.button
              onClick={handlePlaceTrade}
              disabled={!selectedSide || !betAmount}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 md:py-4 rounded-full text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base ${
                selectedSide && betAmount
                  ? "bg-brand-dark hover:bg-black/90 active:scale-95"
                  : "bg-gray-200 cursor-not-allowed text-gray-400 shadow-none"
              }`}
            >
              Confirm Prediction
            </motion.button>
          </div>

          {/* RECENT TRADES FEED */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm hidden md:block">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Trader Ticks</h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[220px]">
              <AnimatePresence>
                {recentTrades.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-dark">{t.user}</span>
                      <span className="text-gray-400">placed</span>
                      <span className={`font-bold ${t.side === "UP" ? "text-brand-green" : "text-brand-red"}`}>
                        ${t.amount} {t.side}
                      </span>
                    </div>
                    <span className="text-gray-400 tabular-nums">{t.timeAgo}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* RESOLVED MARKETS HISTORY TABLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-brand-dark mb-4">Resolved Markets History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Expiry Time</th>
                  <th className="pb-3 px-4">Prediction</th>
                  <th className="pb-3 px-4">Invested</th>
                  <th className="pb-3 px-4">Strike Price</th>
                  <th className="pb-3 px-4">Settle Price</th>
                  <th className="pb-3 px-4">Outcome</th>
                  <th className="pb-3 pl-4 text-right">Payout</th>
                </tr>
              </thead>
              <tbody>
                {resolvedTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pr-4 text-gray-500 font-medium">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-brand-dark">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        trade.side === "UP" ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"
                      }`}>
                        {trade.side === "UP" ? "UP / YES" : "DOWN / NO"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">${trade.amount.toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">${trade.entryPrice.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">${trade.resolvePrice.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${trade.result === "WIN" ? "text-brand-green" : "text-brand-red"}`}>
                        {trade.result}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-gray-700 tabular-nums">
                      ${trade.payout.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* RULES ACCORDION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark mb-4">Trading Rules & Information</h2>
          
          <div className="flex flex-col">
            {/* Rule 1 */}
            <div className="border-b border-brand-border py-4">
              <button
                onClick={() => setOpenFAQIndex(openFAQIndex === 0 ? null : 0)}
                className="w-full flex items-center justify-between text-left font-semibold text-brand-dark py-2 cursor-pointer focus:outline-none"
              >
                <span>How are markets resolved?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFAQIndex === 0 ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFAQIndex === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-xs text-gray-500 pt-2 leading-relaxed"
                  >
                    Contracts settle based on the official Binance BTCUSDT spot index price at the exact millisecond the expiry timer hits zero. If the index is higher than the strike price, YES resolves to $1.00 and NO to $0.00.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rule 2 */}
            <div className="border-b border-brand-border py-4">
              <button
                onClick={() => setOpenFAQIndex(openFAQIndex === 1 ? null : 1)}
                className="w-full flex items-center justify-between text-left font-semibold text-brand-dark py-2 cursor-pointer focus:outline-none"
              >
                <span>What happens in case of a tie?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFAQIndex === 1 ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFAQIndex === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-xs text-gray-500 pt-2 leading-relaxed"
                  >
                    If the settling price matches the entry strike price exactly down to the last decimal point, the round resolves as a tie, and the initial bet amount is returned to the user balance with zero fee deductions.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rule 3 */}
            <div className="py-4">
              <button
                onClick={() => setOpenFAQIndex(openFAQIndex === 2 ? null : 2)}
                className="w-full flex items-center justify-between text-left font-semibold text-brand-dark py-2 cursor-pointer focus:outline-none"
              >
                <span>Are there fees?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFAQIndex === 2 ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFAQIndex === 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-xs text-gray-500 pt-2 leading-relaxed"
                  >
                    PredictBTC Demo uses simulated stablecoins. Trading is free, but winning resolutions calculate a simulated 1% fee on net profits which is automatically factored into the 1.85x payout multiplier.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
