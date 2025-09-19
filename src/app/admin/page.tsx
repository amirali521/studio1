
import AdminClient from "@/components/admin/admin-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AdminPage() {
  return (
    <>
      <AppHeader title="Admin Panel">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-1 sm:p-2">
        <AdminClient />
      </main>
    </>
  );
}
