import { Suspense } from "react";
import { PollsPage } from "../../features/polls/components/PollsPage";

// The discovery filters live in the URL, which makes this client component opt
// out of prerendering unless it sits behind a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<PollsPageFallback />}>
      <PollsPage />
    </Suspense>
  );
}

function PollsPageFallback() {
  return (
    <main className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="h-14 w-72 animate-pulse rounded-xl bg-[#e8e9e3]" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-[340px] animate-pulse rounded-[24px] border border-[#d9dcd4] bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
