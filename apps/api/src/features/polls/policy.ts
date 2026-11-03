export type ResultVisibility = "public" | "after_vote" | "after_close";
export type PollLifecycleStatus = "draft" | "published" | "closed" | "removed";

export function canViewResults(input: {
  visibility: ResultVisibility;
  status: PollLifecycleStatus;
  viewerHasVoted: boolean;
}) {
  if (input.visibility === "public") return true;
  if (input.visibility === "after_close") return input.status === "closed";
  return input.viewerHasVoted;
}
