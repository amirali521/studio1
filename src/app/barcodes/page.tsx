
import BarcodeClient from "@/components/barcodes/barcode-client";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";

export default function BarcodesPage() {
  return (
    <>
      <AppHeader title="Generate QR Codes">
        <UserProfile />
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6">
        <BarcodeClient />
      </main>
    </>
  );
}
