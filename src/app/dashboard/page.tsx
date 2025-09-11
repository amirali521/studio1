import AppHeader from "@/components/layout/app-header";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardClient />
    </div>
  );
}
