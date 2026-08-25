"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Clock, ChevronDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";

// Dynamic import of the Probability Chart to prevent SSR errors
const ProbabilityChart = dynamic(() => import("@/components/ProbabilityChart"), { ssr: false });

import { useBinancePrice } from "@/hooks/useBinance";

interface ActivePosition {
  id: string;
  marketQuestion: string;
  side: "YES" | "NO";
  shares: number;
  avgPrice: number; // in cents (e.g. 62)
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

interface RecentTrade {
  id: string;
  address: string;
  amount: number;
  side: "YES" | "NO";
  price: number; // in cents
  timeAgo: string;
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

  // 3. PROBABILITY ENGINE
  const [probabilityYes, setProbabilityYes] = useState<number>(50);
  const prevProbabilityRef = useRef<number>(50);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<string>("1H");

  // 4. ORDER / BUY PANEL STATE
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO">("YES");
  const [investAmount, setInvestAmount] = useState<string>("");
  const [positions, setPositions] = useState<ActivePosition[]>([]);
  const [resolvedTrades, setResolvedTrades] = useState<ResolvedTrade[]>([
    {
      id: "h1",
      marketQuestion: "Will Bitcoin resolve above $64,250.00 at 7:05 PM?",
      side: "YES",
      amount: 100,
      avgPrice: 58,
      result: "WIN",
      payout: 172.41,
      timestamp: Date.now() - 360000,
    },
    {
      id: "h2",
      marketQuestion: "Will Bitcoin resolve above $64,285.00 at 7:00 PM?",
      side: "NO",
      amount: 50,
      avgPrice: 42,
      result: "LOSS",
      payout: 0,
      timestamp: Date.now() - 720000,
    },
  ]);

  // Collapsible sections
  const [isOrderBookOpen, setIsOrderBookOpen] = useState<boolean>(true);
  const [isActivityOpen, setIsActivityOpen] = useState<boolean>(true);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Recent activity ticker
  const [activityFeed, setActivityFeed] = useState<RecentTrade[]>([
    { id: "a1", address: "0x7a3f...92b1", amount: 150, side: "YES", price: 62, timeAgo: "2s ago" },
    { id: "a2", address: "0x09db...c814", amount: 80, side: "NO", price: 38, timeAgo: "5s ago" },
    { id: "a3", address: "0xf8e1...402a", amount: 300, side: "YES", price: 61, timeAgo: "9s ago" },
  ]);

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
              colors: ["#00C853", "#ffffff"],
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

    // Clear chartPoints for new cycle and seed with 50%
    setChartPoints([{ time: Math.floor(Date.now() / 1000), value: 50 }]);
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
      setChartPoints([{ time: Math.floor(Date.now() / 1000), value: 50 }]);
    }

    // When the window changes, reset reference price to lock the new boundary
    if (timeWindow.timeLeft === 300 && btcPrice > 0) {
      setReferencePrice(btcPrice);
    }
  }, [timeWindow.start, btcPrice, referencePrice, timeWindow.timeLeft]);

  // 5. SYNTHETIC PROBABILITY LOGIC (Sigmoid curve based on live Binance delta)
  useEffect(() => {
    if (btcPrice === 0 || referencePrice === 0) return;

    const delta = btcPrice - referencePrice;
    // Scale sensitivity as time decays
    const timeFactor = Math.max(1, 300 / Math.max(10, timeWindow.timeLeft));
    const scaledDelta = delta * 0.04 * timeFactor;
    
    // Sigmoid math: 1 / (1 + exp(-x))
    const calculated = 1 / (1 + Math.exp(-scaledDelta));
    const percent = Math.max(2, Math.min(98, Math.round(calculated * 100)));

    prevProbabilityRef.current = probabilityYes;
    setProbabilityYes(percent);

    // Save history chart points
    const nowSec = Math.floor(Date.now() / 1000);
    setChartPoints((pts) => {
      // Limit frequency to avoid duplicating timestamps in lightweight-charts
      if (pts.length > 0 && pts[pts.length - 1].time === nowSec) {
        // Update last tick value
        return [...pts.slice(0, -1), { time: nowSec, value: percent }];
      }
      return [...pts, { time: nowSec, value: percent }].slice(-60);
    });
  }, [btcPrice, referencePrice, timeWindow.timeLeft, probabilityYes]);

  // 6. EFFECT - Scrolling Activity Ticker (Every 5 seconds)
  useEffect(() => {
    const addresses = ["0x7b2f...81c2", "0x89e0...b401", "0x12fa...e930", "0x00bc...d871", "0xf93e...a282"];
    const interval = setInterval(() => {
      const randomAddr = addresses[Math.floor(Math.random() * addresses.length)];
      const randomAmt = [20, 50, 100, 250, 600][Math.floor(Math.random() * 5)];
      const randomSide = Math.random() > 0.45 ? "YES" : "NO";
      const price = randomSide === "YES" ? probabilityYes : 100 - probabilityYes;

      const newItem: RecentTrade = {
        id: Math.random().toString(),
        address: randomAddr,
        amount: randomAmt,
        side: randomSide as "YES" | "NO",
        price,
        timeAgo: "Just now",
      };

      setActivityFeed((prev) => [
        newItem,
        ...prev.map((item) => {
          if (item.timeAgo === "Just now") return { ...item, timeAgo: "4s ago" };
          if (item.timeAgo.includes("4s")) return { ...item, timeAgo: "8s ago" };
          return { ...item, timeAgo: "12s ago" };
        }),
      ].slice(0, 5));
    }, 5000);

    return () => clearInterval(interval);
  }, [probabilityYes]);

  // Helper date formatting
  const formatTime = (timeSecs: number) => {
    if (timeSecs === 0) return "0:00 PM";
    const date = new Date(timeSecs * 1000);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = String(minutes).padStart(2, "0");
    return `${hours}:${minStr} ${ampm}`;
  };

  const getTimerDisplay = () => {
    const m = Math.floor(timeWindow.timeLeft / 60);
    const s = timeWindow.timeLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Order Book Dynamic prices
  const getYESBids = () => [
    { price: probabilityYes - 1, size: "14.2k" },
    { price: probabilityYes - 2, size: "29.1k" },
    { price: probabilityYes - 3, size: "48.5k" },
  ];
  const getYESAsks = () => [
    { price: probabilityYes, size: "1.2k" },
    { price: probabilityYes + 1, size: "8.5k" },
    { price: probabilityYes + 2, size: "15.0k" },
  ];
  const getNOBids = () => [
    { price: 100 - probabilityYes - 1, size: "8.1k" },
    { price: 100 - probabilityYes - 2, size: "19.3k" },
    { price: 100 - probabilityYes - 3, size: "32.0k" },
  ];
  const getNOAsks = () => [
    { price: 100 - probabilityYes, size: "4.5k" },
    { price: 100 - probabilityYes + 1, size: "11.2k" },
    { price: 100 - probabilityYes + 2, size: "22.1k" },
  ];

  // Math variables for Order calculations
  const pricePerShare = selectedSide === "YES" ? probabilityYes : 100 - probabilityYes;
  const pricePerShareDec = pricePerShare / 100;
  const parsedAmt = parseFloat(investAmount);
  const sharesCount = isNaN(parsedAmt) || parsedAmt <= 0 ? 0 : parsedAmt / pricePerShareDec;
  const potentialPayout = sharesCount;
  const potentialProfit = Math.max(0, potentialPayout - parsedAmt);
  const profitPercent = parsedAmt > 0 ? (potentialProfit / parsedAmt) * 100 : 0;

  // Buy Execution Handler
  const handleBuy = () => {
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast("⚠️ Enter a valid amount.");
      return;
    }
    if (parsedAmt > demoBalance) {
      showToast("⚠️ Insufficient balance.");
      return;
    }

    // Deduct Demo Balance
    setDemoBalance((bal) => bal - parsedAmt);

    const question = `Will Bitcoin resolve above $${referencePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} at ${formatTime(timeWindow.end)}?`;

    const newPos: ActivePosition = {
      id: Math.random().toString(),
      marketQuestion: question,
      side: selectedSide,
      shares: sharesCount,
      avgPrice: pricePerShare,
      invested: parsedAmt,
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
      colors: selectedSide === "YES" ? ["#00C853"] : ["#FF3B57"],
    });

    setInvestAmount("");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans pb-[340px] md:pb-16 antialiased select-none">
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
              <ArrowLeft className="w-4.5 h-4.5 text-gray-600" />
            </Link>
            <nav className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:flex items-center gap-1.5">
              <span className="hover:text-brand-dark transition-colors">Crypto</span>
              <span className="text-gray-300">&gt;</span>
              <span className="hover:text-brand-dark transition-colors">Bitcoin</span>
              <span className="text-gray-300">&gt;</span>
              <span className="text-brand-dark">Up or Down</span>
            </nav>
          </div>

          {/* Binance Spot Reference */}
          <div className="flex items-center gap-2 bg-white border border-brand-border px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">BTC Price:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={btcPrice}
                initial={{ opacity: 0.8, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-xs font-bold tabular-nums transition-colors duration-300 ${
                  priceDirection === "up"
                    ? "text-[#00C853]"
                    : priceDirection === "down"
                    ? "text-[#FF3B57]"
                    : "text-brand-dark"
                }`}
              >
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Wallet Balance (USDC Demo) */}
          <div className="flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-full shadow-sm">
            <Wallet className="w-4 h-4 text-brand-green" />
            <span className="text-sm font-semibold tabular-nums">
              ${demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-brand-green bg-brand-green/10 px-1.5 py-0.2 rounded-full font-extrabold uppercase">
              USDC
            </span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Header, Chart, Book */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 2. MARKET HEADER */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C853] bg-[#00C853]/10 px-2.5 py-1 rounded-full w-fit">
                  Bitcoin Market
                </span>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-brand-dark mt-1.5 leading-snug">
                  Will Bitcoin resolve above ${referencePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} at {formatTime(timeWindow.end)}?
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Implied Probability</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold tracking-tight text-[#00C853] tabular-nums">
                    {probabilityYes}%
                  </span>
                  <span className={`text-xs font-bold flex items-center ${probabilityYes >= prevProbabilityRef.current ? "text-[#00C853]" : "text-[#FF3B57]"}`}>
                    {probabilityYes >= prevProbabilityRef.current ? "▲" : "▼"} {Math.abs(probabilityYes - prevProbabilityRef.current)}%
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">chance of YES resolution</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market Countdown</span>
                <div className="text-2xl font-bold text-brand-dark mt-1 tabular-nums flex items-center gap-1.5">
                  <Clock className={`w-5 h-5 ${timeWindow.timeLeft <= 10 ? "text-[#FF3B57] animate-pulse" : "text-gray-400"}`} />
                  <span className={timeWindow.timeLeft <= 10 ? "text-[#FF3B57] font-extrabold" : ""}>
                    {getTimerDisplay()}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">resolves automatically at 0:00</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market Volume</span>
                <div className="text-2xl font-bold text-brand-dark mt-1 tabular-nums">
                  $184,291
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">demo liquidity traded</div>
              </div>
            </div>
          </div>

          {/* 3. PROBABILITY CHART */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-brand-dark">Implied YES Probability</h3>
                <p className="text-[10px] text-gray-400">Live probability index derived from spot price delta</p>
              </div>

              {/* Timeframe Selectors */}
              <div className="flex bg-gray-50 border border-brand-border p-0.5 rounded-lg">
                {["1H", "6H", "1D", "ALL"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      chartTimeframe === tf
                        ? "bg-white text-brand-dark shadow-xs border border-brand-border/40"
                        : "text-gray-500 hover:text-brand-dark"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Probability Area Chart */}
            <ProbabilityChart data={chartPoints} loading={false} error={null} side={selectedSide} />
          </div>

          {/* 5. ORDER BOOK */}
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsOrderBookOpen(!isOrderBookOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark border-b border-brand-border focus:outline-none cursor-pointer"
            >
              <span>Order Book Depth (USDC Shares)</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOrderBookOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {isOrderBookOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brand-border">
                    {/* YES side */}
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-[#00C853] mb-3 uppercase tracking-wider">YES Shares Book</div>
                      <div className="flex flex-col gap-2">
                        {/* Asks (Sells) - reverse order */}
                        {getYESAsks().slice().reverse().map((ask, idx) => (
                          <div key={`ya-${idx}`} className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                            <span className="text-[#FF3B57] font-semibold tabular-nums">{ask.price}¢</span>
                            <span className="text-gray-500 tabular-nums">{ask.size}</span>
                          </div>
                        ))}
                        {/* Bid/Ask Spread */}
                        <div className="h-[1px] bg-gray-200 my-1" />
                        {/* Bids (Buys) */}
                        {getYESBids().map((bid, idx) => (
                          <div key={`yb-${idx}`} className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                            <span className="text-[#00C853] font-semibold tabular-nums">{bid.price}¢</span>
                            <span className="text-gray-500 tabular-nums">{bid.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NO side */}
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-[#FF3B57] mb-3 uppercase tracking-wider">NO Shares Book</div>
                      <div className="flex flex-col gap-2">
                        {/* Asks (Sells) */}
                        {getNOAsks().slice().reverse().map((ask, idx) => (
                          <div key={`na-${idx}`} className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                            <span className="text-[#FF3B57] font-semibold tabular-nums">{ask.price}¢</span>
                            <span className="text-gray-500 tabular-nums">{ask.size}</span>
                          </div>
                        ))}
                        {/* Bid/Ask Spread */}
                        <div className="h-[1px] bg-gray-200 my-1" />
                        {/* Bids (Buys) */}
                        {getNOBids().map((bid, idx) => (
                          <div key={`nb-${idx}`} className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                            <span className="text-[#00C853] font-semibold tabular-nums">{bid.price}¢</span>
                            <span className="text-gray-500 tabular-nums">{bid.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: Buy Panel, Positions, Ticker */}
        <div className="flex flex-col gap-8 pb-20 md:pb-0">
          
          {/* 4. ORDER / BUY PANEL */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-border p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-2xl md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:border md:rounded-2xl md:p-5 md:shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 hidden md:block">Place Order</h3>

            {/* YES/NO buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedSide("YES")}
                className={`py-3 rounded-xl text-xs font-bold tracking-wider cursor-pointer border flex flex-col items-center gap-1 transition-all ${
                  selectedSide === "YES"
                    ? "bg-[#00C853] border-transparent text-white shadow-lg shadow-[#00C853]/15"
                    : "bg-transparent border-brand-border text-[#00C853] hover:bg-[#00C853]/5"
                }`}
              >
                <span>YES</span>
                <span className="text-[10px] opacity-80">{probabilityYes}¢</span>
              </button>

              <button
                onClick={() => setSelectedSide("NO")}
                className={`py-3 rounded-xl text-xs font-bold tracking-wider cursor-pointer border flex flex-col items-center gap-1 transition-all ${
                  selectedSide === "NO"
                    ? "bg-[#FF3B57] border-transparent text-white shadow-lg shadow-[#FF3B57]/15"
                    : "bg-transparent border-brand-border text-[#FF3B57] hover:bg-[#FF3B57]/5"
                }`}
              >
                <span>NO</span>
                <span className="text-[10px] opacity-80">{100 - probabilityYes}¢</span>
              </button>
            </div>

            {/* Input USD amount */}
            <div className="mb-4">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-brand-border rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-dark focus:bg-white text-sm font-bold text-brand-dark tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">USDC</span>
              </div>

              {/* Quick Select Chips */}
              <div className="flex gap-2 mt-2">
                {[1, 20, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setInvestAmount(String(amt))}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-brand-border rounded-md text-[10px] font-bold text-gray-500 transition-colors cursor-pointer"
                  >
                    ${amt}
                  </button>
                ))}
                <button
                  onClick={() => setDemoBalance(1000.00)} // Reset demo balance helper if user goes dry
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-brand-border rounded-md text-[10px] font-bold text-[#00C853] transition-colors cursor-pointer ml-auto"
                >
                  Refill
                </button>
              </div>
            </div>

            {/* Mathematical calculations readouts */}
            {sharesCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 border border-brand-border rounded-xl p-3.5 mb-4 text-xs flex flex-col gap-2.5"
              >
                <div className="flex justify-between text-gray-500">
                  <span>Price per Share:</span>
                  <span className="font-semibold text-brand-dark">{pricePerShare}¢</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shares to Buy:</span>
                  <span className="font-bold text-brand-dark tabular-nums">
                    {sharesCount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-[1px] bg-gray-200" />
                <div className="flex justify-between text-gray-500">
                  <span>Potential Payout:</span>
                  <span className="font-bold text-[#00C853] tabular-nums">
                    ${potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Potential Profit:</span>
                  <span className="font-semibold text-[#00C853] tabular-nums">
                    +${potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitPercent.toFixed(1)}%)
                  </span>
                </div>
              </motion.div>
            )}

            {/* Buy Order Submit */}
            <button
              onClick={handleBuy}
              disabled={!investAmount}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                investAmount
                  ? selectedSide === "YES"
                    ? "bg-[#00C853] hover:bg-[#00b24a] text-white"
                    : "bg-[#FF3B57] hover:bg-[#eb2c48] text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {investAmount ? `Buy ${selectedSide} for $${investAmount}` : `Enter Amount`}
            </button>
          </div>

          {/* 6. YOUR POSITIONS */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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
                          pos.side === "YES" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#FF3B57]/10 text-[#FF3B57]"
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
                          <div>Avg Price</div>
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

          {/* 7. ACTIVITY FEED */}
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-400 hover:text-brand-dark border-b border-brand-border focus:outline-none cursor-pointer"
            >
              <span>Live Ticker Feed</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isActivityOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {isActivityOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 flex flex-col gap-3 min-h-[220px]">
                    <AnimatePresence>
                      {activityFeed.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-2 last:border-b-0"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-700">{item.address}</span>
                            <span className="text-gray-400">bought</span>
                            <span className={`font-extrabold ${item.side === "YES" ? "text-[#00C853]" : "text-[#FF3B57]"}`}>
                              {item.amount} {item.side}
                            </span>
                            <span className="text-gray-400">@ {item.price}¢</span>
                          </div>
                          <span className="text-gray-400 tabular-nums">{item.timeAgo}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 8. RELATED MARKETS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Related Markets</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {/* Market 1 */}
          <div className="bg-white border border-brand-border rounded-2xl p-4 min-w-[280px] flex flex-col justify-between gap-4 shadow-sm hover:shadow-premium transition-all duration-300">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Crypto &gt; Ethereum</span>
              <h4 className="text-xs font-bold text-brand-dark mt-1.5">Will Ethereum resolve above $3,450.00 at {formatTime(timeWindow.end)}?</h4>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-100">
              <span className="text-gray-400">Probability</span>
              <span className="text-[#00C853] font-bold">54% YES</span>
            </div>
          </div>

          {/* Market 2 */}
          <div className="bg-white border border-brand-border rounded-2xl p-4 min-w-[280px] flex flex-col justify-between gap-4 shadow-sm hover:shadow-premium transition-all duration-300">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Crypto &gt; Solana</span>
              <h4 className="text-xs font-bold text-brand-dark mt-1.5">Will Solana resolve above $145.50 at {formatTime(timeWindow.end)}?</h4>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-100">
              <span className="text-gray-400">Probability</span>
              <span className="text-[#FF3B57] font-bold">42% YES</span>
            </div>
          </div>

          {/* Market 3 */}
          <div className="bg-white border border-brand-border rounded-2xl p-4 min-w-[280px] flex flex-col justify-between gap-4 shadow-sm hover:shadow-premium transition-all duration-300">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Crypto &gt; Bitcoin</span>
              <h4 className="text-xs font-bold text-brand-dark mt-1.5">Will Bitcoin resolve above $64,300.00 in next window?</h4>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-100">
              <span className="text-gray-400">Probability</span>
              <span className="text-[#00C853] font-bold">50% YES</span>
            </div>
          </div>
        </div>
      </section>

      {/* RESOLVED TRADE HISTORY TABLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm overflow-hidden">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resolved Markets History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Expiry Time</th>
                  <th className="pb-3 px-4">Market Question</th>
                  <th className="pb-3 px-4">Invested</th>
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
                    <td className="py-4 px-4 text-brand-dark font-medium max-w-sm truncate">
                      {trade.marketQuestion}
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">${trade.amount.toFixed(2)}</td>
                    <td className="py-4 px-4 font-semibold">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        trade.side === "YES" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#FF3B57]/10 text-[#FF3B57]"
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
        </div>
      </section>

      {/* 9. RULES ACCORDION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trading Rules & Information</h2>
          
          <div className="flex flex-col">
            {/* Rule 1 */}
            <div className="border-b border-brand-border py-4">
              <button
                onClick={() => setFaqOpenIndex(faqOpenIndex === 0 ? null : 0)}
                className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark py-1 cursor-pointer focus:outline-none"
              >
                <span>How is this market resolved?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${faqOpenIndex === 0 ? "rotate-180" : ""}`} />
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
            <div className="border-b border-brand-border py-4">
              <button
                onClick={() => setFaqOpenIndex(faqOpenIndex === 1 ? null : 1)}
                className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark py-1 cursor-pointer focus:outline-none"
              >
                <span>What happens if the price is exactly equal?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${faqOpenIndex === 1 ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpenIndex === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-xs text-gray-500 pt-2.5 leading-relaxed"
                  >
                    If the settling spot price is exactly equal to the locked reference price down to the cent, the contract resolves as a tie, and the invested dollars are fully refunded to the user balance.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rule 3 */}
            <div className="py-4">
              <button
                onClick={() => setFaqOpenIndex(faqOpenIndex === 2 ? null : 2)}
                className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-brand-dark py-1 cursor-pointer focus:outline-none"
              >
                <span>What is the data source?</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${faqOpenIndex === 2 ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpenIndex === 2 && (
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
        </div>
      </section>
    </div>
  );
}
