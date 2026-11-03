import { PollDetailPage } from "../../../features/polls/components/PollDetailPage";

export default async function Page({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  return <PollDetailPage pollId={pollId} />;
}
