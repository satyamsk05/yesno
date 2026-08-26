"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";

interface UserProfile {
  username: string | null;
  balance: number;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Clerk authentication hooks
  const { isSignedIn, user, isLoaded: isUserLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const formatBalance = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isUserLoaded) return;

    if (!isSignedIn) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isSignedIn, isUserLoaded]);

  const navLinks = [
    { name: "Markets", href: "/markets" },
    { name: "Dashboard", href: "/profile" },
    { name: "History", href: "/history" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-md border-b border-brand-border shadow-sm py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" passHref legacyBehavior>
              <a className="flex items-center gap-2 group select-none cursor-pointer">
                <Image
                  src="/logo.png"
                  alt="YesnoBet"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-xl object-cover transition-transform group-hover:scale-105"
                  priority
                />
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[18px] font-black tracking-tighter text-[#0A0A0A] lowercase">
                    yesno
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 -mt-0.5">
                    — bet —
                  </span>
                </span>
              </a>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} passHref legacyBehavior>
                <a className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors duration-200">
                  {link.name}
                </a>
              </Link>
            ))}
          </nav>

          {/* CTA / Auth State */}
          <div className="hidden md:block">
            {!isUserLoaded || loading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : isSignedIn ? (
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Balance</span>
                  <span className="text-sm font-black text-brand-green tabular-nums">
                    {formatBalance(profile?.balance ?? 0)}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-brand-border" />
                
                <div className="flex items-center gap-2">
                  <UserButton />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">User</span>
                    <span className="text-xs font-bold text-brand-dark max-w-[100px] truncate">
                      {profile?.username || user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0]}
                    </span>
                  </div>
                </div>

                <div className="h-6 w-[1px] bg-brand-border" />
                <Link href="/deposit" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-xs font-bold text-white bg-brand-green hover:bg-emerald-600 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Deposit
                  </motion.a>
                </Link>
                <div className="h-6 w-[1px] bg-brand-border" />
                <Link href="/markets" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-dark text-white text-xs font-bold hover:bg-black/90 transition-colors cursor-pointer"
                  >
                    Trade
                    <ArrowUpRight className="w-3 h-3" />
                  </motion.a>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/sign-in" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-brand-dark text-white text-sm font-semibold hover:bg-black/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Login
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.a>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-brand-dark hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[73px] left-0 right-0 z-40 bg-white border-b border-brand-border px-6 py-8 flex flex-col gap-6 shadow-lg md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} passHref legacyBehavior>
                  <a
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-gray-600 hover:text-brand-dark transition-colors"
                  >
                    {link.name}
                  </a>
                </Link>
              ))}
            </nav>
            {!isUserLoaded || loading ? (
              <div className="w-full text-center text-sm font-medium text-gray-400 py-3">
                Loading authentication status...
              </div>
            ) : isSignedIn ? (
              <div className="flex flex-col gap-4 border-t border-brand-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">User</span>
                  <span className="text-sm font-bold text-brand-dark">
                    {profile?.username || user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Balance</span>
                  <span className="text-sm font-extrabold text-brand-green tabular-nums">
                    {formatBalance(profile?.balance ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-3 border-t border-brand-border pt-4">
                  <UserButton />
                  <span className="text-xs text-gray-400">Manage Account</span>
                </div>
                <div className="flex gap-3 mt-2">
                  <Link href="/deposit" passHref legacyBehavior>
                    <motion.a
                      onClick={() => setIsMobileMenuOpen(false)}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 text-center py-2.5 rounded-full bg-brand-green text-white font-semibold text-sm flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                    >
                      Deposit
                    </motion.a>
                  </Link>
                  <Link href="/markets" passHref legacyBehavior>
                    <motion.a
                      onClick={() => setIsMobileMenuOpen(false)}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 text-center py-2.5 rounded-full bg-brand-dark text-white font-semibold text-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Trade
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.a>
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/sign-in" passHref legacyBehavior>
                <motion.a
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileTap={{ scale: 0.95 }}
                  className="w-full text-center py-3 rounded-full bg-brand-dark text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Login
                  <ArrowUpRight className="w-4 h-4" />
                </motion.a>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
