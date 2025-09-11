
"use client";

import { useRef, type ReactNode } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sale } from "@/lib/types";
import { Invoice } from "./invoice";
import { Printer } from "lucide-react";

interface InvoiceDialogProps {
  sale: Sale;
  children: ReactNode;
}

export function InvoiceDialog({ sale, children }: InvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
     documentTitle: `invoice-${sale.saleId}`,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Print Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="bg-gray-100 p-4 rounded-md max-h-[60vh] overflow-y-auto">
            <Invoice ref={invoiceRef} sale={sale} />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    