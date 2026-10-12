import Link from "next/link";
import { ArrowUpRight, Clock3, LockKeyhole, Users } from "lucide-react";
import type { Poll } from "../../../shared/api/types";

const categoryTones: Record<string, string> = {
  Politics: "bg-[#e6efff] text-[#174ea6]",
  Music: "bg-[#fff0d8] text-[#9a5b00]",
  Sports: "bg-[#dcf8e8] text-[#16784b]",
  Food: "bg-[#ffe7e1] text-[#ad3828]",
  Events: "bg-[#e3f7f5] text-[#08766d]",
};

function moneyFromMinor(amount: number | null, currency: string) {
  if (amount === null) return null;
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(amount / 100);
}

export function PollCard({ poll }: { poll: Poll }) {
  const endsAt = poll.endsAt ? new Date(poll.endsAt) : null;
  const timeLabel = endsAt
    ? endsAt.getTime() <= Date.now()
      ? "Closed"
      : endsAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })
    : poll.status === "closed"
      ? "Closed"
      : "No end date";

  return (
    <Link
      href={`/polls/${poll.id}`}
      className="group flex h-full flex-col rounded-[24px] border border-[#d9dcd4] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#bdc2b9] hover:shadow-[0_18px_42px_rgba(27,38,33,0.09)] sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryTones[poll.category] ?? "bg-[#eeeee7] text-[#53605a]"}`}>{poll.category}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-[#79827d]">
          {poll.isPaid && <LockKeyhole size={13} className="text-[#3056d3]" />}
          {poll.isPaid ? moneyFromMinor(poll.price, poll.currency) : "Free vote"}
        </span>
      </div>
      <h3 className="text-xl font-extrabold leading-[1.25] tracking-[-0.025em] text-[#17231f]">{poll.title}</h3>
      {poll.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#727a75]">{poll.description}</p>}
      <div className="mt-6 space-y-2">
        {poll.options.slice(0, 4).map((option, index) => {
          const colors = ["bg-[#ff654f]", "bg-[#3056d3]", "bg-[#f0b429]", "bg-[#37a66a]"];
          return (
            <div key={option.id} className="relative flex min-h-11 items-center justify-between overflow-hidden rounded-xl border border-[#e0e2dc] px-4 py-3 text-left text-sm font-bold">
              {option.votes !== null && poll.totalVotes !== null && poll.totalVotes > 0 && (
                <span className={`absolute inset-y-0 left-0 ${colors[index % colors.length]} opacity-[0.10]`} style={{ width: `${Math.round((option.votes / poll.totalVotes) * 100)}%` }} />
              )}
              <span className="relative">{option.label}</span>
              {option.votes !== null && poll.totalVotes !== null && poll.totalVotes > 0 && (
                <span className="relative font-extrabold">{Math.round((option.votes / poll.totalVotes) * 100)}%</span>
              )}
            </div>
          );
        })}
        {poll.totalVotes === null && <p className="rounded-xl bg-[#f7f6f0] px-4 py-3 text-sm font-semibold text-[#737b76]">Results are not visible yet</p>}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[#ecece6] pt-5 text-xs font-semibold text-[#818883]">
        <span className="flex items-center gap-1.5"><Users size={14} /> {poll.totalVotes === null ? "Votes hidden" : `${poll.totalVotes.toLocaleString()} votes`}</span>
        <span className="flex items-center gap-1.5"><Clock3 size={14} /> {timeLabel}</span>
      </div>
      <span className="mt-4 flex items-center justify-end gap-1 text-xs font-extrabold text-[#3056d3] opacity-0 transition-opacity group-hover:opacity-100">Open poll <ArrowUpRight size={14} /></span>
    </Link>
  );
}
