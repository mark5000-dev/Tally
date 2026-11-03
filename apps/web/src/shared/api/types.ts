export interface ApiEnvelope<T> {
  data: T;
  pagination?: { page: number; limit: number; total: number; pages: number };
  meta?: Record<string, unknown>;
}

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "admin";
}

export type PollStatus = "draft" | "published" | "closed" | "removed";
export type VotingPolicy = "open" | "account_limited";
export type ResultVisibility = "public" | "after_vote" | "after_close";

export interface PollOption {
  id: string;
  label: string;
  position: number;
  votes: number | null;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: PollStatus;
  pollType: "community" | "featured" | string;
  creatorTypeChargeMinor: number;
  votingPolicy: VotingPolicy;
  voterPriceMinor: number | null;
  isPaid: boolean;
  price: number | null;
  resultVisibility: ResultVisibility;
  startsAt: string | null;
  endsAt: string | null;
  currency: string;
  isFeatured: boolean;
  creator: string;
  totalVotes: number | null;
  leading: string | null;
  leadPct: number | null;
  options: PollOption[];
  createdAt: string;
  updatedAt: string;
}

export interface PollTypeOption {
  id: "community" | "featured";
  label: string;
  creatorChargeMinor: number;
  currency: string;
}

export type EligibilityBlockCode =
  | "POLL_NOT_OPEN"
  | "POLL_NOT_STARTED"
  | "POLL_CLOSED"
  | "AUTHENTICATION_REQUIRED"
  | "PAYMENT_REQUIRED"
  | "ALREADY_VOTED";

export type VoteEligibility =
  | {
      eligible: true;
      pollId: string;
      pollType: string;
      votingPolicy: VotingPolicy;
      requiresPayment: boolean;
      voterPriceMinor: number | null;
      currency: string;
    }
  | { eligible: false; code: EligibilityBlockCode; message: string };

export interface SessionSummary {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface PaymentIntent {
  id: string;
  pollId: string | null;
  userId: string;
  amountMinor: number;
  currency: string;
  purpose: string;
  provider: string;
  providerReference: string | null;
  idempotencyKey: string;
  status: "created" | "pending" | "succeeded" | "failed" | "expired" | "reversed";
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  paymentId: string;
  ownerUserId: string | null;
  account: string;
  amountMinor: number;
  currency: string;
  entryType: string;
  createdAt: string;
}

export interface PollReport {
  report: {
    id: string;
    pollId: string;
    reporterId: string | null;
    reason: string;
    details: string | null;
    status: "open" | "reviewed" | "dismissed" | "actioned";
    reviewedAt: string | null;
    createdAt: string;
  };
  pollTitle: string;
  pollStatus: PollStatus;
  reporterEmail: string | null;
}

export interface AuditRecord {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
