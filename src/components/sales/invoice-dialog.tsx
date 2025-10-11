
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
import { Printer, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  sale: Sale;
  children: ReactNode;
}

export function InvoiceDialog({ sale, children }: InvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
     documentTitle: `invoice-${sale.saleId}`,
  });

  const handleShare = async () => {
    if (!invoiceRef.current) return;

    if (!navigator.share || !navigator.canShare) {
      toast({
        variant: "destructive",
        title: "Sharing Not Supported",
        description: "Your browser does not support the Web Share API.",
      });
      return;
    }

    setIsSharing(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
            throw new Error("Could not create image blob.");
        }
        
        const file = new File([blob], `receipt-${sale.saleId}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                title: `Receipt for Sale #${sale.saleId.slice(0,8)}`,
                text: `Here is your receipt.`,
                files: [file],
                });
            } catch (error: any) {
                // This can happen if the user cancels the share dialog.
                if (error.name !== 'AbortError') {
                    console.error("Sharing failed:", error);
                    toast({
                        variant: "destructive",
                        title: "Sharing Error",
                        description: "Could not share the receipt.",
                    });
                }
            }
        } else {
            toast({
                variant: "destructive",
                title: "Cannot Share File",
                description: "Your browser cannot share this file type.",
            });
        }
        setIsSharing(false);
      }, "image/png");

    } catch (error) {
      console.error("Error generating receipt image:", error);
      toast({
        variant: "destructive",
        title: "Sharing Error",
        description: "Could not generate receipt image for sharing.",
      });
      setIsSharing(false);
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
           <Button onClick={handleShare} variant="outline" disabled={isSharing} className="w-full sm:w-auto">
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            Share
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
