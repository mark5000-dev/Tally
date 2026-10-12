"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { revokeSession, useSessionQuery, useSessionsQuery } from "../../../shared/api/queries";
import { AppButton } from "../../../shared/components/ui/AppButton";

export function AccountPage() {
  const session = useSessionQuery();
  const sessions = useSessionsQuery(Boolean(session.data));
  const queryClient = useQueryClient();
  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  if (session.isPending || sessions.isPending) return <main className="mx-auto max-w-3xl px-5 py-16"><div className="h-72 animate-pulse rounded-[24px] bg-white" /></main>;
  if (session.isError || !session.data) return <main className="mx-auto max-w-3xl px-5 py-16 text-center"><h1 className="font-serif text-3xl font-bold">Sign in to view account settings</h1></main>;

  return <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
    <header className="mb-8"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ff654f]">Account</p><h1 className="mt-2 font-serif text-4xl font-bold">Your profile and sessions</h1><p className="mt-2 text-sm text-[#69736d]">Review the identity and devices currently signed in.</p></header>
    <section className="rounded-[22px] border border-[#d9dcd4] bg-white p-6">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#edf8f0] text-[#16784b]"><ShieldCheck size={20} /></span><div><h2 className="font-extrabold">Profile</h2><p className="text-sm text-[#69736d]">{session.data.email}</p></div></div>
      <dl className="mt-6 grid gap-4 border-t border-[#ecece6] pt-5 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-[#7b837e]">Display name</dt><dd className="mt-1 font-bold">{session.data.displayName}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[#7b837e]">Access</dt><dd className="mt-1 font-bold capitalize">{session.data.role}</dd></div></dl>
    </section>
    <section className="mt-7 rounded-[22px] border border-[#d9dcd4] bg-white p-6">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#eef3ff] text-[#3056d3]"><MonitorSmartphone size={20} /></span><div><h2 className="font-extrabold">Active sessions</h2><p className="text-sm text-[#69736d]">Revoke any session you no longer recognize.</p></div></div>
      {sessions.isError ? <p role="alert" className="mt-5 text-sm text-[#ad3828]">{sessions.error.message}</p> : sessions.data?.length ? <div className="mt-5 divide-y divide-[#ecece6]">{sessions.data.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">{item.userAgent ?? "Unknown browser"}</p><p className="mt-1 text-xs text-[#7b837e]">Last active {new Date(item.lastUsedAt).toLocaleString()} · Expires {new Date(item.expiresAt).toLocaleDateString()}</p></div><AppButton variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(item.id)}>Revoke session</AppButton></div>)}</div> : <p className="mt-5 text-sm text-[#7b837e]">No active sessions found.</p>}
      {revoke.isError && <p role="alert" className="mt-3 text-sm text-[#ad3828]">{revoke.error.message}</p>}
    </section>
  </main>;
}
