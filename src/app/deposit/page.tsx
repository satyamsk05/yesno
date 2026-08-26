"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Wallet, ArrowLeft, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const PRESETS = [100, 500, 1000, 2000, 5000];

export default function DepositPage() {
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [depositStep, setDepositStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedUPI, setSelectedUPI] = useState<string>('gpay');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [isSignedIn, isUserLoaded]);

  const formatBalance = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const handleProceedToPayment = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError("Please enter a valid amount to deposit.");
      return;
    }
    setError(null);
    setDepositStep('payment');
  };

  const handleSimulatePayment = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    try {
      setProcessing(true);
      setError(null);

      // Call simulated deposit API
      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBalance(data.newBalance);
        setDepositStep('success');
      } else {
        setError(data.error || "Failed to process deposit");
      }
    } catch (err) {
      console.error(err);
      setError("Payment processing failed. Try again.");
    } finally {
      setProcessing(false);
    }
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
              Please log in to add money to your wallet and start predicting.
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

  const activeAmount = customAmount ? parseFloat(customAmount) : amount;

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-28 flex-grow w-full">
        
        {/* Navigation back link */}
        {depositStep !== 'success' && (
          <button
            onClick={() => {
              if (depositStep === 'payment') setDepositStep('select');
              else router.back();
            }}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-dark transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        <div className="bg-white border border-brand-border rounded-3xl p-8 shadow-sm">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Select Amount */}
            {depositStep === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Add Money</h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Fund your INR wallet to place predictions on BTC markets.
                  </p>
                </div>

                {/* Current Balance */}
                <div className="flex items-center justify-between bg-gray-50 border border-brand-border rounded-2xl p-4">
                  <span className="text-xs font-bold text-gray-500">Available Balance</span>
                  <span className="text-lg font-black text-brand-dark font-mono">
                    {balance !== null ? formatBalance(balance) : "₹0.00"}
                  </span>
                </div>

                {/* Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Select Presets (₹)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setAmount(p);
                          setCustomAmount("");
                        }}
                        className={`text-sm font-extrabold py-3 rounded-xl border transition-all ${
                          amount === p && !customAmount
                            ? "bg-brand-dark text-white border-brand-dark shadow-sm"
                            : "border-brand-border text-gray-500 bg-white hover:text-brand-dark"
                        }`}
                      >
                        ₹{p.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Or Enter Custom Amount
                  </span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-2xl border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-dark text-sm bg-white font-bold text-brand-dark"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-brand-red/5 border border-brand-red/20 rounded-xl text-xs font-bold text-brand-red">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProceedToPayment}
                  className="w-full py-4 rounded-2xl bg-brand-dark text-white font-bold text-sm hover:bg-black/95 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Proceed to Pay ₹{activeAmount.toLocaleString()}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2: Simulated UPI Payment Flow */}
            {depositStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">UPI Payment</h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Select a simulated UPI provider to complete the transaction of <strong>₹{activeAmount.toLocaleString()}</strong>.
                  </p>
                </div>

                {/* UPI Options */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setSelectedUPI('gpay')}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-sm font-bold transition-all ${
                      selectedUPI === 'gpay'
                        ? "border-brand-dark bg-gray-50/50 shadow-sm"
                        : "border-brand-border hover:bg-gray-50/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      GP
                    </div>
                    Google Pay
                    <div className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedUPI === 'gpay' ? "border-brand-dark bg-brand-dark" : "border-gray-300"
                    }`}>
                      {selectedUPI === 'gpay' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedUPI('phonepe')}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-sm font-bold transition-all ${
                      selectedUPI === 'phonepe'
                        ? "border-brand-dark bg-gray-50/50 shadow-sm"
                        : "border-brand-border hover:bg-gray-50/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      PP
                    </div>
                    PhonePe
                    <div className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedUPI === 'phonepe' ? "border-brand-dark bg-brand-dark" : "border-gray-300"
                    }`}>
                      {selectedUPI === 'phonepe' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedUPI('paytm')}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-sm font-bold transition-all ${
                      selectedUPI === 'paytm'
                        ? "border-brand-dark bg-gray-50/50 shadow-sm"
                        : "border-brand-border hover:bg-gray-50/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xs">
                      PT
                    </div>
                    Paytm UPI
                    <div className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedUPI === 'paytm' ? "border-brand-dark bg-brand-dark" : "border-gray-300"
                    }`}>
                      {selectedUPI === 'paytm' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-brand-red/5 border border-brand-red/20 rounded-xl text-xs font-bold text-brand-red">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={processing}
                  onClick={handleSimulatePayment}
                  className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-sm hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing UPI Payment...
                    </>
                  ) : (
                    `Confirm Payment (₹${activeAmount.toLocaleString()})`
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3: Payment Success */}
            {depositStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-6 py-6 text-center"
              >
                <div className="p-4 bg-brand-green/10 text-brand-green rounded-full">
                  <CheckCircle2 className="w-16 h-16" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Deposit Successful!</h2>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                    ₹{activeAmount.toLocaleString()} has been added to your prediction wallet.
                  </p>
                </div>

                <div className="w-full bg-gray-50 border border-brand-border rounded-2xl p-4 flex flex-col gap-2 text-sm mt-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Transaction</span>
                    <span className="font-semibold text-brand-dark">Simulated UPI</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>New Balance</span>
                    <span className="font-bold text-brand-dark">{balance !== null ? formatBalance(balance) : "₹0.00"}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.replace("/markets")}
                  className="w-full py-4 rounded-2xl bg-brand-dark text-white font-bold text-sm hover:bg-black/95 transition-colors cursor-pointer mt-4"
                >
                  Start Predicting
                </button>
              </motion.div>
            )}
            
          </AnimatePresence>

        </div>

      </main>

      <Footer />
    </div>
  );
}
