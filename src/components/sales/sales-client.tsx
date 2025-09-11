"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Sale, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SalesHistoryTable from "@/components/sales/sales-history-table";
import SaleForm from "@/components/sales/sale-form";
import AppHeader from "@/components/layout/app-header";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export default function SalesClient() {
  const [sales, setSales] = useLocalStorage<Sale[]>("sales", []);
  const [products, setProducts] = useLocalStorage<Product[]>("products", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = (
    saleItems: { productId: string; quantity: number }[]
  ) => {
    let total = 0;
    const newProductQuantities = [...products];
    let saleIsValid = true;

    const saleRecordItems = saleItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        saleIsValid = false;
        toast({
          variant: "destructive",
          title: "Error",
          description: `Product with ID ${item.productId} not found.`,
        });
        return null;
      }
      if (product.quantity < item.quantity) {
        saleIsValid = false;
        toast({
          variant: "destructive",
          title: "Insufficient Stock",
          description: `Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}.`,
        });
        return null;
      }
      
      const productIndex = newProductQuantities.findIndex(p => p.id === product.id);
      newProductQuantities[productIndex].quantity -= item.quantity;
      total += product.price * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
      };
    });
    
    if (!saleIsValid || saleRecordItems.some(i => i === null)) {
      return; // Stop if any item is invalid
    }

    const newSale: Sale = {
      id: uuidv4(),
      date: new Date().toISOString(),
      items: saleRecordItems.filter(Boolean) as any,
      total,
    };

    setSales([newSale, ...sales]);
    setProducts(newProductQuantities);

    toast({
      title: "Sale Recorded",
      description: "The sale has been successfully recorded.",
    });
    setIsDialogOpen(false);
  };

  return (
    <>
      <AppHeader title="Sales">
        <Button onClick={() => setIsDialogOpen(true)} disabled={products.length === 0}>
          <PlusCircle className="mr-2" />
          Record Sale
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6">
        <SalesHistoryTable sales={sales} />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-headline">Record New Sale</DialogTitle>
            </DialogHeader>
            <SaleForm
              products={products}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
