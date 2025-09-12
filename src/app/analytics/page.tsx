
import AnalyticsClient from "@/components/analytics/analytics-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
       <AppHeader title="Sales Analytics">
        <UserProfile />
       </AppHeader>
      <AnalyticsClient />
    </div>
  );
}
