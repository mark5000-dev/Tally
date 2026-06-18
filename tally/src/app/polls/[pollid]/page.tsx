"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ChevronLeft, Globe, Lock, Users, Clock, CheckCircle2, Share2, Copy } from "lucide-react";

interface PageProps {
  params: Promise<{ pollid: string }>;
}

export default function DynamicPollBallotRoom({ params }: PageProps) {
  const resolvedParams = use(params);
  const [votedId, setVotedId] = useState<string | null>(null);

  // Dynamic Content Ingestion Framework (Simulated API State Hydration)
  const pollData = {
    id: resolvedParams.pollid,
    title: "Who should headline Blankets & Wine 2026?",
    category: "Events",
    totalVotes: 28400,
    isPaid: true,
    price: 10,
    creator: "Events KE",
    options: [
      { id: "opt-a", label: "Burna Boy", votes: 9200 },
      { id: "opt-b", label: "Tems", votes: 8100 },
      { id: "opt-c", label: "Sauti Sol", votes: 11100 },
    ]
  };

  const handleVoteSubmission = (optionId: string) => {
    if (votedId) return;
    setVotedId(optionId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        <Link href="/polls" className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors">
          <ChevronLeft size={14} /> Return to Discovery Pipeline
        </Link>

        {/* Identity & Header Metrics Block */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="flex gap-2 items-center mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-500">
              {pollData.category}
            </span>
            {pollData.isPaid ? (
              <span className="text-[10px] font-bold text-violet-600 bg-violet-600/10 px-2 py-0.5 rounded border border-violet-600/20 flex items-center gap-1">
                <Lock size={10} /> Premium Node · KSh {pollData.price}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-600/10 px-2 py-0.5 rounded border border-emerald-600/20 flex items-center gap-1">
                <Globe size={10} /> Open Infrastructure
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-4">
            {pollData.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">By @{pollData.creator}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {pollData.totalVotes.toLocaleString()} dynamic entries</span>
            <span className="flex items-center gap-1"><Clock size={12} /> Active execution</span>
          </div>
        </div>

        {/* Interactive Ballot Interface Layout */}
        <div className="space-y-3 mb-8">
          {pollData.options.map((opt) => {
            const calculatedPercentage = Math.round((opt.votes / pollData.totalVotes) * 100);
            const dynamicSelectionMatch = votedId === opt.id;
            
            return (
              <button
                key={opt.id}
                onClick={() => handleVoteSubmission(opt.id)}
                disabled={votedId !== null}
                className={`w-full relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  dynamicSelectionMatch
                    ? "border-violet-600 bg-violet-600/5 shadow-md shadow-violet-600/5"
                    : votedId
                    ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60 cursor-not-allowed"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-600/40"
                }`}
              >
                {/* Result Analytics Visual Overlay Overlay */}
                {votedId && (
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                      dynamicSelectionMatch ? "bg-violet-600/10" : "bg-zinc-100 dark:bg-zinc-800/40"
                    }`}
                    style={{ width: `${calculatedPercentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between p-4 z-10">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className={`text-sm font-bold ${dynamicSelectionMatch ? "text-violet-600 dark:text-violet-400" : "text-zinc-950 dark:text-zinc-100"}`}>
                      {opt.label}
                    </span>
                    {votedId && (
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{(opt.votes + (dynamicSelectionMatch ? 1 : 0)).toLocaleString()} verified items</p>
                    )}
                  </div>
                  
                  {votedId ? (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black ${dynamicSelectionMatch ? "text-violet-600" : "text-zinc-500"}`}>
                        {calculatedPercentage}%
                      </span>
                      {dynamicSelectionMatch && <CheckCircle2 size={16} className="text-violet-600 flex-shrink-0" />}
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 transition-all group-hover:border-violet-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informational State Banner Node */}
        {!votedId ? (
          pollData.isPaid ? (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 mb-6 flex gap-3">
              <Lock size={16} className="text-violet-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-0.5">Anti-Sybil Attack Protections Active</p>
                <p>This premium poll requires a KSh {pollData.price} M-Pesa push validation node. Strictly restricted to unique MSISDN hardware keys.</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-zinc-400 mb-6">Select a runtime component above to execute a secure free vote protocol.</p>
          )
        ) : (
          <div className="p-4 bg-violet-600/10 border border-violet-600/20 rounded-xl text-xs text-violet-600 font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 size={16} /> Vote record written downstream instantly to global index storage ledger.
          </div>
        )}

        {/* Action Toolbox Matrix */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 transition-all">
            <Share2 size={14} /> Broadcast Node
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 transition-all">
            <Copy size={14} /> Copy Locator Path
          </button>
        </div>

      </div>
    </div>
  );
}