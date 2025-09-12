import ReturnsClient from "@/components/returns/returns-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function ReturnsPage() {
  return (
    <div className="flex h-full flex-col">
       <AppHeader title="Process Returns">
        <UserProfile />
       </AppHeader>
      <ReturnsClient />
    </div>
  );
}
