import { Vote } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[#ff654f] text-white shadow-[0_4px_0_#b93425]">
        <Vote size={19} strokeWidth={2.5} />
      </span>
      <span className="text-xl font-extrabold tracking-[-0.04em] text-[#17231f]">Tally</span>
    </div>
  );
}
