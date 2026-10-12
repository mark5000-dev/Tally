import { LoginPage } from "../../features/auth/components/AuthPages";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  return <LoginPage redirectTo={next} />;
}
