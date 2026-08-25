"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, X, CheckCircle, Wallet, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function MobileNav() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read balance from localStorage or use default mock to match the state
  const [walletBalance, setWalletBalance] = useState<number>(1000.00);

  // Copy wallet address helper
  const handleCopy = () => {
    navigator.clipboard.writeText("0x7b2f912c3e10fa8c81c2d871");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refill balance helper
  const handleRefill = () => {
    setWalletBalance(1000.00);
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_balance", "1000.00");
    }
    
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#6C5CE7", "#00C853"],
    });
  };

  const isHomeActive = pathname === "/";
  const isMarketActive = pathname === "/trade";

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION BAR (Light Theme - White Background) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border px-6 py-3.5 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] flex items-center justify-around md:hidden select-none">
        
        {/* Tab 1: Home */}
        <Link href="/">
          <button className="relative flex items-center gap-1.5 focus:outline-none transition-all cursor-pointer">
            {isHomeActive ? (
              <motion.div
                layoutId="active-mobile-tab"
                className="absolute inset-0 bg-[#6C5CE7] rounded-full -mx-4 -my-2 px-4 py-2"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
              isHomeActive ? "text-white" : "text-gray-400 hover:text-gray-600"
            }`}>
              <Home className="w-4.5 h-4.5" />
              {isHomeActive && <span>Home</span>}
            </span>
          </button>
        </Link>

        {/* Tab 2: Market */}
        <Link href="/trade">
          <button className="relative flex items-center gap-1.5 focus:outline-none transition-all cursor-pointer">
            {isMarketActive ? (
              <motion.div
                layoutId="active-mobile-tab"
                className="absolute inset-0 bg-[#6C5CE7] rounded-full -mx-4 -my-2 px-4 py-2"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
              isMarketActive ? "text-white" : "text-gray-400 hover:text-gray-600"
            }`}>
              <Compass className="w-4.5 h-4.5" />
              {isMarketActive && <span>Market</span>}
            </span>
          </button>
        </Link>

        {/* Tab 3: Profile */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className="relative flex items-center gap-1.5 focus:outline-none transition-all cursor-pointer"
        >
          {isProfileOpen ? (
            <motion.div
              layoutId="active-mobile-tab"
              className="absolute inset-0 bg-[#6C5CE7] rounded-full -mx-4 -my-2 px-4 py-2"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          ) : null}
          <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
            isProfileOpen ? "text-white" : "text-gray-400 hover:text-gray-600"
          }`}>
            <User className="w-4.5 h-4.5" />
            {isProfileOpen && <span>Profile</span>}
          </span>
        </button>
      </nav>

      {/* PROFILE SLIDE-UP DRAWER SHEET */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Profile Drawer (Light theme - White Card) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand-border rounded-t-3xl p-6 pb-12 text-brand-dark shadow-[0_-10px_35px_rgba(0,0,0,0.08)] md:hidden flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#6C5CE7]" />
                  </div>
                  <h3 className="font-extrabold text-sm tracking-wide text-brand-dark">Demo Profile</h3>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4.5 h-4.5 text-gray-400" />
                </button>
              </div>

              {/* Wallet Info Card (Light theme gray container) */}
              <div className="bg-gray-50 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">USDC Wallet</span>
                  <span className="text-[10px] font-black text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full uppercase">
                    Demo Mode
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-semibold font-mono">0x7b2f91...c81c2</span>
                  <button
                    onClick={handleCopy}
                    className="text-[10px] font-bold text-[#6C5CE7] hover:text-[#5b4db8] px-2.5 py-1 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 rounded-lg transition-all active:scale-95"
                  >
                    {copied ? "Copied! ✓" : "Copy Address"}
                  </button>
                </div>

                <div className="h-[1px] bg-gray-200 my-1" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Demo Balance</div>
                    <div className="text-xl font-extrabold tabular-nums mt-0.5 text-brand-dark flex items-center gap-1.5">
                      <Wallet className="w-5 h-5 text-brand-green" />
                      ${walletBalance.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={handleRefill}
                    className="px-4 py-2.5 bg-[#00C853] hover:bg-[#00b24a] text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                  >
                    Refill Balance
                  </button>
                </div>
              </div>

              {/* User stats (Light theme cards) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-brand-border rounded-2xl p-3.5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#D09A0A]" />
                    Total Wins
                  </span>
                  <div className="text-lg font-extrabold text-brand-dark mt-1">1 Win</div>
                  <span className="text-[9px] text-[#00C853] font-semibold">100% win rate</span>
                </div>

                <div className="bg-gray-50 border border-brand-border rounded-2xl p-3.5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-gray-400" />
                    Markets Traded
                  </span>
                  <div className="text-lg font-extrabold text-brand-dark mt-1">2 Markets</div>
                  <span className="text-[9px] text-gray-400">1 active, 1 settled</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
