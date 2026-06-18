import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Zap, Bell, Plus, Menu } from "lucide-react";
import "./globals.css"; // Ensure standard Tailwind directives are present here

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Tally — Real-Time Polling Ecosystem",
  description: "Kenya's pulse, in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col`}
      >
        {/* Unified Global Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            
            {/* Brand Platform Link */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-sm">T</span>
              </div>
              <span className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                tally
              </span>
            </Link>

            {/* Middle Nav Matrix Items */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/polls"
                className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all"
              >
                Explore Polls
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all"
              >
                Studio Dashboard
              </Link>
            </div>

            {/* Utility Interaction Column */}
            <div className="hidden md:flex items-center gap-3">
              <button className="relative p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-600 rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-xs font-bold text-violet-600">
                JK
              </div>
            </div>

            {/* Mobile Sidebar Dropdown Trigger */}
            <button className="md:hidden p-2 text-zinc-500">
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {/* Primary Route Rendering Port */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Universal Footer Component */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <p>© 2026 Tally Inc. Pulse of the Community.</p>
            <div className="flex gap-4">
              <span className="hover:underline cursor-pointer">Terms</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span className="hover:underline cursor-pointer">Security Ledger</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}