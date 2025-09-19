
import AdminChatClient from "@/components/admin/admin-chat-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AdminChatPage() {
  return (
    <>
      <AppHeader title="Admin Chat">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-1 sm:p-2">
        <AdminChatClient />
      </main>
    </>
  );
}
