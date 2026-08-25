"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Globe } from "lucide-react";

export default function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Live Markets", href: "#markets" },
        { name: "SaaS Analytics", href: "#" },
        { name: "Developer API", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "How it Works", href: "#how-it-works" },
        { name: "FAQ", href: "#faq" },
        { name: "Documentation", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact Support", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Risk Disclosure", href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative bg-white border-t border-brand-border overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none -z-10 opacity-40">
        <div className="absolute bottom-[-100px] left-[30%] w-[450px] h-[450px] rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[30%] w-[450px] h-[450px] rounded-full bg-brand-red/5 blur-[120px]" />
      </div>

      {/* FINAL CTA SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 border-b border-brand-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-brand-dark mb-6"
          >
            Start trading BTC predictions today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base md:text-lg text-gray-500 max-w-md mx-auto mb-10 leading-relaxed text-balance"
          >
            Put your Bitcoin conviction to the test. Take your position with instant execution.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 w-full sm:w-auto"
          >
            <motion.a
              href="#markets"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-dark text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-black/95 hover:scale-[1.03] transition-all duration-200 shadow-md group"
            >
              Trade Now
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-brand-border text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-brand-dark hover:scale-[1.03] transition-all duration-200"
            >
              How it works
            </motion.a>
          </motion.div>

          {/* Risk disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed"
          >
            Risk warning: Binary prediction contracts involve high risk. Price movements can be volatile and unpredictable. Trade only with funds you are prepared to lose.
          </motion.p>
        </div>
      </div>

      {/* FOOTER LINKS GRID */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Block */}
        <div className="col-span-2 flex flex-col items-start gap-4">
          <a href="#" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center font-bold text-white text-lg tracking-tighter">
              P
            </span>
            <span className="font-bold text-xl tracking-tight text-brand-dark">
              Predict<span className="text-brand-green">BTC</span>
            </span>
          </a>
          <p className="text-gray-500 text-xs md:text-sm max-w-xs leading-relaxed">
            The next-generation Bitcoin prediction market. Designed with modern SaaS tools, offering micro-second odds computation and zero friction.
          </p>
        </div>

        {/* Link Columns */}
        {footerLinks.map((col) => (
          <div key={col.title} className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-widest">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs md:text-sm text-gray-500 hover:text-brand-dark transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FOOTER BOTTOM BAR */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-gray-400 font-medium">
          © {new Date().getFullYear()} PredictBTC Inc. All rights reserved.
        </span>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-full transition-all flex items-center justify-center"
            aria-label="Twitter link"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href="#"
            className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-full transition-all flex items-center justify-center"
            aria-label="GitHub link"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>
          <a
            href="#"
            className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-full transition-all"
            aria-label="Website link"
          >
            <Globe className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
