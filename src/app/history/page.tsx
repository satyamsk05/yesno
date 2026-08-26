"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Landmark, RefreshCw } from "lucide-react";

interface HistoryBet {
  id: string;
  timeframe: string;
  prediction: 'up' | 'down';
  amount: number;
  entry_price: number;
  exit_price: number;
  result: 'win' | 'loss' | 'draw';
  payout: number;
  created_at: string;
  username: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/history");
      if (!res.ok) {
        throw new Error("Failed to load resolution history");
      }
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load resolution history";
      console.error("Error fetching history:", err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);


  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex-grow w-full">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-brand-border pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-3 flex items-center gap-2.5">
              <Landmark className="w-9 h-9 text-gray-400" /> Public Resolution Ledger
            </h1>
            <p className="text-gray-500 max-w-xl text-sm">
              Public history of resolved predictions on Bitcoin. Transparent, immutable records sourced directly from the Binance price index.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-4 py-2 border border-brand-border hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 hover:text-brand-dark transition-all"
            aria-label="Refresh history"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-white border border-brand-red/10 border-brand-red rounded-2xl p-6 mb-8 text-center text-brand-red shadow-sm max-w-md mx-auto text-xs font-bold">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-2xl p-16 text-center shadow-sm">
            <h3 className="text-lg font-bold text-brand-dark mb-1">No Resolved Predictions</h3>
            <p className="text-sm text-gray-500">There are no resolved predictions in the system yet.</p>
          </div>
        ) : (
          /* Table of Resolved Markets */
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-brand-border text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Trader</th>
                    <th className="py-4 px-6">Interval</th>
                    <th className="py-4 px-6">Prediction</th>
                    <th className="py-4 px-6">Stake</th>
                    <th className="py-4 px-6">Entry Index</th>
                    <th className="py-4 px-6">Exit Index</th>
                    <th className="py-4 px-6 text-center">Outcome</th>
                    <th className="py-4 px-6 text-right">Resolved Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-brand-dark">
                  {history.map((bet) => {
                    return (
                      <tr key={bet.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                          {bet.username}
                        </td>
                        <td className="py-4 px-6">
                          BTC {bet.timeframe.toUpperCase()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            bet.prediction === 'up' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'
                          }`}>
                            {bet.prediction.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          ₹{bet.amount}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-gray-600">
                          {formatUSD(bet.entry_price)}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-gray-600">
                          {formatUSD(bet.exit_price)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                            bet.result === 'win' 
                              ? 'bg-brand-green/10 text-brand-green border-brand-green/20' 
                              : bet.result === 'draw'
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                          }`}>
                            {bet.result === 'win' ? 'WIN' : bet.result === 'draw' ? 'REFUND' : 'LOSS'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-gray-400 text-xs font-mono">
                          {formatDate(bet.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
