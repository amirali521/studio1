
import AdminChatClient from "@/components/admin/admin-chat-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function AdminChatPage() {
  return (
    <div className="flex h-full flex-col">
       <AppHeader title="Admin Chat">
        <UserProfile />
       </AppHeader>
      <AdminChatClient />
    </div>
  );
}
