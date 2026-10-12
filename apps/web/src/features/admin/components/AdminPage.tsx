"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSearch, ShieldAlert } from "lucide-react";
import { ApiError } from "../../../shared/api/client";
import { lookupAdminPayment, queryKeys, reviewAdminReport, useAuditQuery, useAdminReportsQuery, useSessionQuery } from "../../../shared/api/queries";
import type { PollReport } from "../../../shared/api/types";
import { AppButton } from "../../../shared/components/ui/AppButton";

function ReportCard({ report, onReviewed }: { report: PollReport; onReviewed: () => void }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (input: { status: "reviewed" | "dismissed" | "actioned"; moderation: "none" | "close" | "remove" }) => reviewAdminReport(report.report.id, { ...input, note: note || undefined }),
    onSuccess: () => { setMessage("Review saved."); onReviewed(); },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Review failed."),
  });
  return <article className="rounded-[20px] border border-[#d9dcd4] bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#fff1ed] px-3 py-1 text-xs font-bold text-[#ad3828]">{report.report.reason.replaceAll("_", " ")}</span><h3 className="mt-3 text-lg font-extrabold">{report.pollTitle}</h3><p className="mt-1 text-xs text-[#7b837e]">Reported {new Date(report.report.createdAt).toLocaleString()} · {report.reporterEmail ?? "Anonymous"}</p></div><span className="rounded-full bg-[#f2f1eb] px-3 py-1 text-xs font-bold capitalize">{report.report.status}</span></div>
    {report.report.details && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#5e6862]">{report.report.details}</p>}
    <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} placeholder="Internal review note" className="mt-4 w-full rounded-xl border border-[#d4d8d0] bg-[#fffefa] p-3 text-sm outline-none focus:border-[#3056d3]" />
    <div className="mt-3 flex flex-wrap gap-2"><AppButton variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: "dismissed", moderation: "none" })}>Dismiss</AppButton><AppButton variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: "actioned", moderation: "close" })}>Close poll</AppButton><AppButton disabled={mutation.isPending} onClick={() => mutation.mutate({ status: "actioned", moderation: "remove" })}>Remove poll</AppButton></div>
    {message && <p role="status" className="mt-3 text-sm font-semibold text-[#53605a]">{message}</p>}
  </article>;
}

export function AdminPage() {
  const session = useSessionQuery();
  const isAdmin = session.data?.role === "admin";
  const reports = useAdminReportsQuery(isAdmin);
  const audit = useAuditQuery(isAdmin);
  const client = useQueryClient();
  const [paymentId, setPaymentId] = useState("");
  const lookup = useMutation({ mutationFn: lookupAdminPayment });
  if (session.isPending) return <main className="mx-auto max-w-6xl px-5 py-16"><div className="h-72 animate-pulse rounded-[24px] bg-white" /></main>;
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="font-serif text-4xl font-bold">Administrator access required</h1><p className="mt-3 text-[#69736d]">This workspace is limited to accounts with the administrator role.</p></main>;
  return <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
    <header className="mb-8"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ad3828]">Restricted workspace</p><h1 className="mt-2 font-serif text-4xl font-bold">Moderation and operations</h1><p className="mt-2 text-sm text-[#69736d]">Review reports, moderate polls, inspect payment records, and audit privileged actions.</p></header>
    <section><div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff1ed] text-[#ad3828]"><ShieldAlert size={20} /></span><div><h2 className="font-extrabold">Open reports</h2><p className="text-xs text-[#7b837e]">Moderation actions are recorded in the audit log.</p></div></div>
      {reports.isPending ? <div className="h-40 animate-pulse rounded-[20px] bg-white" /> : reports.isError ? <p role="alert" className="rounded-xl bg-[#fff1ed] p-4 text-sm text-[#ad3828]">{reports.error.message}</p> : reports.data.length ? <div className="grid gap-4">{reports.data.map((report) => <ReportCard key={report.report.id} report={report} onReviewed={() => { void client.invalidateQueries({ queryKey: queryKeys.reports }); void client.invalidateQueries({ queryKey: queryKeys.audit }); }} />)}</div> : <p className="rounded-[20px] border border-[#d9dcd4] bg-white p-5 text-sm text-[#7b837e]">No open reports.</p>}
    </section>
    <section className="mt-9 rounded-[22px] border border-[#d9dcd4] bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eef3ff] text-[#3056d3]"><FileSearch size={19} /></span><div><h2 className="font-extrabold">Payment lookup</h2><p className="text-xs text-[#7b837e]">Read-only. Payment provider processing is not enabled.</p></div></div><form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); lookup.mutate(paymentId); }}><input value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="Payment UUID" className="h-11 flex-1 rounded-xl border border-[#d4d8d0] px-4 text-sm outline-none focus:border-[#3056d3]" /><AppButton type="submit" disabled={lookup.isPending || !paymentId}>{lookup.isPending ? "Searching…" : "Find payment"}</AppButton></form>{lookup.isError && <p role="alert" className="mt-3 text-sm text-[#ad3828]">{lookup.error.message}</p>}{lookup.data && <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-[#f7f6f0] p-4 text-xs">{JSON.stringify(lookup.data.data, null, 2)}</pre>}</section>
    <section className="mt-9"><div className="mb-4"><h2 className="font-extrabold">Recent audit log</h2><p className="text-xs text-[#7b837e]">Privileged actions and poll/report state changes.</p></div>{audit.isPending ? <div className="h-32 animate-pulse rounded-[20px] bg-white" /> : audit.isError ? <p role="alert" className="text-sm text-[#ad3828]">{audit.error.message}</p> : <div className="overflow-hidden rounded-[20px] border border-[#d9dcd4] bg-white">{audit.data.map((item) => <div key={item.id} className="grid gap-1 border-b border-[#ecece6] px-5 py-3 text-sm last:border-0 sm:grid-cols-[1fr_1fr_160px]"><span className="font-bold">{item.action}</span><span className="text-[#69736d]">{item.entityType} · {item.entityId}</span><time className="text-xs text-[#7b837e]">{new Date(item.createdAt).toLocaleString()}</time></div>)}</div>}</section>
  </main>;
}
