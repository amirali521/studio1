import BarcodeClient from "@/components/barcodes/barcode-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function BarcodesPage() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Generate Barcodes">
        <UserProfile />
      </AppHeader>
      <BarcodeClient />
    </div>
  );
}
