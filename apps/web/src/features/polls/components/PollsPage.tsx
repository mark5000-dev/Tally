"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { usePollsQuery } from "../../../shared/api/queries";
import { PollCard } from "./PollCard";

type SortMode = "recent" | "ending_soon";
type PaidFilter = "all" | "free" | "paid";
type PageItem = { type: "gap"; after: number } | { type: "page"; value: number };

const PAID_QUERY: Record<PaidFilter, "true" | "false" | undefined> = {
  all: undefined,
  free: "false",
  paid: "true",
};

const CATEGORY_SEEDS = ["Music", "Sports", "Food", "Events", "Culture", "Technology", "Community"];

function pageNumbers(current: number, total: number): PageItem[] {
  if (total <= 7)
    return Array.from({ length: total }, (_unused, index) => ({ type: "page" as const, value: index + 1 }));
  const wanted = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((value) => value >= 1 && value <= total)
    .sort((left, right) => left - right);
  const output: PageItem[] = [];
  let previous = 0;
  for (const value of wanted) {
    if (previous && value - previous > 1) output.push({ type: "gap", after: previous });
    output.push({ type: "page", value });
    previous = value;
  }
  return output;
}

export function PollsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL owns the filters so a view can be shared, bookmarked, and restored
  // by the browser's back button.
  const category = searchParams.get("category") ?? "All polls";
  const paidParam = searchParams.get("paid");
  const paidFilter: PaidFilter = paidParam === "free" || paidParam === "paid" ? paidParam : "all";
  const sort: SortMode = searchParams.get("sort") === "ending_soon" ? "ending_soon" : "recent";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const urlQuery = searchParams.get("q") ?? "";

  // The search box stays local while it is being typed into; everything else is
  // read straight from the URL above.
  const [typed, setTyped] = useState(urlQuery);

  // Follow back/forward navigation back into the search box.
  useEffect(() => setTyped(urlQuery), [urlQuery]);

  // Debounce the box into the URL so typing does not refetch on every keystroke.
  useEffect(() => {
    if (typed === urlQuery) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (typed) params.set("q", typed);
      else params.delete("q");
      params.delete("page");
      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [typed, urlQuery, pathname, router]);

  function applyFilters(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    // Any filter change invalidates the current page offset.
    if (!("page" in next)) params.delete("page");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  const result = usePollsQuery({
    q: urlQuery || undefined,
    category: category === "All polls" ? undefined : category,
    paid: PAID_QUERY[paidFilter],
    sort,
    page,
    limit: 12,
  });
  const polls = result.data?.polls ?? [];
  const pageCount = result.data?.pagination?.pages ?? 1;
  const categories = [
    "All polls",
    ...new Set([
      ...CATEGORY_SEEDS,
      ...polls.map((poll) => poll.category),
      // Keep a filter selected from the URL clickable even when it matches nothing.
      ...(category === "All polls" ? [] : [category]),
    ]),
  ];

  function goToPage(next: number) {
    applyFilters({ page: next <= 1 ? undefined : String(next) });
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf5]">
      <section className="border-b border-[#dfe1da] bg-[#eef3ff]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#3056d3] shadow-sm">
                <span className="size-2 animate-pulse rounded-full bg-[#37a66a]" /> {result.data?.pagination?.total ?? "..."} polls live now
              </div>
              <h1 className="font-serif text-5xl font-bold tracking-[-0.05em] text-[#17231f] sm:text-6xl">The public pulse</h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#606b65]">See what people think about the questions shaping today, then add your voice.</p>
            </div>
            <label className="flex h-13 w-full items-center gap-3 rounded-2xl border border-[#ccd3e2] bg-white px-4 shadow-sm focus-within:border-[#3056d3] lg:max-w-sm">
              <Search size={20} className="text-[#7a837e]" />
              <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Search polls..." className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#9ca29e]" />
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => applyFilters({ category: item === "All polls" ? undefined : item })} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${category === item ? "bg-[#17231f] text-white" : "border border-[#d9dcd4] bg-white text-[#5e6862] hover:border-[#aeb4ad]"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#7a837e]" />
            {(["all", "free", "paid"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => applyFilters({ paid: mode === "all" ? undefined : mode })} aria-pressed={paidFilter === mode} className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${paidFilter === mode ? "border-[#3056d3] bg-[#3056d3] text-white" : "border-[#d9dcd4] bg-white text-[#5e6862]"}`}>
                {mode}
              </button>
            ))}
            <label className="relative hidden shrink-0 items-center sm:flex">
              <span className="sr-only">Sort polls</span>
              <select value={sort} onChange={(event) => applyFilters({ sort: event.target.value === "recent" ? undefined : event.target.value })} className="appearance-none rounded-xl border border-[#d9dcd4] bg-white py-2.5 pl-4 pr-10 text-sm font-bold text-[#5e6862] outline-none focus:border-[#3056d3]">
                <option value="recent">Most recent</option>
                <option value="ending_soon">Ending soon</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 text-[#7a837e]" />
            </label>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#ff654f]">EXPLORE</p>
            <h2 className="mt-1 font-serif text-3xl font-bold tracking-[-0.035em] text-[#17231f]">{category === "All polls" ? "Live polls" : category}</h2>
          </div>
          <p className="text-sm font-semibold text-[#7b837e]">{result.data?.pagination?.total ?? 0} polls</p>
        </div>

        {result.isPending ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading polls">
            {[0, 1, 2].map((item) => <div key={item} className="h-[340px] animate-pulse rounded-[24px] border border-[#d9dcd4] bg-white" />)}
          </div>
        ) : result.isError ? (
          <div className="my-16 rounded-[24px] border border-[#edc8c1] bg-[#fff1ed] p-10 text-center">
            <h3 className="text-xl font-extrabold">Polls could not load</h3>
            <p className="mt-2 text-sm text-[#727a75]">{result.error.message}</p>
            <button type="button" onClick={() => void result.refetch()} className="mt-5 rounded-xl bg-[#17231f] px-5 py-3 text-sm font-bold text-white">Try again</button>
          </div>
        ) : polls.length > 0 ? (
          <>
            <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
            </div>
            {pageCount > 1 && (
              <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#d9dcd4] bg-white px-3 text-sm font-bold text-[#5e6862] disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} /> Previous</button>
                {pageNumbers(page, pageCount).map((item) => item.type === "gap" ? (
                  <span key={`gap-${item.after}`} className="px-1 text-sm font-bold text-[#9ca29e]">…</span>
                ) : (
                  <button key={item.value} type="button" onClick={() => goToPage(item.value)} aria-current={item.value === page ? "page" : undefined} className={`size-10 rounded-xl border text-sm font-bold ${item.value === page ? "border-[#17231f] bg-[#17231f] text-white" : "border-[#d9dcd4] bg-white text-[#5e6862] hover:border-[#aeb4ad]"}`}>{item.value}</button>
                ))}
                <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= pageCount} className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#d9dcd4] bg-white px-3 text-sm font-bold text-[#5e6862] disabled:cursor-not-allowed disabled:opacity-50">Next <ChevronRight size={16} /></button>
              </nav>
            )}
          </>
        ) : (
          <div className="my-20 rounded-[24px] border border-dashed border-[#cfd2cc] bg-white p-12 text-center">
            <Search className="mx-auto text-[#a4aaa6]" size={34} />
            <h3 className="mt-4 text-xl font-extrabold">No polls found</h3>
            <p className="mt-2 text-[#747d77]">Try a different search or category.</p>
            {(urlQuery || category !== "All polls" || paidFilter !== "all") && (
              <button type="button" onClick={() => applyFilters({ q: undefined, category: undefined, paid: undefined, sort: undefined })} className="mt-5 rounded-xl bg-[#17231f] px-5 py-3 text-sm font-bold text-white">Clear filters</button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
