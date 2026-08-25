"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeTick {
  id: number;
  amount: string;
  isUp: boolean;
}

const AMOUNTS = [
  "$5", "$10", "$15", "$20", "$25",
  "$30", "$50", "$75", "$100", "$150", "$200",
];

function randomAmount() {
  return AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
}

function randomInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FloatingTradesFeed() {
  const [ticks, setTicks] = useState<TradeTick[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    // Spawn a new trade tick at random intervals between 600ms and 2200ms
    const spawnTick = () => {
      const id = ++counterRef.current;
      const isUp = Math.random() > 0.45; // Slightly more bullish
      setTicks((prev) => [
        ...prev.slice(-5), // Keep at most 5 visible at once
        { id, amount: randomAmount(), isUp },
      ]);

      // Schedule next spawn
      const nextIn = randomInterval(600, 2200);
      timeoutRef.current = setTimeout(spawnTick, nextIn);
    };

    const timeoutRef = { current: setTimeout(spawnTick, 400) };
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Remove a tick after its animation completes
  const removeTick = (id: number) => {
    setTicks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="absolute left-2 bottom-8 z-10 flex flex-col-reverse gap-1 pointer-events-none select-none overflow-hidden" style={{ height: "160px", width: "64px" }}>
      <AnimatePresence>
        {ticks.map((tick) => (
          <motion.div
            key={tick.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-20, -55, -90, -130] }}
            transition={{
              duration: 3.8,
              ease: "easeOut",
              times: [0, 0.15, 0.65, 1],
            }}
            onAnimationComplete={() => removeTick(tick.id)}
            className={`text-[10px] font-extrabold whitespace-nowrap ${
              tick.isUp ? "text-[#00C853]" : "text-[#FF3B57]"
            }`}
          >
            {tick.isUp ? "+" : "−"} {tick.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
