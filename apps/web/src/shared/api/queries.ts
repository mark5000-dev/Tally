import { useQuery } from "@tanstack/react-query";
import { apiRequest, jsonBody } from "./client";
import type {
  ApiEnvelope,
  ApiUser,
  AuditRecord,
  LedgerEntry,
  PaymentIntent,
  Poll,
  PollTypeOption,
  PollReport,
  SessionSummary,
  VoteEligibility,
} from "./types";

export const queryKeys = {
  session: ["session"] as const,
  polls: (filters: string) => ["polls", filters] as const,
  poll: (id: string) => ["poll", id] as const,
  myPolls: (filters: string) => ["my-polls", filters] as const,
  analytics: ["creator-analytics"] as const,
  billing: ["billing"] as const,
  reports: ["admin-reports"] as const,
  audit: ["admin-audit"] as const,
};

export interface PollFilters {
  q?: string;
  category?: string;
  pollType?: string;
  paid?: "true" | "false";
  sort?: "recent" | "ending_soon";
  status?: "published" | "closed";
  page?: number;
  limit?: number;
}

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `?${params.toString()}` : "";
}

export async function getSession() {
  const response = await apiRequest<ApiEnvelope<ApiUser>>("/auth/me");
  return response.data;
}

export async function getPolls(filters: PollFilters = {}) {
  const response = await apiRequest<ApiEnvelope<Poll[]>>(
    `/polls${queryString({
      q: filters.q,
      category: filters.category,
      pollType: filters.pollType,
      paid: filters.paid,
      sort: filters.sort,
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
    })}`,
  );
  return { polls: response.data, pagination: response.pagination };
}

export async function getPoll(id: string) {
  const response = await apiRequest<ApiEnvelope<Poll>>(`/polls/${id}`);
  return response.data;
}

export async function getPollTypes() {
  const response = await apiRequest<ApiEnvelope<PollTypeOption[]>>("/polls/types");
  return response.data;
}

export async function getMyPolls(filters: { page?: number; limit?: number; status?: string } = {}) {
  const response = await apiRequest<ApiEnvelope<Poll[]>>(
    `/polls/mine${queryString(filters)}`,
  );
  return { polls: response.data, pagination: response.pagination };
}

export async function getCreatorAnalytics() {
  const response = await apiRequest<ApiEnvelope<{
    totalPolls: number;
    draftPolls: number;
    livePolls: number;
    closedPolls: number;
    totalVotes: number;
    polls: Poll[];
  }>>("/polls/mine/analytics");
  return response.data;
}

export async function registerAccount(input: { email: string; password: string; displayName: string }) {
  return apiRequest<ApiEnvelope<{ user: ApiUser; verificationRequired: boolean }>>("/auth/register", {
    method: "POST",
    body: jsonBody(input),
  });
}

export async function loginAccount(input: { email: string; password: string }) {
  return apiRequest<ApiEnvelope<{ user: ApiUser; expiresAt: string }>>("/auth/login", {
    method: "POST",
    body: jsonBody(input),
  });
}

export async function logoutAccount() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}

export async function verifyEmailToken(token: string) {
  return apiRequest<ApiEnvelope<{ verified: boolean }>>("/auth/verify-email", {
    method: "POST",
    body: jsonBody({ token }),
  });
}

export async function resendVerification(email: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>("/auth/verification/resend", {
    method: "POST",
    body: jsonBody({ email }),
  });
}

export async function requestPasswordReset(email: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>("/auth/password/forgot", {
    method: "POST",
    body: jsonBody({ email }),
  });
}

export async function resetPassword(input: { token: string; password: string }) {
  return apiRequest<void>("/auth/password/reset", {
    method: "POST",
    body: jsonBody(input),
  });
}

export async function createPoll(input: {
  title: string;
  description?: string | null;
  category: string;
  options: string[];
  pollType: "community" | "featured";
  votingPolicy: "open" | "account_limited";
  voterPriceMinor: number | null;
  resultVisibility: "public" | "after_vote" | "after_close";
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  const response = await apiRequest<ApiEnvelope<Poll>>("/polls", {
    method: "POST",
    body: jsonBody(input),
  });
  return response.data;
}

export async function updatePoll(id: string, input: Partial<{
  title: string;
  description: string | null;
  category: string;
  options: string[];
  votingPolicy: "open" | "account_limited";
  voterPriceMinor: number | null;
  resultVisibility: "public" | "after_vote" | "after_close";
  startsAt: string | null;
  endsAt: string | null;
}>) {
  const response = await apiRequest<ApiEnvelope<Poll>>(`/polls/${id}`, {
    method: "PATCH",
    body: jsonBody(input),
  });
  return response.data;
}

export async function publishPoll(id: string) {
  return apiRequest<ApiEnvelope<{ status: string }>>(`/polls/${id}/publish`, { method: "POST" });
}

export async function closePoll(id: string) {
  return apiRequest<void>(`/polls/${id}/close`, { method: "POST" });
}

export async function castVote(pollId: string, optionId: string, idempotencyKey: string) {
  const response = await apiRequest<ApiEnvelope<Poll & { vote: { id: string; optionId: string }; replayed: boolean }>>(`/polls/${pollId}/votes`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: jsonBody({ optionId }),
  });
  return response.data;
}

export async function submitPollReport(pollId: string, input: { reason: string; details?: string }) {
  return apiRequest<ApiEnvelope<{ id: string; status: string }>>(`/polls/${pollId}/reports`, {
    method: "POST",
    body: jsonBody(input),
  });
}

export async function getSessions() {
  const response = await apiRequest<ApiEnvelope<SessionSummary[]>>("/auth/sessions");
  return response.data;
}

export async function getMyVote(pollId: string) {
  const response = await apiRequest<ApiEnvelope<{ id: string; optionId: string } | null>>(
    `/polls/${pollId}/votes/me`,
  );
  return response.data;
}

export async function getVoteEligibility(pollId: string) {
  const response = await apiRequest<ApiEnvelope<VoteEligibility>>(
    `/polls/${pollId}/votes/eligibility`,
  );
  return response.data;
}

export async function revokeSession(id: string) {
  return apiRequest<void>(`/auth/sessions/${id}`, { method: "DELETE" });
}

export async function getPaymentIntents() {
  const response = await apiRequest<ApiEnvelope<PaymentIntent[]>>("/billing/intents");
  return response.data;
}

export async function getLedger() {
  const response = await apiRequest<ApiEnvelope<LedgerEntry[]>>("/billing/ledger");
  return response.data;
}

export async function createPaymentIntent(input: { pollId: string; purpose: "creator_poll_type" | "voter_poll" }) {
  const response = await apiRequest<ApiEnvelope<PaymentIntent>>("/billing/intents", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: jsonBody(input),
  });
  return response;
}

export async function getAdminReports(status = "open") {
  const response = await apiRequest<ApiEnvelope<PollReport[]>>(`/admin/reports${queryString({ status })}`);
  return response.data;
}

export async function reviewAdminReport(id: string, input: { status: "reviewed" | "dismissed" | "actioned"; moderation: "none" | "close" | "remove"; note?: string }) {
  return apiRequest<void>(`/admin/reports/${id}`, { method: "PATCH", body: jsonBody(input) });
}

export async function moderatePoll(id: string, input: { action: "close" | "remove" | "restore"; reason: string }) {
  return apiRequest<ApiEnvelope<{ id: string; status: string }>>(`/admin/polls/${id}/moderation`, {
    method: "POST",
    body: jsonBody(input),
  });
}

export async function lookupAdminPayment(id: string) {
  return apiRequest<ApiEnvelope<unknown>>(`/admin/payments/${id}`);
}

export async function getAuditLog() {
  const response = await apiRequest<ApiEnvelope<AuditRecord[]>>("/admin/audit");
  return response.data;
}

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    retry: false,
    staleTime: 30_000,
  });
}

export function usePollsQuery(filters: PollFilters = {}) {
  const stableFilters = queryString({
    q: filters.q,
    category: filters.category,
    pollType: filters.pollType,
    paid: filters.paid,
    sort: filters.sort,
    status: filters.status,
    page: filters.page,
    limit: filters.limit,
  });
  return useQuery({
    queryKey: queryKeys.polls(stableFilters),
    queryFn: () => getPolls(filters),
    staleTime: 15_000,
  });
}

export function usePollQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.poll(id),
    queryFn: () => getPoll(id),
    enabled: Boolean(id),
  });
}

export function useVoteEligibilityQuery(pollId: string, enabled = true) {
  return useQuery({
    queryKey: ["vote-eligibility", pollId],
    queryFn: () => getVoteEligibility(pollId),
    enabled: Boolean(pollId) && enabled,
    retry: false,
  });
}

export function usePollTypesQuery() {
  return useQuery({ queryKey: ["poll-types"], queryFn: getPollTypes, staleTime: 5 * 60_000 });
}

export function useMyPollsQuery(filters: { page?: number; limit?: number; status?: string } = {}) {
  const stableFilters = queryString(filters);
  return useQuery({
    queryKey: queryKeys.myPolls(stableFilters),
    queryFn: () => getMyPolls(filters),
  });
}

export function useCreatorAnalyticsQuery() {
  return useQuery({ queryKey: queryKeys.analytics, queryFn: getCreatorAnalytics });
}

export function useSessionsQuery(enabled = true) {
  return useQuery({ queryKey: ["sessions"], queryFn: getSessions, enabled });
}

export function useBillingQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing,
    queryFn: async () => Promise.all([getPaymentIntents(), getLedger()]),
    enabled,
  });
}

export function useAdminReportsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => getAdminReports(),
    enabled,
  });
}

export function useAuditQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.audit, queryFn: getAuditLog, enabled });
}
