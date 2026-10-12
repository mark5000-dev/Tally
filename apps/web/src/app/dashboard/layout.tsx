import { DashboardShell } from "../../features/dashboard/components/DashboardShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
