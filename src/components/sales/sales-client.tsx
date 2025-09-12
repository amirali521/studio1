
"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, XCircle, Loader2, Printer, Percent, BadgeDollarSign, Camera, ScanLine } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Sale, Product, SerializedProductItem, SaleItem, QrCodeData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import SalesHistoryDialog from "./sales-history-dialog";
import { useCurrency } from "@/contexts/currency-context";
import { InvoiceDialog } from "./invoice-dialog";
import { useAuth } from "@/contexts/auth-context";
import { Label } from "../ui/label";
import { CameraScannerDialog } from "./camera-scanner-dialog";


export default function SalesClient() {
  const { user } = useAuth();
  const { data: sales, addItem: addSale, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, updateItems: updateSerializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  
  const [scannedValue, setScannedValue] = useState("");
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);


  const { toast } = useToast();
  const { currency } = useCurrency();


  const handleScan = (scannedValue: string) => {
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


    const item = serializedItems.find(
      (i) => i.serialNumber === scannedData.serialNumber && i.status === 'in_stock'
    );
    
    if (!item) {
      toast({
        variant: "destructive",
        title: "ScanError",
        description: "Item not found, already sold, or invalid serial number.",
      });
      setScannedValue("");
      return;
    }

    if (currentSaleItems.some(saleItem => saleItem.serialNumber === item.serialNumber)) {
        toast({
            variant: "destructive",
            title: "Scan Error",
            description: "This item has already been scanned for the current sale.",
        });
        setScannedValue("");
        return;
    }

    const product = products.find(p => p.id === item.productId);
    if(!product) {
         toast({
            variant: "destructive",
            title: "Product Error",
            description: "Could not find the base product for this item.",
        });
        setScannedValue("");
        return;
    }

    const newSaleItem: SaleItem = {
      serializedProductId: item.id,
      productName: product.name,
      serialNumber: item.serialNumber,
      price: product.price,
      purchasePrice: product.purchasePrice,
      status: 'sold'
    };

    setCurrentSaleItems(prev => [...prev, newSaleItem]);
    toast({
        title: "Item Added",
        description: `${product.name} has been added to the sale.`,
    });
    setScannedValue("");

    // Play a success sound
    const audio = new Audio('/scan-success.mp3');
    audio.play();
  };

  const handleRemoveItem = (serialNumber: string) => {
    setCurrentSaleItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
  };
  
  const handleClearSale = () => {
    setCurrentSaleItems([]);
    setDiscount(0);
    setTax(0);
  }

  const subtotal = currentSaleItems.reduce((acc, item) => acc + item.price, 0);
  const total = subtotal + tax - discount;
  const totalProfit = currentSaleItems.reduce((acc, item) => acc + (item.price - item.purchasePrice), 0) - discount;


  const handleFinalizeSale = async () => {
    if (currentSaleItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Sale",
        description: "Scan at least one item to record a sale.",
      });
      return;
    }
    
    const saleId = uuidv4();
    const newSale: Omit<Sale, 'id' | 'createdAt'> = {
      saleId: saleId,
      date: new Date().toISOString(),
      items: currentSaleItems,
      subtotal,
      discount,
      tax,
      total,
      profit: totalProfit
    };

    const soldItemUpdates = currentSaleItems.map(item => ({
        id: item.serializedProductId,
        data: { status: 'sold' as const }
    }));

    try {
        await updateSerializedItems(soldItemUpdates);
        await addSale(newSale);
        
        toast({
          title: "Sale Recorded",
          description: `Sale of ${currentSaleItems.length} item(s) for ${formatCurrency(total, currency)} has been recorded.`,
        });

        setLastSale({ ...newSale, id: saleId, createdAt: new Date().toISOString() });
        handleClearSale();
    } catch (error) {
        console.error("Error finalizing sale:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to finalize sale.",
        });
    }
  };
  
  const loading = salesLoading || productsLoading || itemsLoading || !user;

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const stockAvailable = serializedItems.some(item => item.status === 'in_stock');

  if (!stockAvailable && !loading) {
    return (
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">No Stock Available</h2>
                <p className="text-muted-foreground mb-4">You need to add products to your inventory before you can make a sale.</p>
                <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </main>
    )
  }

  return (
    <>
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6">
      {/* Current Sale Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4 space-y-4">
             <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Scan or enter serial number..."
                    value={scannedValue}
                    onChange={(e) => setScannedValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan(scannedValue)}
                    className="text-base"
                />
                 <Button onClick={() => handleScan(scannedValue)} disabled={!scannedValue}>
                    <ScanLine className="mr-2"/> Add
                </Button>
                <Button 
                    onClick={() => setIsScannerOpen(true)} 
                    variant="outline"
                    size="icon"
                >
                    <Camera />
                    <span className="sr-only">Scan with camera</span>
                </Button>
            </div>

            <div className="min-h-[300px] border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-[50px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSaleItems.length > 0 ? (
                    currentSaleItems.map((item) => (
                      <TableRow key={item.serialNumber}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.serialNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price, currency)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.serialNumber)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Scan an item to begin a sale.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                 {currentSaleItems.length > 0 && (
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="font-bold">Subtotal</TableCell>
                            <TableCell colSpan={2} className="text-right font-bold">{formatCurrency(subtotal, currency)}</TableCell>
                        </TableRow>
                    </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Total Section */}
      <div className="lg:col-span-1">
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="discount">Discount</Label>
                        <div className="relative">
                            <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="pl-8"/>
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="tax">Tax</Label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="tax" type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} className="pl-8"/>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-between items-center text-3xl font-bold pt-4">
                    <span>Total:</span>
                    <span>{formatCurrency(total, currency)}</span>
                </div>
                <Button 
                    className="w-full h-16 text-lg" 
                    onClick={handleFinalizeSale}
                    disabled={currentSaleItems.length === 0}
                >
                    Finalize Sale
                </Button>
                
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button 
                            variant="destructive" 
                            className="w-full"
                            disabled={currentSaleItems.length === 0}
                        >
                            <XCircle className="mr-2"/>
                            Clear Sale
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to clear this sale?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All scanned items in the current transaction will be removed. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearSale} className="bg-destructive hover:bg-destructive/90">Clear Sale</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {lastSale && (
                  <InvoiceDialog sale={lastSale}>
                    <Button variant="secondary" className="w-full">
                      <Printer className="mr-2" />
                      Print Last Receipt
                    </Button>
                  </InvoiceDialog>
                )}

                <SalesHistoryDialog sales={sales} />
            </CardContent>
        </Card>
      </div>
    </main>
    <CameraScannerDialog 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
     />
    </>
  );
}
