
import { forwardRef } from "react";
import { format } from "date-fns";
import { Sale, SaleItem } from "@/lib/types";
import { Logo } from "@/components/logo";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { Separator } from "../ui/separator";
import { useShopSettings } from "@/contexts/shop-settings-context";

interface InvoiceProps {
  sale: Sale;
}

const renderSaleItem = (item: SaleItem, currency: string) => {
    return (
        <div key={item.serialNumber}>
            <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3 truncate">{item.productName}</div>
                <div className="col-span-2 text-right">{formatCurrency(item.price, currency)}</div>
                <div className="col-span-5 text-gray-500 font-mono text-[10px]">
                    SN: {item.serialNumber}
                </div>
            </div>
            {item.discount > 0 && (
                <div className="grid grid-cols-5 gap-2 text-destructive">
                    <div className="col-span-3 pl-4 text-xs">Discount</div>
                    <div className="col-span-2 text-right text-xs">-{formatCurrency(item.discount, currency)}</div>
                </div>
            )}
        </div>
    )
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ sale }, ref) => {
    const { currency } = useCurrency();
    const { shopDetails } = useShopSettings();
    const { saleId, date, items, subtotal, tax, discount, total } = sale;

    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black w-full max-w-xs mx-auto">
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          {shopDetails.name && <p className="text-sm font-bold pt-2">{shopDetails.name}</p>}
          {shopDetails.address && <p className="text-xs whitespace-pre-wrap">{shopDetails.address}</p>}
          {shopDetails.phone && <p className="text-xs">{shopDetails.phone}</p>}
          <p className="text-xs pt-2">{format(new Date(date), "MM/dd/yyyy, h:mm a")}</p>
        </div>
        
        <Separator className="my-4 bg-black/20" />

        <div className="text-xs space-y-1">
          <p>Receipt ID: {saleId.slice(0, 8)}</p>
        </div>

        <Separator className="my-4 bg-black/20" />

        <div className="space-y-2 text-xs">
          {items.map((item) => renderSaleItem(item, currency))}
        </div>

        <Separator className="my-4 bg-black/20" />
        
        <div className="space-y-2 text-xs">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
            </div>
             <div className="flex justify-between text-destructive">
                <span>Total Discount</span>
                <span>-{formatCurrency(discount, currency)}</span>
            </div>
            <div className="flex justify-between">
                <span>Taxes</span>
                <span>{formatCurrency(tax, currency)}</span>
            </div>
        </div>

        <Separator className="my-4 border-dashed bg-black/20" />

        <div className="flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
        </div>

         <Separator className="my-4 bg-black/20" />

        <div className="text-center text-xs mt-4">
          <p>Thank you for your purchase!</p>
        </div>
      </div>
    );
  }
);
Invoice.displayName = "Invoice";
