
import SettingsClient from "@/components/settings/settings-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Settings">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-1 sm:p-2">
        <SettingsClient />
      </main>
    </>
  );
}
