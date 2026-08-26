"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Wallet, Loader2, ArrowUpRight, Clock, History, CreditCard } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

interface Bet {
  id: string;
  timeframe: string;
  prediction: 'up' | 'down';
  amount: number;
  entry_price: number;
  resolve_time: string;
  status: 'open' | 'resolved';
  exit_price?: number;
  result?: 'win' | 'loss' | 'draw';
  payout?: number;
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet_placement' | 'bet_resolution';
  amount: number;
  reference_id?: string;
  created_at: string;
}

interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfitLoss: number;
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded: isUserLoaded, user } = useUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bets' | 'transactions'>('bets');

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        throw new Error("Failed to load profile details");
      }
      const data = await res.json();
      setBalance(data.balance);
      setUsername(data.username);
      setStats(data.stats);
      setBets(data.bets || []);
      setTransactions(data.transactions || []);
    } catch (err: unknown) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoaded) return;

    if (isSignedIn) {
      fetchProfileData();
    } else {
      setBalance(null);
      setBets([]);
      setTransactions([]);
      setStats(null);
      setLoading(false);
    }
  }, [isSignedIn, isUserLoaded, fetchProfileData]);

  const formatBalance = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

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

  if (!isUserLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
        <Footer />
      </div>
    );
  }

  // Signed out screen
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white border border-brand-border rounded-3xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 border border-brand-border rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-6">
              <Wallet className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-brand-dark mb-3">Login Required</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Access your personalized dashboard, track wallet balances, review wins and losses, and check your prediction history.
            </p>
            <Link href="/sign-in" passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full py-3.5 rounded-xl bg-brand-dark text-white font-bold text-sm hover:bg-black/95 transition-all text-center cursor-pointer shadow-sm"
              >
                Login to Account
              </motion.a>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 flex-grow w-full">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-brand-border pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark text-white font-black text-xl flex items-center justify-center shadow-sm uppercase select-none">
              {username ? username.slice(0, 2) : "US"}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-brand-dark">
                {username || user?.username || "Trader"}
              </h1>
              <p className="text-gray-400 text-xs mt-1">
                UID: {user?.id}
              </p>
            </div>
          </div>

          {/* Wallet Balance widget */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm min-w-[280px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                Available Wallet
              </span>
              <span className="text-2xl font-black text-brand-dark tabular-nums tracking-tight mt-1">
                {balance !== null ? formatBalance(balance) : "₹0.00"}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/deposit" passHref legacyBehavior>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs font-bold text-white bg-brand-green hover:bg-emerald-600 px-4 py-2 rounded-xl text-center cursor-pointer shadow-sm transition-colors"
                >
                  Deposit
                </motion.a>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <div className="bg-white border border-brand-border rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Total Predictions
              </span>
              <span className="text-2xl font-black text-brand-dark block tabular-nums">
                {stats.totalBets}
              </span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Wins
              </span>
              <span className="text-2xl font-black text-brand-green block tabular-nums">
                {stats.totalWins}
              </span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Losses
              </span>
              <span className="text-2xl font-black text-brand-red block tabular-nums">
                {stats.totalLosses}
              </span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Win Rate
              </span>
              <span className="text-2xl font-black text-brand-dark block tabular-nums">
                {stats.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 text-center shadow-sm col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Net Profit/Loss
              </span>
              <span className={`text-2xl font-black block tabular-nums ${
                stats.totalProfitLoss >= 0 ? "text-brand-green" : "text-brand-red"
              }`}>
                {stats.totalProfitLoss >= 0 ? "+" : ""}{formatBalance(stats.totalProfitLoss)}
              </span>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-brand-border mb-6">
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'bets'
                ? "border-brand-dark text-brand-dark"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <History className="w-4 h-4" />
            Prediction History
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'transactions'
                ? "border-brand-dark text-brand-dark"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Wallet Ledger
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'bets' ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
            {bets.length === 0 ? (
              <div className="text-center py-16 px-4">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-md font-bold text-brand-dark mb-1">No Prediction History</h4>
                <p className="text-sm text-gray-400 mb-6">You have not made any predictions on Bitcoin yet.</p>
                <Link href="/markets" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-dark text-white text-xs font-bold hover:bg-black/90 cursor-pointer shadow-sm"
                  >
                    Start Predicting
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </motion.a>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-brand-border text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Market</th>
                      <th className="py-4 px-6">Prediction</th>
                      <th className="py-4 px-6">Stake</th>
                      <th className="py-4 px-6">Entry Price</th>
                      <th className="py-4 px-6">Exit Price</th>
                      <th className="py-4 px-6 text-right">PL Result</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-[#0A0A0A]">
                    {bets.map((bet) => {
                      const pl = bet.status === 'resolved' ? (Number(bet.payout) - Number(bet.amount)) : 0;
                      return (
                        <tr key={bet.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                          <td className="py-4 px-6 text-xs text-gray-400 font-mono">
                            {formatDate(bet.created_at)}
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
                          <td className="py-4 px-6">
                            ₹{bet.amount}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs">
                            {formatUSD(bet.entry_price)}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs">
                            {bet.exit_price ? formatUSD(bet.exit_price) : "-"}
                          </td>
                          <td className={`py-4 px-6 text-right font-bold ${
                            bet.status === 'open' 
                              ? "text-amber-500" 
                              : bet.result === 'win' 
                              ? "text-brand-green" 
                              : bet.result === 'draw' 
                              ? "text-gray-500" 
                              : "text-brand-red"
                          }`}>
                            {bet.status === 'open' ? (
                              <span className="flex items-center justify-end gap-1 text-xs">
                                <Clock className="w-3.5 h-3.5" /> Open
                              </span>
                            ) : bet.result === 'win' ? (
                              `+${formatBalance(pl)}`
                            ) : bet.result === 'draw' ? (
                              "REFUND"
                            ) : (
                              `-${formatBalance(Math.abs(pl))}`
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-md font-bold text-brand-dark mb-1">No Transactions</h4>
                <p className="text-sm text-gray-400">All deposits, withdrawals, and payouts will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-brand-border text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Transaction ID</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-[#0A0A0A] font-mono">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 px-6 text-xs text-gray-400">
                          {tx.id}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-400">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            tx.type === 'deposit'
                              ? 'bg-brand-green/10 text-brand-green'
                              : tx.type === 'bet_resolution'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : tx.type === 'withdrawal'
                              ? 'bg-brand-red/10 text-brand-red'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${
                          tx.amount >= 0 ? "text-brand-green" : "text-brand-red"
                        }`}>
                          {tx.amount >= 0 ? `+${formatBalance(tx.amount)}` : `-${formatBalance(Math.abs(tx.amount))}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
