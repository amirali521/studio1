
import SalesClient from "@/components/sales/sales-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function SalesPage() {
  return (
    <>
      <AppHeader title="Point of Sale (POS)">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6">
        <SalesClient />
      </main>
    </>
  );
}
