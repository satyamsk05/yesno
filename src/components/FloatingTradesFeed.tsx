"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeTick {
  id: number;
  amount: string;
  isUp: boolean;
}

const AMOUNTS = [
  "$5", "$8", "$10", "$12", "$15", "$18", "$20", "$25",
  "$30", "$35", "$40", "$50", "$60", "$75", "$80",
  "$100", "$120", "$150", "$175", "$200", "$250",
  "$300", "$400", "$500", "$750", "$1,000",
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const spawnTick = () => {
      const id = ++counterRef.current;
      const isUp = Math.random() > 0.45;
      // Allow up to 4 ticks at once — they spawn at different times so
      // each is naturally at a different height in its upward journey.
      setTicks((prev) => [...prev.slice(-3), { id, amount: randomAmount(), isUp }]);

      // Spawn next tick every 700–1400ms — fast enough to have 2-3 in flight
      const nextIn = randomInterval(700, 1400);
      timeoutRef.current = setTimeout(spawnTick, nextIn);
    };

    timeoutRef.current = setTimeout(spawnTick, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const removeTick = (id: number) => {
    setTicks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    /*
     * Wrapper is absolutely positioned below the chart.
     * Each tick is absolutely positioned at bottom:0 and animates
     * upward by translating Y — so only ONE is ever visible at a time,
     * rising cleanly from bottom to top before the next one spawns.
     */
    <div
      className="absolute left-3 bottom-6 z-10 pointer-events-none select-none"
      style={{ width: 72, height: 160 }}
    >
      <AnimatePresence>
        {ticks.map((tick) => (
          <motion.div
            key={tick.id}
            style={{ position: "absolute", bottom: 0, left: 0 }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -40, -95, -155] }}
            transition={{
              duration: 4,
              ease: "easeOut",
              times: [0, 0.12, 0.65, 1],
            }}
            onAnimationComplete={() => removeTick(tick.id)}
            className={`text-[11px] font-extrabold whitespace-nowrap ${
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
