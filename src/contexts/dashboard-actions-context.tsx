
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { Product, SerializedProductItem, AutofillProduct } from '@/lib/types';

interface DashboardActionsContextType {
  addMultipleProducts: (products: AutofillProduct[]) => Promise<void>;
}

const DashboardActionsContext = createContext<DashboardActionsContextType | undefined>(undefined);

export function DashboardActionsProvider({ children }: { children: ReactNode }) {
  const { addItem: addProduct } = useFirestoreCollection<Product>('products');
  const { addItems: addSerializedItems } = useFirestoreCollection<SerializedProductItem>('serializedItems');
  const { toast } = useToast();

  const addMultipleProducts = async (products: AutofillProduct[]) => {
    try {
      for (const product of products) {
        const newProductData: Omit<Product, 'id'> = {
            name: product.name,
            description: product.description,
            price: product.price,
            purchasePrice: product.purchasePrice,
            discount: 0,
            tax: 0,
            createdAt: new Date().toISOString()
        };

        const productDocRef = await addProduct(newProductData);
        const newProductId = productDocRef.id;

        const newItems: Omit<SerializedProductItem, 'id' | 'createdAt'>[] = [];
        const productCode = product.name.slice(0, 3).toLowerCase();

        for (let i = 0; i < product.quantity; i++) {
            const uniquePart = uuidv4().split('-')[0];
            const serialNumber = `${productCode}${uniquePart}${i+1}`;
            newItems.push({
                productId: newProductId,
                serialNumber: serialNumber,
                status: 'in_stock',
            });
        }
        if (newItems.length > 0) {
          await addSerializedItems(newItems);
        }
      }
    } catch (error) {
        console.error("Error batch-adding products:", error);
        toast({
            variant: "destructive",
            title: "Batch Add Error",
            description: "An unexpected error occurred while adding products.",
        });
    }
  };


  return (
    <DashboardActionsContext.Provider value={{ addMultipleProducts }}>
      {children}
    </DashboardActionsContext.Provider>
  );
}

export function useDashboardActions() {
  const context = useContext(DashboardActionsContext);
  if (context === undefined) {
    throw new Error('useDashboardActions must be used within a DashboardActionsProvider');
  }
  return context;
}
