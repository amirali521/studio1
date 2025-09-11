import SettingsClient from "@/components/settings/settings-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Settings">
        <UserProfile />
      </AppHeader>
      <SettingsClient />
    </div>
  );
}
