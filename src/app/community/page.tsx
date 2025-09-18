
import CommunityClient from "@/components/community/community-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function CommunityPage() {
  return (
    <>
      <AppHeader title="Community Chat">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6">
        <CommunityClient />
      </main>
    </>
  );
}
