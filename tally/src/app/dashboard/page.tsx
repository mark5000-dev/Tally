import { BarChart3, Users, Wallet, Plus, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardStudioHome() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      
      {/* Studio Header Entity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-base font-black text-violet-600">
            JK
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">John Kamau</h1>
            <p className="text-xs text-zinc-400">Developer Profile Node · Nairobi Workspace</p>
          </div>
        </div>
        
        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/10 hover:bg-violet-700 transition-all">
          <Plus size={14} /> Initialize Dynamic Room
        </button>
      </div>

      {/* Bento Grid Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Channels", value: "12 units", sub: "Published architectures", icon: BarChart3 },
          { label: "Aggregated Votes", value: "48.2k logs", sub: "+12% acceleration drift", icon: Users },
          { label: "Liquid Balance", value: "KSh 2,450", sub: "M-Pesa linked gateway", icon: Wallet, highlight: true },
        ].map((card, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border bg-white dark:bg-zinc-900 flex flex-col justify-between h-36 transition-all hover:shadow-md ${
              card.highlight ? "border-violet-600/30 ring-1 ring-violet-600/5" : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-400">{card.label}</span>
              <card.icon size={16} className={card.highlight ? "text-violet-600" : "text-zinc-400"} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white mb-0.5">{card.value}</p>
              <p className="text-[10px] text-zinc-400 font-semibold">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid Layout Split Block */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Bento Segment: Operational History Streams */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-violet-600" /> Tracked Channels
          </h3>
          <div className="space-y-3">
            {[
              { title: "Who is Kenya's best upcoming artist?", cat: "Music", votes: "12,675" },
              { title: "Best Kenyan football club of the season?", cat: "Sports", votes: "21,751" },
            ].map((poll, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-zinc-100 dark:border-zinc-800/60 rounded-xl bg-zinc-50 dark:bg-zinc-950/40">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100 truncate">{poll.title}</p>
                  <span className="text-[10px] text-zinc-400 uppercase font-black">{poll.cat}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-300">{poll.votes}</span>
                  <p className="text-[9px] text-emerald-500 font-bold">Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Bento Segment: Ledger Transactions */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Ledger Pipelines</h3>
          <div className="space-y-4">
            {[
              { action: "Node Publish — Best Artist", val: "-KSh 100", type: "debit" },
              { action: "M-Pesa Inbound Topup", val: "+KSh 500", type: "credit" },
              { action: "Node Publish — Nairobi Brunch", val: "-KSh 100", type: "debit" },
            ].map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">{tx.action}</p>
                  <p className="text-[10px] text-zinc-400">ISO Timestamp</p>
                </div>
                <span className={`font-mono font-black ${tx.type === "credit" ? "text-violet-600" : "text-zinc-500"}`}>
                  {tx.val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}