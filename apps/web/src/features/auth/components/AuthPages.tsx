"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import {
  loginAccount,
  queryKeys,
  registerAccount,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmailToken,
} from "../../../shared/api/queries";
import { ApiError } from "../../../shared/api/client";
import { AppButton } from "../../../shared/components/ui/AppButton";

function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-[70vh] bg-[#fbfaf5] px-5 py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-[#d9dcd4] bg-white shadow-[0_22px_70px_rgba(27,38,33,0.08)] md:grid-cols-[0.86fr_1.14fr]">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-[#17231f] p-8 text-white sm:p-10">
          <div className="absolute -right-14 -top-12 size-56 rounded-full border-[34px] border-[#f0b429]" />
          <div className="absolute -bottom-20 -left-14 size-52 rounded-full bg-[#3056d3]" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#ff654f] shadow-[0_4px_0_#b93425]"><ShieldCheck size={23} /></span>
            <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-[#f0b429]">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight tracking-[-0.04em]">{title}</h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#d0d7d2]">{description}</p>
          </div>
          <p className="relative mt-12 text-xs font-semibold text-[#aeb8b2]">Your account keeps your polls and preferences together.</p>
        </aside>
        <section className="p-6 sm:p-10 lg:p-12">{children}</section>
      </div>
    </main>
  );
}

function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-semibold ${error ? "border border-[#edc8c1] bg-[#fff1ed] text-[#ad3828]" : "border border-[#b9dfc7] bg-[#edf8f0] text-[#16784b]"}`}>{error ?? success}</p>;
}

function TextField({ label, type = "text", name, value, onChange, autoComplete, required = true, minLength }: {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#34413a]">{label}</span>
      <input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} minLength={minLength} className="h-12 w-full rounded-xl border border-[#d4d8d0] bg-[#fffefa] px-4 text-sm text-[#17231f] outline-none transition focus:border-[#3056d3] focus:ring-2 focus:ring-[#3056d3]/15" />
    </label>
  );
}

export function LoginPage({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: loginAccount,
    onSuccess: async ({ data }) => {
      queryClient.setQueryData(queryKeys.session, data.user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      router.push(redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard");
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Sign in failed. Try again."),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate({ email, password });
  }
  return (
    <AuthShell eyebrow="Welcome back" title="Good to see you again." description="Sign in to vote, manage your polls, and keep up with the results that matter to you.">
      <div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#e6efff] text-[#3056d3]"><KeyRound size={20} /></span><div><h2 className="text-xl font-extrabold">Sign in</h2><p className="text-sm text-[#78817b]">Use your verified email and password.</p></div></div>
      <form onSubmit={submit} className="space-y-5">
        <TextField label="Email address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <FormMessage error={error} />
        <AppButton type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? "Signing in…" : "Sign in"}</AppButton>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-bold"><Link href="/forgot-password" className="text-[#3056d3] hover:underline">Forgot password?</Link><Link href="/register" className="text-[#3056d3] hover:underline">Create an account</Link></div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const mutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: () => setSentTo(email),
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Account creation failed. Try again."),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate({ displayName, email, password });
  }
  if (sentTo) return <VerificationSent email={sentTo} />;
  return (
    <AuthShell eyebrow="Join the conversation" title="Make room for your voice." description="Create an account to participate in account-limited polls and manage your own polls.">
      <div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#fff0ed] text-[#ff654f]"><Mail size={20} /></span><div><h2 className="text-xl font-extrabold">Create account</h2><p className="text-sm text-[#78817b]">We’ll send a verification link to your email.</p></div></div>
      <form onSubmit={submit} className="space-y-5">
        <TextField label="Display name" name="displayName" value={displayName} onChange={setDisplayName} autoComplete="name" minLength={2} />
        <TextField label="Email address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={12} />
        <p className="-mt-3 text-xs text-[#78817b]">Use at least 12 characters.</p>
        <FormMessage error={error} />
        <AppButton type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? "Creating account…" : "Create account"}</AppButton>
      </form>
      <p className="mt-6 text-sm font-semibold text-[#69736d]">Already registered? <Link href="/login" className="text-[#3056d3] hover:underline">Sign in</Link></p>
    </AuthShell>
  );
}

function VerificationSent({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const mutation = useMutation({ mutationFn: () => resendVerification(email), onSuccess: ({ data }) => setMessage(data.message) });
  return <AuthShell eyebrow="One more step" title="Check your inbox." description={`A verification message was sent to ${email}. Follow its link before signing in.`}>
    <div className="rounded-2xl border border-[#b9dfc7] bg-[#edf8f0] p-5 text-sm leading-6 text-[#356448]">In local development, the verification link is printed in the API terminal. In a deployed environment, check your email.</div>
    <AppButton className="mt-5" variant="outline" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Sending…" : "Resend verification link"}</AppButton>
    <FormMessage success={message} />
    <p className="mt-6 text-sm font-semibold"><Link href="/login" className="text-[#3056d3] hover:underline">Return to sign in</Link></p>
  </AuthShell>;
}

export function VerifyEmailPage({ token }: { token: string }) {
  const mutation = useMutation({
    mutationFn: () => verifyEmailToken(token),
  });
  const { mutate, isPending, isSuccess, error } = mutation;
  const started = useRef(false);
  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      mutate();
    }
  }, [token, mutate]);
  return <AuthShell eyebrow="Email verification" title={isSuccess ? "You’re verified." : "Verify your email."} description={isSuccess ? "Your Tally account is ready. Sign in to continue." : "We’ll confirm your email and activate your account."}>
    <FormMessage error={error instanceof Error ? error.message : undefined} success={isSuccess ? "Your email has been verified." : undefined} />
    {!token && <FormMessage error="This verification link is missing its token." />}
    {isPending && <p className="text-sm font-semibold text-[#69736d]">Verifying your email…</p>}
    <div className="mt-6"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#3056d3]"><ArrowLeft size={16} /> Go to sign in</Link></div>
  </AuthShell>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({ mutationFn: requestPasswordReset, onError: (reason) => setError(reason instanceof Error ? reason.message : "Request failed") });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate(email);
  }
  return <AuthShell eyebrow="Account recovery" title="Reset your password." description="We’ll email a single-use link if an account matches that address.">
    <form onSubmit={submit} className="space-y-5"><TextField label="Email address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" /><FormMessage error={error} success={mutation.isSuccess ? "If that account exists, reset instructions have been sent." : undefined} /><AppButton type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? "Sending…" : "Send reset link"}</AppButton></form>
    <p className="mt-6 text-sm font-semibold"><Link href="/login" className="text-[#3056d3] hover:underline">Back to sign in</Link></p>
  </AuthShell>;
}

export function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => resetPassword({ token, password }),
    onSuccess: () => router.push("/login?password-reset=1"),
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Password reset failed"),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate();
  }
  return <AuthShell eyebrow="Account recovery" title="Choose a new password." description="Your reset link can only be used once and expires after 30 minutes.">
    {!token && <FormMessage error="This reset link is missing its token." />}
    <form onSubmit={submit} className="mt-5 space-y-5"><TextField label="New password" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={12} /><p className="-mt-3 text-xs text-[#78817b]">Use at least 12 characters.</p><FormMessage error={error} /><AppButton type="submit" disabled={!token || mutation.isPending} className="w-full">{mutation.isPending ? "Updating…" : "Update password"}</AppButton></form>
  </AuthShell>;
}
