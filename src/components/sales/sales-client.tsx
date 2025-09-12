
"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, XCircle, Loader2, Printer } from "lucide-react";
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
import PosBarcodeScanner from "./pos-barcode-scanner";


export default function SalesClient() {
  const { user } = useAuth();
  const { data: sales, addItem: addSale, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, updateItems: updateSerializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  
  const [scannedValue, setScannedValue] = useState("");
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const { toast } = useToast();
  const { currency } = useCurrency();


  const handleScan = (scannedValue: string): boolean => {
    if (!scannedValue) return false;

    let scannedData: Partial<QrCodeData> = {};
    try {
        scannedData = JSON.parse(scannedValue);
    } catch(e) {
        scannedData = { serialNumber: scannedValue };
    }

    if (scannedData.uid && user && scannedData.uid !== user.uid) {
         toast({
            variant: "destructive",
            title: "Ownership Error",
            description: "This product belongs to another user's inventory.",
        });
        setScannedValue("");
        return false;
    }
    
    if (!scannedData.serialNumber) {
         toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "The scanned QR code does not contain a valid serial number.",
        });
        setScannedValue("");
        return false;
    }


    const item = serializedItems.find(
      (i) => i.serialNumber === scannedData.serialNumber && i.status === 'in_stock'
    );
    
    if (!item) {
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: "Item not found, already sold, or invalid serial number.",
      });
      setScannedValue("");
      return false;
    }

    if (currentSaleItems.some(saleItem => saleItem.serialNumber === item.serialNumber)) {
        toast({
            variant: "destructive",
            title: "Scan Error",
            description: "This item has already been scanned for the current sale.",
        });
        setScannedValue("");
        return false;
    }

    const product = products.find(p => p.id === item.productId);
    if(!product) {
         toast({
            variant: "destructive",
            title: "Product Error",
            description: "Could not find the base product for this item.",
        });
        setScannedValue("");
        return false;
    }

    const discountAmount = product.price * ((product.discount || 0) / 100);
    const priceAfterDiscount = product.price - discountAmount;
    const taxAmount = priceAfterDiscount * ((product.tax || 0) / 100);

    const newSaleItem: SaleItem = {
      serializedProductId: item.id,
      productName: product.name,
      serialNumber: item.serialNumber,
      price: product.price,
      purchasePrice: product.purchasePrice,
      discount: discountAmount,
      tax: taxAmount,
      status: 'sold'
    };

    setCurrentSaleItems(prev => [...prev, newSaleItem]);
    toast({
        title: "Item Added",
        description: `${product.name} has been added to the sale.`,
    });
    setScannedValue("");

    const audio = new Audio('/scan-success.mp3');
    audio.play();
    return true;
  };

  const handleRemoveItem = (serialNumber: string) => {
    setCurrentSaleItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
  };
  
  const handleClearSale = () => {
    setCurrentSaleItems([]);
  }

  const { subtotal, totalDiscount, totalTax, total, totalProfit } = useMemo(() => {
    const subtotal = currentSaleItems.reduce((acc, item) => acc + item.price, 0);
    const totalDiscount = currentSaleItems.reduce((acc, item) => acc + item.discount, 0);
    const totalTax = currentSaleItems.reduce((acc, item) => acc + item.tax, 0);
    const total = subtotal - totalDiscount + totalTax;
    const totalProfit = currentSaleItems.reduce((acc, item) => acc + (item.price - item.purchasePrice - item.discount), 0);
    return { subtotal, totalDiscount, totalTax, total, totalProfit };
  }, [currentSaleItems]);


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
      discount: totalDiscount,
      tax: totalTax,
      total,
      profit: totalProfit
    };

    const soldItemUpdates = currentSaleItems.map(item => ({
        id: item.serializedProductId,
        data: { status: 'sold' as const }
    }));

    try {
        await updateSerializedItems(soldItemUpdates);
        const saleDocRef = await addSale(newSale);
        
        toast({
          title: "Sale Recorded",
          description: `Sale of ${currentSaleItems.length} item(s) for ${formatCurrency(total, currency)} has been recorded.`,
        });

        setLastSale({ ...newSale, id: saleDocRef.id, createdAt: new Date().toISOString() });
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
                    placeholder="Enter serial number..."
                    value={scannedValue}
                    onChange={(e) => setScannedValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan(scannedValue)}
                    className="text-base"
                />
                 <Button onClick={() => handleScan(scannedValue)} disabled={!scannedValue}>
                    Add
                </Button>
                 <PosBarcodeScanner onScan={handleScan} />
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
                            <TableCell colSpan={2}>Subtotal</TableCell>
                            <TableCell colSpan={2} className="text-right">{formatCurrency(subtotal, currency)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell colSpan={2} className="text-destructive">Discount</TableCell>
                            <TableCell colSpan={2} className="text-right text-destructive">-{formatCurrency(totalDiscount, currency)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell colSpan={2}>Tax</TableCell>
                            <TableCell colSpan={2} className="text-right">{formatCurrency(totalTax, currency)}</TableCell>
                        </TableRow>
                         <TableRow className="font-bold text-lg">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell colSpan={2} className="text-right">{formatCurrency(total, currency)}</TableCell>
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
    </>
  );
}
