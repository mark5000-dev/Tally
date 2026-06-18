import Link from "next/link";
import { Zap, ArrowRight, BarChart3, Users, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 relative overflow-hidden flex flex-col justify-center">
      {/* Structural Minimalist Accent Geometry */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 grid lg:grid-cols-12 gap-12 items-center">
        {/* Marketing Matrix Column */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 border border-violet-600/20 rounded-full text-xs text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wider">
            <Zap size={12} className="fill-current" /> Pulse of the Community
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] text-zinc-950 dark:text-white">
            What does <br />
            <span className="underline decoration-violet-600 decoration-wavy decoration-2">Kenya</span> actually think?
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Create ultra-fast real-time polls, gather structured sentiment analytics, and tap directly into emerging urban trends. Zero friction. Real outcomes.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/polls"
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold shadow-md shadow-violet-600/10 hover:bg-violet-700 transition-all transform hover:-translate-y-0.5"
            >
              Explore Active Polls
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all flex items-center gap-2"
            >
              Go to Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Dynamic Widget Sandbox Feature */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-medium bg-violet-600/15 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" /> Live Preview
          </div>
          
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-1 pr-16">
            Who is Kenya's best upcoming artist of the season?
          </h3>
          <p className="text-xs text-zinc-400 mb-4">By @MusicKE · 12.6k votes cast</p>

          <div className="space-y-3">
            {[
              { label: "Bien", pct: 38, lead: true },
              { label: "Nviiri the Storyteller", pct: 25, lead: false },
              { label: "Femi One", pct: 23, lead: false },
            ].map((opt, i) => (
              <div key={i} className="relative border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950/50">
                <div 
                  className="absolute inset-y-0 left-0 bg-violet-600/10 rounded-xl transition-all duration-500" 
                  style={{ width: `${opt.pct}%` }} 
                />
                <div className="relative flex justify-between items-center text-sm">
                  <span className={`font-medium ${opt.lead ? "text-violet-600 dark:text-violet-400 font-bold" : ""}`}>{opt.label}</span>
                  <span className="font-mono text-xs text-zinc-500">{opt.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}