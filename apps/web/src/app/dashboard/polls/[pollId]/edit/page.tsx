import { PollEditorPage } from "../../../../../features/dashboard/components/DashboardPages";

export default async function Page({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  return <PollEditorPage pollId={pollId} />;
}
