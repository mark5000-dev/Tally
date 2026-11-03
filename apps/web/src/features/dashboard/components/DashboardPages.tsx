"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Clock3, Plus, Users, Wallet } from "lucide-react";
import { ApiError } from "../../../shared/api/client";
import { closePoll, createPoll, publishPoll, queryKeys, updatePoll, useCreatorAnalyticsQuery, useMyPollsQuery, usePollQuery, usePollTypesQuery } from "../../../shared/api/queries";
import type { Poll, PollStatus } from "../../../shared/api/types";
import { AppButton, buttonClasses } from "../../../shared/components/ui/AppButton";

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ff654f]">{eyebrow}</p><h1 className="mt-2 font-serif text-4xl font-bold tracking-[-0.04em] text-[#17231f]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736d]">{description}</p></div>{action}</header>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) {
  return <div className="rounded-[20px] border border-[#d9dcd4] bg-white p-5"><span className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-[#7b837e]">{label}<Icon size={17} className="text-[#3056d3]" /></span><p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p></div>;
}

export function DashboardHomePage() {
  const data = useCreatorAnalyticsQuery();
  const router = useRouter();
  return <>
    <PageHeader eyebrow="Your workspace" title="Creator overview" description="Track your polls and participation from one place." action={<AppButton onClick={() => router.push("/dashboard/polls/new")}><Plus size={16} />Create poll</AppButton>} />
    {data.isPending ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white" />)}</div> : data.isError ? <ErrorPanel message={data.error.message} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="All polls" value={data.data.totalPolls} icon={BarChart3} /><Stat label="Live now" value={data.data.livePolls} icon={Clock3} /><Stat label="Total votes" value={data.data.totalVotes.toLocaleString()} icon={Users} /><Stat label="Drafts" value={data.data.draftPolls} icon={Wallet} /></div>
      <section className="mt-9"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#3056d3]">Recent activity</p><h2 className="mt-1 font-serif text-2xl font-bold">Your latest polls</h2></div><Link href="/dashboard/polls" className="text-sm font-extrabold text-[#3056d3]">View all <ArrowRight size={14} className="inline" /></Link></div>
        {data.data.polls.length ? <div className="overflow-hidden rounded-[22px] border border-[#d9dcd4] bg-white">{data.data.polls.slice(0, 5).map((poll) => <Link key={poll.id} href={poll.status === "draft" ? `/dashboard/polls/${poll.id}/edit` : `/polls/${poll.id}`} className="grid grid-cols-[minmax(0,1fr)_90px_90px] gap-3 border-b border-[#ecece6] px-5 py-4 text-sm last:border-0 hover:bg-[#fbfaf5]"><span className="truncate font-bold">{poll.title}</span><span className="capitalize text-[#69736d]">{poll.status}</span><span className="text-right font-extrabold">{poll.totalVotes ?? "Hidden"} votes</span></Link>)}</div> : <EmptyPanel title="Start with a question" text="Create a poll to collect responses and track results here." action={<AppButton onClick={() => router.push("/dashboard/polls/new")}>Create your first poll</AppButton>} />}
      </section>
    </>}
  </>;
}

export function MyPollsPage() {
  const [status, setStatus] = useState<"all" | PollStatus>("all");
  const result = useMyPollsQuery({ page: 1, limit: 50, status: status === "all" ? undefined : status });
  return <>
    <PageHeader eyebrow="Creator studio" title="My polls" description="Manage drafts, publish eligible polls, and review current results." action={<Link href="/dashboard/polls/new" className={buttonClasses()}><Plus size={16} />Create poll</Link>} />
    <div className="mb-6 flex flex-wrap gap-2">{(["all", "draft", "published", "closed"] as const).map((item) => <button key={item} type="button" onClick={() => setStatus(item)} aria-pressed={status === item} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${status === item ? "bg-[#17231f] text-white" : "border border-[#d9dcd4] bg-white text-[#5e6862]"}`}>{item === "published" ? "Live" : item}</button>)}</div>
    {result.isPending ? <LoadingRows /> : result.isError ? <ErrorPanel message={result.error.message} /> : result.data.polls.length ? <div className="grid gap-5 md:grid-cols-2">{result.data.polls.map((poll) => <CreatorPollCard key={poll.id} poll={poll} />)}</div> : <EmptyPanel title="Nothing in this view" text="Create a draft poll, then publish it when its settings are ready." />}
  </>;
}

function CreatorPollCard({ poll }: { poll: Poll }) {
  const client = useQueryClient();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const publish = useMutation({ mutationFn: () => publishPoll(poll.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["my-polls"] }); await client.invalidateQueries({ queryKey: queryKeys.analytics }); setMessage("Poll published."); }, onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not publish this poll.") });
  const close = useMutation({ mutationFn: () => closePoll(poll.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["my-polls"] }); await client.invalidateQueries({ queryKey: queryKeys.analytics }); }, onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not close this poll.") });
  return <div className="rounded-[22px] border border-[#d9dcd4] bg-white p-5">
    <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-[#f2f1eb] px-3 py-1 text-xs font-bold text-[#53605a]">{poll.category}</span><h2 className="mt-4 text-lg font-extrabold leading-snug">{poll.title}</h2></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold capitalize ${poll.status === "published" ? "bg-[#edf8f0] text-[#16784b]" : poll.status === "draft" ? "bg-[#fff8e4] text-[#765e1b]" : "bg-[#f2f1eb] text-[#657069]"}`}>{poll.status}</span></div>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#7b837e]"><span className="flex items-center gap-1"><Users size={14} />{poll.totalVotes?.toLocaleString() ?? "Hidden"} votes</span><span>{poll.options.length} choices</span><span>{poll.votingPolicy === "account_limited" ? "Account-limited" : "Open voting"}</span></div>
    {poll.status === "draft" && poll.creatorTypeChargeMinor > 0 && <p className="mt-4 rounded-xl bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#40537f]">Publishing requires {new Intl.NumberFormat("en-KE", { style: "currency", currency: poll.currency }).format(poll.creatorTypeChargeMinor / 100)}. Payment processing is not available yet.</p>}
    {message && <p role="status" className="mt-3 text-sm font-semibold text-[#ad3828]">{message}</p>}
    <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ecece6] pt-4">
      <AppButton variant="outline" onClick={() => router.push(`/polls/${poll.id}`)}>View poll</AppButton>
      {poll.status === "draft" && <><AppButton variant="ghost" onClick={() => router.push(`/dashboard/polls/${poll.id}/edit`)}>Edit draft</AppButton><AppButton disabled={publish.isPending || poll.creatorTypeChargeMinor > 0} onClick={() => publish.mutate()}>{publish.isPending ? "Publishing…" : "Publish"}</AppButton></>}
      {poll.status === "published" && <AppButton variant="outline" disabled={close.isPending} onClick={() => close.mutate()}>{close.isPending ? "Closing…" : "Close poll"}</AppButton>}
    </div>
  </div>;
}

export function PollEditorPage({ pollId }: { pollId?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const existing = usePollQuery(pollId ?? "");
  const pollTypes = usePollTypesQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Community");
  const [options, setOptions] = useState("Yes\nNo");
  const [pollType, setPollType] = useState<"community" | "featured">("community");
  const [votingPolicy, setVotingPolicy] = useState<"open" | "account_limited">("open");
  const [resultVisibility, setResultVisibility] = useState<"public" | "after_vote" | "after_close">("public");
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!existing.data || initialized) return;
    setTitle(existing.data.title);
    setDescription(existing.data.description ?? "");
    setCategory(existing.data.category);
    setOptions(existing.data.options.map((option) => option.label).join("\n"));
    setPollType(existing.data.pollType === "featured" ? "featured" : "community");
    setVotingPolicy(existing.data.votingPolicy);
    setResultVisibility(existing.data.resultVisibility);
    setPaid(existing.data.isPaid);
    setPrice(existing.data.price === null ? "" : String(existing.data.price / 100));
    setStartsAt(existing.data.startsAt ? existing.data.startsAt.slice(0, 16) : "");
    setEndsAt(existing.data.endsAt ? existing.data.endsAt.slice(0, 16) : "");
    setInitialized(true);
  }, [existing.data, initialized]);
  const payload = () => ({
    title,
    // Send null rather than undefined so clearing the description actually persists.
    description: description.trim() ? description.trim() : null,
    category,
    options: options.split("\n").map((option) => option.trim()).filter(Boolean),
    votingPolicy,
    voterPriceMinor: paid ? Math.round(Number(price) * 100) : null,
    resultVisibility,
    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
  });
  const mutation = useMutation({
    // pollType is immutable after creation, so it is only sent on create.
    mutationFn: () => pollId ? updatePoll(pollId, payload()) : createPoll({ ...payload(), pollType }),
    onSuccess: async (poll) => {
      await client.invalidateQueries({ queryKey: ["my-polls"] });
      await client.invalidateQueries({ queryKey: queryKeys.analytics });
      router.push(`/dashboard/polls/${poll.id}/edit`);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not save this poll."),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate();
  }
  if (pollId && existing.isPending) return <LoadingRows />;
  if (pollId && existing.isError) return <ErrorPanel message={existing.error.message} />;
  const featuredCharge = pollTypes.data?.find((type) => type.id === "featured")?.creatorChargeMinor ?? 0;
  // Only drafts are editable; the API rejects changes to published or closed polls.
  const locked = Boolean(existing.data && existing.data.status !== "draft");

  return <>
    <PageHeader eyebrow="Poll builder" title={pollId ? "Edit poll draft" : "Create a poll"} description="Set the question, choices, eligibility, and result visibility before publishing." />
    {locked && <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[#ead9a9] bg-[#fff8e4] p-4 text-sm text-[#765e1b]"><span>This poll is <strong>{existing.data?.status}</strong> and can no longer be edited, so its settings are read-only.</span><Link href="/dashboard/polls" className="font-extrabold underline">Back to my polls</Link></p>}
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <fieldset disabled={locked} className="space-y-5 rounded-[24px] border border-[#d9dcd4] bg-white p-5 sm:p-7">
        <Field label="Question"><input required minLength={8} maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What would you like to ask?" className="form-input" /></Field>
        <Field label="Description"><textarea maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Add helpful context (optional)" className="form-input resize-y" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Category"><input required minLength={2} maxLength={50} value={category} onChange={(event) => setCategory(event.target.value)} className="form-input" /></Field><Field label="Poll format" hint={pollId ? "The poll format is fixed once a poll is created." : undefined}><select value={pollType} disabled={Boolean(pollId)} onChange={(event) => setPollType(event.target.value as typeof pollType)} className="form-input">{(pollTypes.data ?? [{ id: "community" as const, label: "Community", creatorChargeMinor: 0, currency: "KES" }, { id: "featured" as const, label: "Featured", creatorChargeMinor: 10000, currency: "KES" }]).map((type) => <option key={type.id} value={type.id}>{type.label}{type.creatorChargeMinor > 0 ? ` · ${new Intl.NumberFormat("en-KE", { style: "currency", currency: type.currency }).format(type.creatorChargeMinor / 100)}` : ""}</option>)}</select></Field></div>
        <Field label="Answer choices" hint="Enter one option per line. Use at least two."><textarea required value={options} onChange={(event) => setOptions(event.target.value)} rows={5} className="form-input resize-y" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Voting eligibility"><select value={votingPolicy} onChange={(event) => setVotingPolicy(event.target.value as typeof votingPolicy)} className="form-input"><option value="open">Open voting</option><option value="account_limited">One vote per account</option></select></Field><Field label="Results visibility"><select value={resultVisibility} onChange={(event) => setResultVisibility(event.target.value as typeof resultVisibility)} className="form-input"><option value="public">Always public</option><option value="after_vote">After voter submits</option><option value="after_close">After poll closes</option></select></Field></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Starts at"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="form-input" /></Field><Field label="Ends at"><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="form-input" /></Field></div>
        <div className="rounded-2xl border border-[#d9dcd4] bg-[#fbfaf5] p-4"><label className="flex items-start gap-3"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} className="mt-1 size-4 accent-[#3056d3]" /><span><span className="block text-sm font-extrabold">Charge voters to participate</span><span className="mt-1 block text-xs leading-5 text-[#69736d]">Payment processing is not active. Paid polls can be saved as drafts but cannot accept votes yet.</span></span></label>{paid && <div className="mt-4 max-w-xs"><Field label="Vote price (KSh)"><input type="number" min="1" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className="form-input" /></Field></div>}</div>
        {error && <p role="alert" className="rounded-xl border border-[#edc8c1] bg-[#fff1ed] p-4 text-sm font-semibold text-[#ad3828]">{error}</p>}
        <div className="flex flex-wrap gap-3"><AppButton type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save draft"}</AppButton><AppButton variant="outline" onClick={() => router.push("/dashboard/polls")}>Cancel</AppButton></div>
      </fieldset>
      <aside className="h-fit rounded-[22px] border border-[#c9d5f0] bg-[#eef3ff] p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#3056d3]">Before you publish</p><h2 className="mt-2 text-lg font-extrabold">Clear choices, useful results.</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-[#596984]"><li>Polls need at least two unique options.</li><li>Account-limited polls require a verified account to vote.</li><li>Featured poll type has a fixed creator charge of {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(featuredCharge / 100)}; payment is not available yet.</li><li>Voter-set prices remain informational until M-Pesa is integrated.</li></ul></aside>
    </form>
  </>;
}

export function AnalyticsPage() {
  const result = useCreatorAnalyticsQuery();
  return <>
    <PageHeader eyebrow="Creator studio" title="Poll analytics" description="Aggregate participation across your polls. Individual voter identities and choices are not shown here." />
    {result.isPending ? <LoadingRows /> : result.isError ? <ErrorPanel message={result.error.message} /> : <>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total votes" value={result.data.totalVotes.toLocaleString()} icon={Users} /><Stat label="Live polls" value={result.data.livePolls} icon={BarChart3} /><Stat label="Closed polls" value={result.data.closedPolls} icon={Clock3} /></div>
      <div className="mt-8 overflow-hidden rounded-[22px] border border-[#d9dcd4] bg-white"><div className="grid grid-cols-[minmax(0,1fr)_100px_100px] gap-3 border-b border-[#ecece6] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-[#7b837e]"><span>Poll</span><span>Status</span><span className="text-right">Votes</span></div>{result.data.polls.map((poll) => <Link key={poll.id} href={`/dashboard/polls/${poll.id}/edit`} className="grid grid-cols-[minmax(0,1fr)_100px_100px] gap-3 border-b border-[#f0f0eb] px-5 py-4 text-sm last:border-0 hover:bg-[#fbfaf5]"><span className="truncate font-bold">{poll.title}</span><span className="capitalize text-[#69736d]">{poll.status}</span><span className="text-right font-extrabold">{poll.totalVotes ?? "Hidden"}</span></Link>)}</div>
    </>}
  </>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#34413a]">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-[#7b837e]">{hint}</span>}</label>;
}

function EmptyPanel({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="rounded-[22px] border border-dashed border-[#cfd2cc] bg-white p-10 text-center"><h2 className="font-serif text-2xl font-bold">{title}</h2><p className="mt-2 text-sm text-[#727a75]">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function ErrorPanel({ message }: { message: string }) {
  return <div role="alert" className="rounded-[22px] border border-[#edc8c1] bg-[#fff1ed] p-6 text-sm font-semibold text-[#ad3828]">{message}</div>;
}

function LoadingRows() {
  return <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-[22px] bg-white" />)}</div>;
}
