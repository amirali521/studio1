
"use client";

import AppHeader from "@/components/layout/app-header";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { useAuth } from "@/contexts/auth-context";
import UserProfile from "@/components/layout/user-profile";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
       <AppHeader title={`Welcome, ${user?.displayName || 'User'}`}>
        <UserProfile />
      </AppHeader>
      <DashboardClient />
    </div>
  );
}
