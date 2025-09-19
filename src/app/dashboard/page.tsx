
"use client";

import AppHeader from "@/components/layout/app-header";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { useAuth } from "@/contexts/auth-context";
import UserProfile from "@/components/layout/user-profile";
import AutofillDialog from "@/components/dashboard/autofill-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";


export default function DashboardPage() {
  const { user } = useAuth();
  const [isAutofillOpen, setIsAutofillOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Welcome, ${user?.displayName || "User"}`}>
        <Button variant="outline" onClick={() => setIsAutofillOpen(true)}>
          <Wand2 className="mr-2 h-4 w-4" />
          Auto-fill with AI
        </Button>
        <UserProfile />
      </AppHeader>
      <main className="flex-1 overflow-y-auto p-1 sm:p-2">
        <DashboardClient openProductDialog={() => {}} setAutofillData={() => {}} />
      </main>
      <AutofillDialog
        isOpen={isAutofillOpen}
        onClose={() => setIsAutofillOpen(false)}
      />
    </div>
  );
}
