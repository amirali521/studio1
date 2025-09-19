
"use client";

import AppHeader from "@/components/layout/app-header";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { useAuth } from "@/contexts/auth-context";
import UserProfile from "@/components/layout/user-profile";
import AutofillDialog from "@/components/dashboard/autofill-dialog";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAutofillOpen, setIsAutofillOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Welcome, ${user?.displayName || "User"}`}>
        <UserProfile />
      </AppHeader>
      <main className="flex-1 overflow-y-auto p-1 sm:p-2">
        <DashboardClient openAutofillDialog={() => setIsAutofillOpen(true)} />
      </main>
      <AutofillDialog
        isOpen={isAutofillOpen}
        onClose={() => setIsAutofillOpen(false)}
      />
    </div>
  );
}
