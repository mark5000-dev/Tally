"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock3, Copy, Flag, Globe2, LockKeyhole, Share2, Users } from "lucide-react";
import { castVote, getMyVote, queryKeys, submitPollReport, usePollQuery, useSessionQuery, useVoteEligibilityQuery } from "../../../shared/api/queries";
import { AppButton } from "../../../shared/components/ui/AppButton";

function formatKsh(minor: number | null, currency: string) {
  if (minor === null) return "";
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minor / 100);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export function PollDetailPage({ pollId }: { pollId: string }) {
  const client = useQueryClient();
  const pollQuery = usePollQuery(pollId);
  const session = useSessionQuery();
  const eligibilityQuery = useVoteEligibilityQuery(pollId);
  const ownVoteQuery = useQuery({
    queryKey: ["my-vote", pollId],
    queryFn: () => getMyVote(pollId),
    enabled: Boolean(session.data),
    retry: false,
  });
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const voteMutation = useMutation({
    mutationFn: (optionId: string) => castVote(pollId, optionId, crypto.randomUUID()),
    onSuccess: async (updatedPoll) => {
      client.setQueryData(queryKeys.poll(pollId), updatedPoll);
      client.setQueryData(["my-vote", pollId], updatedPoll.vote);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["polls"] }),
        client.invalidateQueries({ queryKey: queryKeys.analytics }),
        client.invalidateQueries({ queryKey: ["vote-eligibility", pollId] }),
      ]);
      setNotice("Your vote has been recorded.");
    },
  });
  const reportMutation = useMutation({
    mutationFn: () => submitPollReport(pollId, { reason: reportReason, details: reportDetails || undefined }),
    onSuccess: () => {
      setReportOpen(false);
      setReportDetails("");
      setNotice("Thanks. Your report was sent for review.");
    },
  });

  if (pollQuery.isPending) return <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-16"><div className="h-80 animate-pulse rounded-[28px] border border-[#d9dcd4] bg-white" /></main>;
  if (pollQuery.isError || !pollQuery.data) return <main className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="font-serif text-4xl font-bold">Poll unavailable</h1><p className="mt-3 text-[#69736d]">{pollQuery.error?.message ?? "This poll could not be found."}</p><Link href="/polls" className="mt-6 inline-flex text-sm font-extrabold text-[#3056d3]">Browse polls</Link></main>;

  // Bound after the guards so the poll stays a plain object inside nested callbacks.
  const poll = pollQuery.data;
  const eligibility = eligibilityQuery.data;
  const blocked = eligibility && !eligibility.eligible ? eligibility : null;
  // Never guess: until the server returns a verdict, voting stays disabled.
  const voteBlocked = blocked !== null || !eligibility || voteMutation.isPending;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice("Copying the link failed. Use your browser's address bar instead.");
    }
  }

  async function sharePoll(title: string) {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // The person dismissed the share sheet; fall through to copying instead.
      }
    }
    await copyLink();
  }

  return (
    <main className="min-h-[70vh] bg-[#fbfaf5] px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/polls" className="inline-flex items-center gap-2 text-sm font-bold text-[#68726c] hover:text-[#17231f]"><ArrowLeft size={16} /> Back to polls</Link>
        <article className="mt-6 overflow-hidden rounded-[28px] border border-[#d9dcd4] bg-white">
          <header className="border-b border-[#e5e7e0] bg-[#fffefa] p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e6efff] px-3 py-1 text-xs font-bold text-[#174ea6]">{poll.category}</span>
              <span className="rounded-full bg-[#f2f1eb] px-3 py-1 text-xs font-bold text-[#53605a]">{poll.pollType}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${poll.isPaid ? "bg-[#e6efff] text-[#3056d3]" : "bg-[#edf8f0] text-[#16784b]"}`}>
                {poll.isPaid ? <LockKeyhole size={12} /> : <Globe2 size={12} />}
                {poll.isPaid ? `${formatKsh(poll.price, poll.currency)} per vote` : "Free to vote"}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-[-0.04em] text-[#17231f] sm:text-5xl">{poll.title}</h1>
            {poll.description && <p className="mt-4 max-w-2xl text-base leading-7 text-[#69736d]">{poll.description}</p>}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#768079]">
              <span className="inline-flex items-center gap-2"><Users size={15} />{poll.totalVotes === null ? "Results hidden" : `${poll.totalVotes.toLocaleString()} votes`}</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={15} />{poll.endsAt ? `Ends ${formatDateTime(poll.endsAt)}` : "No end date"}</span>
              <span>By {poll.creator}</span>
            </div>
          </header>

          <section className="p-6 sm:p-9">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ff654f]">Your choice</p><h2 className="mt-1 text-xl font-extrabold">Select one option</h2></div>
              {poll.votingPolicy === "account_limited" && <span className="text-xs font-bold text-[#68726c]">Account required</span>}
            </div>
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const selectedVote = ownVoteQuery.data?.optionId === option.id;
                const percentage = poll.totalVotes && option.votes !== null ? Math.round(option.votes / poll.totalVotes * 100) : null;
                return (
                  <button key={option.id} type="button" disabled={voteBlocked} onClick={() => voteMutation.mutate(option.id)} className={`relative flex min-h-14 w-full items-center justify-between overflow-hidden rounded-2xl border px-5 py-4 text-left transition-colors ${selectedVote ? "border-[#3056d3] bg-[#eef3ff]" : "border-[#d9dcd4] bg-white hover:border-[#9ea8a0]"} disabled:cursor-not-allowed disabled:opacity-70`}>
                    {percentage !== null && <span className={`absolute inset-y-0 left-0 ${["bg-[#ff654f]", "bg-[#3056d3]", "bg-[#f0b429]", "bg-[#37a66a]"][index % 4]} opacity-[0.10]`} style={{ width: `${percentage}%` }} />}
                    <span className="relative flex items-center gap-3 font-bold text-[#25312b]">{selectedVote && <CheckCircle2 size={17} className="text-[#3056d3]" />}{option.label}</span>
                    <span className="relative text-sm font-extrabold text-[#445149]">{percentage === null ? "" : `${percentage}%`}</span>
                  </button>
                );
              })}
            </div>

            {eligibilityQuery.isPending && <p className="mt-5 rounded-xl border border-[#e5e7e0] bg-[#f7f6f0] p-4 text-sm font-semibold text-[#69736d]">Checking whether you can vote…</p>}
            {eligibilityQuery.isError && <p role="alert" className="mt-5 rounded-xl border border-[#edc8c1] bg-[#fff1ed] p-4 text-sm font-semibold text-[#ad3828]">We could not confirm whether you can vote: {eligibilityQuery.error.message}</p>}
            {blocked?.code === "AUTHENTICATION_REQUIRED" && <p className="mt-5 rounded-xl border border-[#c9d5f0] bg-[#eef3ff] p-4 text-sm leading-6 text-[#40537f]">Sign in to vote in this account-limited poll. <Link href={`/login?next=${encodeURIComponent(`/polls/${poll.id}`)}`} className="font-extrabold underline">Sign in</Link></p>}
            {blocked?.code === "PAYMENT_REQUIRED" && <p className="mt-5 rounded-xl border border-[#c9d5f0] bg-[#eef3ff] p-4 text-sm leading-6 text-[#40537f]">Paid voting is not available yet. No payment has been requested and no vote has been recorded.</p>}
            {blocked?.code === "POLL_NOT_STARTED" && <p className="mt-5 rounded-xl border border-[#ead9a9] bg-[#fff8e4] p-4 text-sm text-[#765e1b]">This poll has not started yet.</p>}
            {(blocked?.code === "POLL_CLOSED" || blocked?.code === "POLL_NOT_OPEN") && <p className="mt-5 rounded-xl border border-[#e5e7e0] bg-[#f7f6f0] p-4 text-sm text-[#69736d]">{blocked.message}.</p>}
            {blocked?.code === "ALREADY_VOTED" && <p className="mt-5 rounded-xl border border-[#b9dfc7] bg-[#edf8f0] p-4 text-sm font-bold text-[#16784b]">Your account has already voted in this poll.</p>}
            {voteMutation.isError && <p role="alert" className="mt-5 rounded-xl border border-[#edc8c1] bg-[#fff1ed] p-4 text-sm font-semibold text-[#ad3828]">{voteMutation.error.message}</p>}
            {notice && <p role="status" className="mt-5 rounded-xl border border-[#b9dfc7] bg-[#edf8f0] p-4 text-sm font-bold text-[#16784b]">{notice}</p>}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#ecece6] pt-5">
              <div className="flex flex-wrap gap-2">
                <AppButton variant="outline" onClick={() => void copyLink()}><Copy size={15} /> {copied ? "Copied" : "Copy link"}</AppButton>
                <AppButton variant="outline" onClick={() => void sharePoll(poll.title)}><Share2 size={15} /> Share</AppButton>
                <AppButton variant="ghost" onClick={() => setReportOpen((open) => !open)}><Flag size={15} /> Report</AppButton>
              </div>
              {voteMutation.isPending && <span role="status" className="text-sm font-semibold text-[#68726c]">Recording vote…</span>}
              {!voteBlocked && <span className="text-xs font-semibold text-[#7b837e]">Vote submission is protected against accidental retries.</span>}
            </div>
            {reportOpen && <form onSubmit={(event) => { event.preventDefault(); reportMutation.mutate(); }} className="mt-5 grid gap-3 rounded-2xl bg-[#f7f6f0] p-4 sm:grid-cols-[1fr_2fr_auto]">
              <select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="h-11 rounded-xl border border-[#d4d8d0] bg-white px-3 text-sm font-semibold"><option value="spam">Spam</option><option value="harmful_content">Harmful content</option><option value="misinformation">Misinformation</option><option value="other">Other</option></select>
              <input value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={2000} placeholder="Details (optional)" className="h-11 rounded-xl border border-[#d4d8d0] bg-white px-3 text-sm" />
              <AppButton type="submit" disabled={reportMutation.isPending}>{reportMutation.isPending ? "Sending…" : "Send report"}</AppButton>
            </form>}
            {reportMutation.isError && <p role="alert" className="mt-3 text-sm font-semibold text-[#ad3828]">{reportMutation.error.message}</p>}
          </section>
        </article>
      </div>
    </main>
  );
}
