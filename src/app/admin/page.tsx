
import AdminClient from "@/components/admin/admin-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AdminPage() {
  return (
    <div className="flex h-full flex-col">
       <AppHeader title="Admin Panel">
        <UserProfile />
       </AppHeader>
      <AdminClient />
    </div>
  );
}
