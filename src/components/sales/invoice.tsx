
import { forwardRef } from "react";
import { format } from "date-fns";
import { Sale } from "@/lib/types";
import { Logo } from "@/components/logo";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { Separator } from "../ui/separator";

interface InvoiceProps {
  sale: Sale;
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ sale }, ref) => {
    const { currency } = useCurrency();
    const { saleId, date, items, total } = sale;

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black w-[302px] mx-auto">
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          <p className="text-xs">123 Main Street, Anytown, USA</p>
          <p className="text-xs">{format(new Date(date), "MM/dd/yyyy, h:mm a")}</p>
        </div>
        
        <Separator className="my-4 bg-black/20" />

        <div className="text-xs space-y-1">
          <p>Receipt ID: {saleId.slice(0, 8)}</p>
        </div>

        <Separator className="my-4 bg-black/20" />

        <div className="space-y-2 text-xs">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-2">
              <div className="col-span-3 truncate">{item.productName}</div>
              <div className="col-span-2 text-right">{formatCurrency(item.price, currency)}</div>
              <div className="col-span-5 text-gray-500 font-mono text-[10px]">
                SN: {item.serialNumber}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-black/20" />
        
        <div className="space-y-2 text-xs">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between">
                <span>Taxes</span>
                <span>{formatCurrency(0, currency)}</span>
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

    