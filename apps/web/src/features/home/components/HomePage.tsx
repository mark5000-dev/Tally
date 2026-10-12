"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, CircleCheck, Globe2, Search, ShieldCheck, Sparkles, Vote } from "lucide-react";
import { MiniPoll } from "../../polls/components/MiniPoll";
import { PollCard } from "../../polls/components/PollCard";
import { AppButton } from "../../../shared/components/ui/AppButton";
import { usePollsQuery } from "../../../shared/api/queries";

export function HomePage() {
  const router = useRouter();
  const result = usePollsQuery({ page: 1, limit: 6, status: "published" });
  const polls = result.data?.polls ?? [];
  const featuredPoll = polls.find((poll) => poll.isFeatured) ?? polls[0];
  return (
    <>
      <main>
        <section className="relative overflow-hidden border-b border-[#dfe1da] bg-[#fbfaf5]">
          <div className="pointer-events-none absolute -left-28 top-24 size-72 rounded-full border-[48px] border-[#f1b82e]/20" />
          <div className="pointer-events-none absolute -right-20 top-10 size-64 rounded-full bg-[#dce9ff]/60 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8dad3] bg-white px-3 py-1.5 text-xs font-bold text-[#53605a] shadow-sm">
                <Sparkles size={14} className="text-[#ff654f]" />
                Democracy, minus the drama
              </div>
              <h1 className="max-w-2xl font-serif text-5xl leading-[0.98] font-bold tracking-[-0.055em] text-[#17231f] sm:text-6xl lg:text-[76px]">
                Every opinion
                <span className="relative ml-3 inline-block text-[#ff654f]">
                  counts.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 210 12" fill="none">
                    <path d="M3 8.5C55 2 150 2 207 6" stroke="#F0B429" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#5e6963]">
                Tally is the clearest way to take the public pulse. Vote on the issues, people, and moments everyone is talking about.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <AppButton className="h-13 px-6 text-base" onClick={() => router.push("/polls")}>
                  Explore live polls <ArrowRight size={18} />
                </AppButton>
                <AppButton variant="outline" className="h-13 px-6 text-base" onClick={() => router.push("/dashboard/polls/new")}>
                  Create your own
                </AppButton>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-[#6a746e]">
                <span className="flex items-center gap-2">
                  <CircleCheck size={17} className="text-[#37a66a]" /> Free polls available
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-[#37a66a]" /> Clear rules on every poll
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
              <div className="absolute -left-8 -top-7 z-10 hidden rotate-[-8deg] rounded-xl bg-[#f0b429] px-4 py-2 text-sm font-extrabold text-[#17231f] shadow-[0_4px_0_#bb8511] sm:block">
                Your voice matters
              </div>
              <div className="absolute -bottom-5 -right-5 z-10 hidden rotate-[5deg] items-center gap-2 rounded-xl bg-[#3056d3] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#17348d] sm:flex">
                <BarChart3 size={17} /> Live results
              </div>
              {featuredPoll ? (
                <MiniPoll poll={featuredPoll} />
              ) : result.isPending ? (
                <div className="h-[420px] animate-pulse rounded-[28px] border border-[#d6d8d0] bg-white" />
              ) : (
                <div className="rounded-[28px] border border-[#d6d8d0] bg-white p-8 text-center">
                  <p className="font-bold">{result.isError ? "Polls are temporarily unavailable" : "No live polls yet"}</p>
                  <button type="button" onClick={() => router.push("/polls")} className="mt-4 text-sm font-extrabold text-[#3056d3]">Browse polls</button>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-[#dfe1da] bg-white/60">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 py-6 text-sm font-bold text-[#7a827d] lg:justify-between lg:px-8">
              <span className="text-xs uppercase tracking-[0.18em] text-[#969c98]">Trusted by curious minds at</span>
              <span className="text-[#4e5852]">THE DAILY BRIEF</span>
              <span className="text-[#4e5852]">CIVIC LAB</span>
              <span className="text-[#4e5852]">NORTHSTAR</span>
              <span className="text-[#4e5852]">PUBLIC SQUARE</span>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.15em] text-[#ff654f]">Trending now</p>
                <h2 className="font-serif text-4xl font-bold tracking-[-0.04em] text-[#17231f] sm:text-5xl">What people are saying</h2>
              </div>
              <button onClick={() => router.push("/polls")} className="flex items-center gap-2 text-sm font-extrabold text-[#17231f] hover:text-[#ff654f]">
                View all polls <ArrowRight size={17} />
              </button>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {polls.slice(0, 3).map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
            {result.isError && <p className="mt-5 text-sm text-[#ad3828]">{result.error.message}</p>}
            {!result.isPending && !result.isError && polls.length === 0 && <p className="mt-5 text-sm text-[#727a75]">New polls will appear here when they are published.</p>}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-y border-[#dfe1da] bg-[#eef3ff] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.15em] text-[#3056d3]">Simple by design</p>
              <h2 className="font-serif text-4xl font-bold tracking-[-0.04em] text-[#17231f] sm:text-5xl">Make your mark in seconds</h2>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                { icon: Search, number: "01", title: "Find your topic", text: "Browse timely polls across politics, culture, sport, and more." },
                { icon: Vote, number: "02", title: "Cast your vote", text: "Polls show their eligibility and payment rules before you participate." },
                { icon: BarChart3, number: "03", title: "See the picture", text: "Results appear according to each poll’s visibility settings." },
              ].map((step) => (
                <div key={step.number} className="relative rounded-[24px] border border-[#cad5ef] bg-white p-7">
                  <span className="absolute right-6 top-5 font-serif text-5xl font-bold text-[#e4e9f6]">{step.number}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#3056d3] text-white shadow-[0_4px_0_#17348d]">
                    <step.icon size={22} />
                  </span>
                  <h3 className="mt-8 text-xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 leading-7 text-[#69736d]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fbfaf5] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="relative overflow-hidden rounded-[32px] bg-[#17231f] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
              <div className="absolute -left-16 -top-16 size-44 rounded-full border-[32px] border-[#ff654f]" />
              <div className="absolute -bottom-12 -right-10 size-40 rounded-full bg-[#f0b429]" />
              <Globe2 className="relative mx-auto mb-5 text-[#f0b429]" size={34} />
              <h2 className="relative mx-auto max-w-2xl font-serif text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                A clearer picture starts with your voice.
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg leading-8 text-[#c7cec9]">
                Join thousands of people making public opinion more open, useful, and human.
              </p>
              <AppButton variant="light" className="relative mt-7 h-13 px-6" onClick={() => router.push("/polls")}>
                Start voting <ArrowRight size={18} />
              </AppButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
