
"use client";

import { useRef, type ReactNode, useState } from "react";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
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
import { Printer, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  sale: Sale;
  children: ReactNode;
}

export function InvoiceDialog({ sale, children }: InvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `invoice-${sale.saleId}`,
  });

  const handleDownload = async () => {
    if (!invoiceRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `receipt-${sale.saleId.slice(0,8)}.png`;
      link.href = dataUrl;
      link.click();

       toast({
          title: "Receipt Downloaded",
          description: "The receipt image has been saved to your device.",
      });

    } catch (error) {
      console.error("Error generating receipt image:", error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Could not generate receipt image for downloading.",
      });
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto bg-muted/50 p-4 rounded-md">
            <Invoice ref={invoiceRef} sale={sale} />
        </div>
        
        <DialogFooter className="sm:justify-between gap-2">
           <Button onClick={handleDownload} variant="outline" disabled={isDownloading} className="w-full sm:w-auto">
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <DialogClose asChild className="w-full">
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
