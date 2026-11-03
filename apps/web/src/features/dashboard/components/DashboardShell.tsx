"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CreditCard, LayoutDashboard, ListChecks, LockKeyhole, Plus, Settings2 } from "lucide-react";
import { useSessionQuery } from "../../../shared/api/queries";
import { AppButton } from "../../../shared/components/ui/AppButton";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/polls", label: "My polls", icon: ListChecks },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/account", label: "Account", icon: Settings2 },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = useSessionQuery();
  const pathname = usePathname();
  const router = useRouter();
  if (session.isPending) return <main className="mx-auto max-w-7xl px-5 py-16"><div className="h-64 animate-pulse rounded-[24px] bg-white" /></main>;
  if (session.isError || !session.data) return <main className="mx-auto max-w-xl px-5 py-20 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e6efff] text-[#3056d3]"><LockKeyhole /></span><h1 className="mt-5 font-serif text-4xl font-bold">Sign in to your studio</h1><p className="mt-3 text-[#69736d]">Your polls, results, and account tools are available after sign in.</p><AppButton className="mt-6" onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}>Sign in</AppButton></main>;

  return (
    <div className="min-h-[70vh] bg-[#fbfaf5]">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8 lg:py-10">
        <aside className="h-fit rounded-[24px] border border-[#d9dcd4] bg-white p-4">
          <div className="border-b border-[#ecece6] px-3 pb-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ff654f]">Creator studio</p>
            <p className="mt-2 truncate text-sm font-extrabold">{session.data.displayName}</p>
          </div>
          <nav className="mt-3 grid gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
              return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${active ? "bg-[#eef3ff] text-[#3056d3]" : "text-[#5e6862] hover:bg-[#f7f6f0]"}`}><Icon size={17} />{label}</Link>;
            })}
            {session.data.role === "admin" && <Link href="/admin" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${pathname.startsWith("/admin") ? "bg-[#fff1ed] text-[#ad3828]" : "text-[#5e6862] hover:bg-[#f7f6f0]"}`}><Settings2 size={17} />Admin tools</Link>}
          </nav>
          <AppButton className="mt-4 w-full" onClick={() => router.push("/dashboard/polls/new")}><Plus size={16} /> New poll</AppButton>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
