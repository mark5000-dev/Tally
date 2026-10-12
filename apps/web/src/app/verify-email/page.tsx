import { VerifyEmailPage } from "../../features/auth/components/AuthPages";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <VerifyEmailPage token={token} />;
}
