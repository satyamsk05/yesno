"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, X, ArrowDownLeft, ArrowUpRight, History, Award } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import confetti from "canvas-confetti";

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export default function MobileNav() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read balance from localStorage or use default mock
  const [walletBalance, setWalletBalance] = useState<number>(1000.00);

  // Copy wallet address helper
  const handleCopy = () => {
    navigator.clipboard.writeText("0x4a5f912c3e10fa8c81c2d871");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refill balance helper (Deposit action)
  const handleRefill = () => {
    setWalletBalance(1000.00);
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_balance", "1000.00");
    }
    
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.65 },
      colors: ["#6C5CE7", "#00C853"],
    });
  };

  // MOBILE AUTO FULLSCREEN TRIGGER EFFECT
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFirstInteraction = () => {
      // Only execute on mobile screens
      if (window.innerWidth < 768) {
        const docEl = document.documentElement as FullscreenElement;
        
        // Check if already in fullscreen
        if (!document.fullscreenElement) {
          const requestFS =
            docEl.requestFullscreen ||
            docEl.webkitRequestFullscreen ||
            docEl.mozRequestFullScreen ||
            docEl.msRequestFullscreen;

          if (requestFS) {
            requestFS.call(docEl).catch((err: unknown) => {
              console.warn("Fullscreen request failed:", err);
            });
          }
        }
      }
      // Remove event listeners immediately after first tap/click
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  const isHomeActive = pathname === "/";
  const isMarketActive = pathname === "/trade";

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border shadow-[0_-4px_25px_rgba(0,0,0,0.04)] flex items-center justify-around md:hidden select-none px-2 py-2">
        <LayoutGroup id="mobile-nav">

          {/* Tab 1: Home */}
          <Link href="/">
            <button className="relative flex items-center justify-center focus:outline-none cursor-pointer w-24 h-10">
              {isHomeActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-[#6C5CE7] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
                isHomeActive ? "text-white" : "text-gray-400"
              }`}>
                <Home className="w-4 h-4" />
                {isHomeActive && <span>Home</span>}
              </span>
            </button>
          </Link>

          {/* Tab 2: Market */}
          <Link href="/trade">
            <button className="relative flex items-center justify-center focus:outline-none cursor-pointer w-24 h-10">
              {isMarketActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-[#6C5CE7] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
                isMarketActive ? "text-white" : "text-gray-400"
              }`}>
                <Compass className="w-4 h-4" />
                {isMarketActive && <span>Market</span>}
              </span>
            </button>
          </Link>

          {/* Tab 3: Profile */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="relative flex items-center justify-center focus:outline-none cursor-pointer w-24 h-10"
          >
            {isProfileOpen && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-[#6C5CE7] rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 font-bold text-xs tracking-wide ${
              isProfileOpen ? "text-white" : "text-gray-400"
            }`}>
              <User className="w-4 h-4" />
              {isProfileOpen && <span>Profile</span>}
            </span>
          </button>

        </LayoutGroup>
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

            {/* Profile Drawer Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand-border rounded-t-3xl p-6 pb-12 text-brand-dark shadow-[0_-10px_35px_rgba(0,0,0,0.08)] md:hidden flex flex-col gap-5 overflow-y-auto max-h-[85vh]"
            >
              {/* Close Handle / Indicator */}
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 cursor-pointer" onClick={() => setIsProfileOpen(false)} />

              {/* 1. Header (Hello ogcrypt + avatar) */}
              <div className="flex items-start justify-between mt-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#f2a900] flex items-center justify-center font-bold text-white text-lg shadow-xs select-none">
                    O
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">
                      Hello, <span className="text-[#6C5CE7]">ogcrypt</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Copy Address Badge */}
                      <button 
                        onClick={handleCopy}
                        className="bg-gray-50 border border-brand-border px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 flex items-center gap-1 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <span>{copied ? "Copied!" : "0x4a5f...1232"}</span>
                        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                        </svg>
                      </button>

                      {/* Connect X button */}
                      <button className="bg-gray-50 border border-brand-border px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer hover:bg-gray-100 transition-colors">
                        <span>Connect</span>
                        <span className="font-extrabold text-[9px]">X</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 2. Badge Showcase */}
              <div className="bg-white border border-brand-border rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Badge Showcase</span>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50" title="Trader Badge">
                    <Award className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50" title="Star Badge">
                    <Award className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50" title="Target Badge">
                    <Award className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="w-8 h-8 border border-gray-100 rounded-lg flex items-center justify-center bg-gray-50/50 text-[9px] font-bold text-gray-300" title="PNL Badge">
                    PNL
                  </div>
                  <div className="w-8 h-8 border border-gray-100 rounded-lg flex items-center justify-center bg-gray-50/50 text-[9px] font-bold text-gray-300" title="PP Badge">
                    pp
                  </div>
                </div>
              </div>

              {/* 3. Portfolio Box (Purple container) */}
              <div className="bg-[#6C5CE7] text-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                {/* Background vector glow */}
                <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <span className="text-xs text-white/70 font-semibold tracking-wide">Portfolio</span>
                  <div className="text-3xl font-black mt-1.5 tracking-tight tabular-nums">
                    ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-1 border-t border-white/10 pt-3">
                  <div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Position value</div>
                    <div className="text-sm font-extrabold mt-0.5 tabular-nums">$0.00</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Available</div>
                    <div className="text-sm font-extrabold mt-0.5 tabular-nums">
                      ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Buttons row */}
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {/* Deposit button */}
                  <button 
                    onClick={handleRefill}
                    className="col-span-2 bg-white text-black py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-50"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>

                  {/* Withdraw button */}
                  <button 
                    onClick={() => {
                      alert("Withdrawing funds...");
                    }}
                    className="col-span-2 bg-white/15 text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer hover:bg-white/20 border border-white/10"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>

                  {/* History button */}
                  <button className="col-span-1 bg-white/15 text-white py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer hover:bg-white/20 border border-white/10" aria-label="Transaction History">
                    <History className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* 4. PNL Tracker Box */}
              <div className="bg-gray-50 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 tracking-wider">PNL</span>
                  <div className="text-xl font-bold mt-0.5 text-brand-dark flex items-center gap-1.5 tabular-nums">
                    $0
                    <span className="text-[10px] font-bold text-[#00C853] flex items-center">
                      ▲ $0
                    </span>
                  </div>
                </div>

                {/* Timeframe switcher */}
                <div className="flex bg-gray-200/60 p-0.5 rounded-lg text-[10px] font-bold text-gray-500">
                  <span className="bg-white text-brand-dark px-2 py-1 rounded-md shadow-2xs">1d</span>
                  <span className="px-2 py-1">7d</span>
                  <span className="px-2 py-1">30d</span>
                  <span className="px-2 py-1">all</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
