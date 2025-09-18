
import AnalyticsClient from "@/components/analytics/analytics-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AnalyticsPage() {
  return (
    <>
      <AppHeader title="Sales Analytics">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6 bg-muted/30">
        <AnalyticsClient />
      </main>
    </>
  );
}
