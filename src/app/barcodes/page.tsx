import BarcodeClient from "@/components/barcodes/barcode-client";
import AppHeader from "@/components/layout/app-header";

export default function BarcodesPage() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Generate Barcodes" />
      <BarcodeClient />
    </div>
  );
}
