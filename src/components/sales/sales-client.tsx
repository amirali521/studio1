
"use client";

import { useState, useEffect, useRef } from "react";
import { ScanLine, Trash2, XCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Sale, Product, SerializedProductItem, SaleItem } from "@/lib/types";
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

export default function SalesClient() {
  const [sales, setSales] = useLocalStorage<Sale[]>("sales", []);
  const [products, setProducts] = useLocalStorage<Product[]>("products", []);
  const [serializedItems, setSerializedItems] = useLocalStorage<SerializedProductItem[]>("serializedItems", []);
  
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [scannedValue, setScannedValue] = useState("");
  
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { currency } = useCurrency();


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = () => {
    if (!scannedValue) return;

    const item = serializedItems.find(
      (i) => i.serialNumber === scannedValue && i.status === 'in_stock'
    );
    
    if (!item) {
      toast({
        variant: "destructive",
        title: "Scan Error",
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
    };

    setCurrentSaleItems(prev => [...prev, newSaleItem]);
    setScannedValue("");
  };

  const handleRemoveItem = (serialNumber: string) => {
    setCurrentSaleItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
  };
  
  const handleClearSale = () => {
    setCurrentSaleItems([]);
  }

  const total = currentSaleItems.reduce((acc, item) => acc + item.price, 0);

  const handleFinalizeSale = () => {
    if (currentSaleItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Sale",
        description: "Scan at least one item to record a sale.",
      });
      return;
    }
    
    const newSale: Sale = {
      id: uuidv4(),
      date: new Date().toISOString(),
      items: currentSaleItems,
      total,
    };

    const soldItemIds = new Set(currentSaleItems.map(i => i.serializedProductId));

    const updatedSerializedItems = serializedItems.map(item => 
      soldItemIds.has(item.id) ? { ...item, status: 'sold' as const } : item
    );

    setSerializedItems(updatedSerializedItems);
    setSales([newSale, ...sales]);
    
    toast({
      title: "Sale Recorded",
      description: `Sale of ${currentSaleItems.length} item(s) for ${formatCurrency(total, currency)} has been recorded.`,
    });

    setCurrentSaleItems([]);
  };
  
  const stockAvailable = serializedItems.some(item => item.status === 'in_stock');


  if (!stockAvailable) {
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
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6">
      {/* Current Sale Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or enter serial number..."
                value={scannedValue}
                onChange={(e) => setScannedValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="text-base"
              />
              <Button onClick={handleScan}><ScanLine className="mr-2"/> Scan</Button>
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
                            <TableCell colSpan={2} className="font-bold text-lg">Total</TableCell>
                            <TableCell colSpan={2} className="text-right font-bold text-lg">{formatCurrency(total, currency)}</TableCell>
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
                 <div className="flex justify-between items-center text-3xl font-bold">
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

                <SalesHistoryDialog sales={sales} />
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
