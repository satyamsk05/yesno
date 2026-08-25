"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Markets", href: "#markets" },
    { name: "How it works", href: "#how-it-works" },
    { name: "FAQ", href: "#faq" },
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
          <a href="#" className="flex items-center gap-2 group">
            <Image
              src="/sitelogo.png"
              alt="YesnoBet"
              width={120}
              height={40}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/trade" passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-brand-dark text-white text-sm font-semibold hover:bg-black/90 transition-colors shadow-sm cursor-pointer"
              >
                Launch App
                <ArrowUpRight className="w-4 h-4" />
              </motion.a>
            </Link>
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
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-600 hover:text-brand-dark transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
            <Link href="/trade" passHref legacyBehavior>
              <motion.a
                onClick={() => setIsMobileMenuOpen(false)}
                whileTap={{ scale: 0.95 }}
                className="w-full text-center py-3 rounded-full bg-brand-dark text-white font-semibold flex items-center justify-center gap-1.5 animate-none cursor-pointer"
              >
                Launch App
                <ArrowUpRight className="w-4 h-4" />
              </motion.a>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
