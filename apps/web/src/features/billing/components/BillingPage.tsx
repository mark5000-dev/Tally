"use client";

import { CreditCard, ReceiptText, Wallet } from "lucide-react";
import { useBillingQuery } from "../../../shared/api/queries";
import type { PaymentIntent } from "../../../shared/api/types";

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(amountMinor / 100);
}

function IntentRow({ payment }: { payment: PaymentIntent }) {
  return <div className="grid gap-2 border-b border-[#ecece6] py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_120px_110px]"><div><p className="text-sm font-bold">{payment.purpose === "creator_poll_type" ? "Poll type charge" : "Voter payment"}</p><p className="mt-1 text-xs text-[#7b837e]">{new Date(payment.createdAt).toLocaleString()} · {payment.providerReference ?? "No provider reference"}</p></div><span className="text-sm font-extrabold">{formatMoney(payment.amountMinor, payment.currency)}</span><span className="h-fit w-fit rounded-full bg-[#fff8e4] px-3 py-1 text-xs font-extrabold capitalize text-[#765e1b]">{payment.status}</span></div>;
}

export function BillingPage() {
  const result = useBillingQuery();
  if (result.isPending) return <main className="mx-auto max-w-5xl px-5 py-16"><div className="h-80 animate-pulse rounded-[24px] bg-white" /></main>;
  if (result.isError) return <main className="mx-auto max-w-5xl px-5 py-16"><p role="alert" className="rounded-xl bg-[#fff1ed] p-5 text-sm font-semibold text-[#ad3828]">{result.error.message}</p></main>;
  const [intents, ledger] = result.data;
  return <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
    <header className="mb-8"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#3056d3]">Studio billing</p><h1 className="mt-2 font-serif text-4xl font-bold">Payments and ledger</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736d]">Review payment intents and accounting entries associated with your account.</p></header>
    <div className="mb-6 rounded-[20px] border border-[#c9d5f0] bg-[#eef3ff] p-5"><div className="flex items-start gap-3"><CreditCard size={20} className="mt-0.5 text-[#3056d3]" /><div><h2 className="font-extrabold">Payment processing is not enabled</h2><p className="mt-1 text-sm leading-6 text-[#596984]">No M-Pesa prompt, charge, payout, or refund can be initiated from Tally yet. Existing intents remain pending setup and are not payment confirmations.</p></div></div></div>
    <section className="rounded-[22px] border border-[#d9dcd4] bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#f7f6f0]"><ReceiptText size={19} /></span><div><h2 className="font-extrabold">Payment intents</h2><p className="text-xs text-[#7b837e]">Latest requests for poll charges and paid voting.</p></div></div>{intents.length ? <div className="mt-4">{intents.map((payment) => <IntentRow key={payment.id} payment={payment} />)}</div> : <p className="mt-5 text-sm text-[#7b837e]">No payment intents yet.</p>}</section>
    <section className="mt-6 rounded-[22px] border border-[#d9dcd4] bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf8f0] text-[#16784b]"><Wallet size={19} /></span><div><h2 className="font-extrabold">Ledger entries</h2><p className="text-xs text-[#7b837e]">Account postings are read-only here.</p></div></div>{ledger.length ? <div className="mt-4 divide-y divide-[#ecece6]">{ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-4"><div><p className="text-sm font-bold">{entry.entryType}</p><p className="mt-1 text-xs text-[#7b837e]">{entry.account} · {new Date(entry.createdAt).toLocaleString()}</p></div><span className="font-extrabold">{formatMoney(entry.amountMinor, entry.currency)}</span></div>)}</div> : <p className="mt-5 text-sm text-[#7b837e]">No ledger entries yet.</p>}</section>
  </main>;
}
