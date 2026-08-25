import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PredictBTC — Will Bitcoin go up today?",
  description: "Trade Yes or No on BTC price direction. Real-time odds, instant settlement, and premium SaaS analytics. Built to scale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
