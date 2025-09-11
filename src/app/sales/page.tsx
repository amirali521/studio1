import SalesClient from "@/components/sales/sales-client";
import AppHeader from "@/components/layout/app-header";

export default function SalesPage() {
  return (
    <div className="flex h-full flex-col">
       <AppHeader title="Point of Sale (POS)" />
      <SalesClient />
    </div>
  );
}
