"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Flame, Wallet, Users, Clock, ArrowUpRight, BarChart3 } from "lucide-react";

// Mock Ecosystem Context Struct
const CATEGORIES = ["All", "Music", "Sports", "Food", "Events", "Media", "Fashion", "Tech"];

const MOCK_POLLS = [
  { id: "1", title: "Who is Kenya's best upcoming artist of 2024?", category: "Music", totalVotes: 12675, endsAt: "2026-12-31", isPaid: true, price: 10, isHot: true, leading: "Bien", leadPct: 38 },
  { id: "2", title: "Best Kenyan football club of the season?", category: "Sports", totalVotes: 21751, endsAt: "2026-11-30", isPaid: false, isHot: true, leading: "Gor Mahia", leadPct: 41 },
  { id: "3", title: "Nairobi's best brunch spot 2024?", category: "Food", totalVotes: 6420, endsAt: "2026-12-15", isPaid: true, price: 10, isHot: false, leading: "The Social House", leadPct: 29 },
];

export default function PollsDiscoveryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [billingFilter, setBillingFilter] = useState<"all" | "free" | "paid">("all");

  const filteredItems = MOCK_POLLS.filter((poll) => {
    const matchesCategory = activeCategory === "All" || poll.category === activeCategory;
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBilling = billingFilter === "all" || (billingFilter === "paid" ? poll.isPaid : !poll.isPaid);
    return matchesCategory && matchesSearch && matchesBilling;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Segment Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Browse Active Ecosystems</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Discover public trends and dynamic consensus models across the country.</p>
        </div>

        {/* Query & Strategy Filters Control Center */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, queries, creators..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-600/50 focus:ring-1 focus:ring-violet-600/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-400 flex-shrink-0" />
            {(["all", "free", "paid"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBillingFilter(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                  billingFilter === mode
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Category Node Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-zinc-100 dark:border-zinc-900 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                activeCategory === cat
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid State Logic Handler */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
            <BarChart3 size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">No active rooms found matching filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((poll) => (
              <Link
                key={poll.id}
                href={`/polls/${poll.id}`}
                className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-violet-600/40 transition-all hover:shadow-lg shadow-zinc-100/50 dark:shadow-none text-left"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
                      {poll.category}
                    </span>
                    {poll.isHot && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-500/15 px-1.5 py-0.5 rounded">
                        <Flame size={10} className="fill-current" /> Hot
                      </span>
                    )}
                    {poll.isPaid && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-violet-600 bg-violet-600/15 px-1.5 py-0.5 rounded">
                        <Wallet size={10} /> KSh {poll.price}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="font-bold text-base text-zinc-950 dark:text-zinc-100 leading-snug mb-4 line-clamp-2">
                  {poll.title}
                </h3>

                <div className="mt-auto space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span className="truncate">Leading: <b className="text-zinc-800 dark:text-zinc-300">{poll.leading}</b></span>
                      <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{poll.leadPct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full transition-all duration-300" style={{ width: `${poll.leadPct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1"><Users size={12} /> {poll.totalVotes.toLocaleString()} votes</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Active</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}