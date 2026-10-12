"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "../brand/Logo";
import { AppButton } from "../ui/AppButton";
import { logoutAccount, queryKeys, useSessionQuery } from "../../api/queries";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const logout = useMutation({
    mutationFn: logoutAccount,
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.session, null);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
    },
  });
  return (
    <header className="relative z-50 border-b border-[#dfe1da] bg-[#fbfaf5]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="Tally home" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              pathname === "/" ? "bg-[#eeeee7] text-[#17231f]" : "text-[#5d665f] hover:text-[#17231f]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/polls"
            aria-current={pathname.startsWith("/polls") ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              pathname.startsWith("/polls") ? "bg-[#eeeee7] text-[#17231f]" : "text-[#5d665f] hover:text-[#17231f]"
            }`}
          >
            Explore polls
          </Link>
          <Link href="/#how-it-works" className="rounded-lg px-4 py-2 text-sm font-semibold text-[#5d665f] transition-colors hover:text-[#17231f]">How it works</Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {session.data ? (
            <>
              <AppButton variant="ghost" onClick={() => router.push("/account")}>{session.data.displayName}</AppButton>
              <AppButton variant="outline" onClick={() => router.push("/dashboard")}>Studio</AppButton>
              {session.data.role === "admin" && <AppButton variant="ghost" onClick={() => router.push("/admin")}>Admin</AppButton>}
              <AppButton variant="ghost" onClick={() => logout.mutate()}>{logout.isPending ? "Signing out…" : "Sign out"}</AppButton>
            </>
          ) : (
            <>
              <AppButton variant="ghost" onClick={() => router.push("/login")}>Sign in</AppButton>
              <AppButton onClick={() => router.push("/register")}>Create account <ArrowRight size={16} /></AppButton>
            </>
          )}
        </div>
        <button
          className="grid size-10 place-items-center rounded-xl border border-[#d7d9d2] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-[76px] border-b border-[#dfe1da] bg-[#fbfaf5] p-5 shadow-xl md:hidden">
          <div className="flex flex-col gap-2">
            <AppButton variant="ghost" className="justify-start" onClick={() => router.push("/")}>
              Home
            </AppButton>
            <AppButton variant="ghost" className="justify-start" onClick={() => router.push("/polls")}>
              Explore polls
            </AppButton>
            {session.data ? (
              <>
                <AppButton variant="ghost" className="justify-start" onClick={() => router.push("/dashboard")}>Creator studio</AppButton>
                <AppButton className="mt-2" onClick={() => router.push("/dashboard/polls/new")}>Create a poll</AppButton>
                <AppButton variant="outline" className="mt-1" onClick={() => logout.mutate()}>Sign out</AppButton>
              </>
            ) : (
              <>
                <AppButton variant="ghost" className="justify-start" onClick={() => router.push("/login")}>Sign in</AppButton>
                <AppButton className="mt-2" onClick={() => router.push("/register")}>Create account</AppButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
