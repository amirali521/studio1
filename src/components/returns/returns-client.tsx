
"use client";

import { useState, useRef } from "react";
import { ScanLine, Loader2, History, Undo2 } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Sale, SerializedProductItem, QrCodeData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import SalesHistoryDialog from "../sales/sales-history-dialog";
import { useAuth } from "@/contexts/auth-context";


export default function ReturnsClient() {
  const { user } = useAuth();
  const { data: sales, updateItem: updateSale, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: serializedItems, updateItem: updateSerializedItem, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  
  const [scannedValue, setScannedValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScanReturn = async () => {
    if (!scannedValue) return;

    let scannedData: Partial<QrCodeData> = {};
    try {
        scannedData = JSON.parse(scannedValue);
    } catch(e) {
        // This is not a JSON QR code, so we'll assume it's just a serial number
        scannedData = { serialNumber: scannedValue };
    }

    if (scannedData.uid && user && scannedData.uid !== user.uid) {
         toast({
            variant: "destructive",
            title: "Ownership Error",
            description: "This product belongs to another user's inventory.",
        });
        setScannedValue("");
        return;
    }
    
    if (!scannedData.serialNumber) {
         toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "The scanned QR code does not contain a valid serial number.",
        });
        setScannedValue("");
        return;
    }

    setIsProcessing(true);

    const itemToReturn = serializedItems.find(
      (i) => i.serialNumber === scannedData.serialNumber
    );
    
    if (!itemToReturn) {
      toast({
        variant: "destructive",
        title: "Return Error",
        description: "This serial number does not exist in the system.",
      });
      setIsProcessing(false);
      setScannedValue("");
      return;
    }
    
    if (itemToReturn.status === 'in_stock') {
      toast({
        variant: "destructive",
        title: "Return Error",
        description: "This item is already marked as in stock.",
      });
      setIsProcessing(false);
      setScannedValue("");
      return;
    }

    // Find the sale containing this item
    const saleToUpdate = sales.find(s => s.items.some(i => i.serialNumber === scannedData.serialNumber && i.status !== 'returned'));

    if (!saleToUpdate) {
        toast({
            variant: "destructive",
            title: "Return Error",
            description: "Could not find a valid, non-returned sale record for this item.",
        });
        setIsProcessing(false);
        setScannedValue("");
        return;
    }

    try {
        // 1. Update the serialized item status back to in_stock
        await updateSerializedItem(itemToReturn.id, { status: 'in_stock' });

        // 2. Update the item's status in the sale record to 'returned'
        const updatedItems = saleToUpdate.items.map(item => 
            item.serialNumber === scannedData.serialNumber
                ? { ...item, status: 'returned' as const } 
                : item
        );
        await updateSale(saleToUpdate.id, { items: updatedItems });

        toast({
            title: "Return Processed",
            description: `Item ${scannedData.serialNumber} has been returned to stock.`,
        });

        setScannedValue("");

    } catch (error) {
        console.error("Error processing return:", error);
        toast({
            variant: "destructive",
            title: "Processing Error",
            description: "An unexpected error occurred while processing the return.",
        });
    } finally {
        setIsProcessing(false);
        inputRef.current?.focus();
    }
  };
  
  const loading = salesLoading || itemsLoading || !user;
  
  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const soldItemsExist = serializedItems.some(item => item.status === 'sold');
   if (!soldItemsExist && !loading) {
    return (
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">No Sold Items</h2>
                <p className="text-muted-foreground mb-4">There are no items marked as 'sold' to process for a return.</p>
                <Button asChild>
                    <Link href="/sales">Go to POS</Link>
                </Button>
            </div>
        </main>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 flex justify-center items-start">
      <Card className="w-full max-w-lg">
        <CardHeader>
            <CardTitle className="font-headline">Process a Return</CardTitle>
            <CardDescription>Scan the QR code on the product to process its return and add it back to inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or enter serial number..."
                value={scannedValue}
                onChange={(e) => setScannedValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanReturn()}
                disabled={isProcessing}
                className="text-base"
              />
              <Button onClick={handleScanReturn} disabled={isProcessing || !scannedValue}>
                {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <Undo2 className="mr-2"/>}
                Process
              </Button>
            </div>
             <SalesHistoryDialog sales={sales} />
        </CardContent>
      </Card>
    </main>
  );
}
