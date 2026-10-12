import Link from "next/link";
import { ArrowRight, LockKeyhole, Users } from "lucide-react";
import type { Poll } from "../../../shared/api/types";

export function MiniPoll({ poll, compact = false }: { poll: Poll; compact?: boolean }) {
  const canShowResults = poll.totalVotes !== null;
  return (
    <article className={`relative overflow-hidden rounded-[28px] border border-[#d6d8d0] bg-white ${compact ? "p-5" : "p-6 shadow-[0_24px_60px_rgba(27,38,33,0.13)] sm:p-8"}`}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#e6efff] px-3 py-1 text-xs font-bold text-[#174ea6]">{poll.category}</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7b827d]">
          {poll.isPaid ? <LockKeyhole size={13} /> : <span className="size-2 rounded-full bg-[#37a66a]" />}
          {poll.isPaid ? "Paid vote" : poll.status === "closed" ? "Closed" : "Live poll"}
        </span>
      </div>
      <h3 className={`${compact ? "text-xl" : "text-2xl sm:text-[28px]"} font-extrabold leading-tight tracking-[-0.03em]`}>{poll.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#717a74]">{poll.description ?? "Choose an option and see what the community thinks."}</p>
      <div className="mt-6 space-y-2.5">
        {poll.options.slice(0, 4).map((option, index) => {
          const colors = ["bg-[#ff654f]", "bg-[#3056d3]", "bg-[#f0b429]", "bg-[#37a66a]"];
          const totalVotes = poll.totalVotes;
          const percent = canShowResults && totalVotes !== null && totalVotes > 0 && option.votes !== null
            ? Math.round((option.votes / totalVotes) * 100)
            : null;
          return (
            <div key={option.id} className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-[#dfe1da] px-4 py-3.5 text-left">
              {percent !== null && <span className={`absolute inset-y-0 left-0 ${colors[index % colors.length]} opacity-[0.12]`} style={{ width: `${percent}%` }} />}
              <span className="relative text-sm font-bold text-[#29332e]">{option.label}</span>
              {percent !== null && <span className="relative text-sm font-extrabold">{percent}%</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#ecece6] pt-5 text-xs font-semibold text-[#7b827d]">
        <span className="flex items-center gap-1.5"><Users size={14} /> {canShowResults ? `${poll.totalVotes?.toLocaleString()} votes` : "Results hidden"}</span>
        <Link href={`/polls/${poll.id}`} className="flex items-center gap-1 font-extrabold text-[#3056d3]">Open poll <ArrowRight size={14} /></Link>
      </div>
    </article>
  );
}
