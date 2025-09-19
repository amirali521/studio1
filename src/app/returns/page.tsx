
import ReturnsClient from "@/components/returns/returns-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function ReturnsPage() {
  return (
    <>
      <AppHeader title="Process Returns">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-1 sm:p-2">
        <ReturnsClient />
      </main>
    </>
  );
}
