
"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Product, SerializedProductItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductsTable from "@/components/dashboard/products-table";
import ProductForm from "@/components/dashboard/product-form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { writeBatch, collection, query, where, getDocs, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";


export default function DashboardClient() {
  const { user } = useAuth();
  const { data: products, loading: productsLoading, addItem: addProduct } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading, addItems } = useFirestoreCollection<SerializedProductItem>("serializedItems");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddProduct = () => {
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to delete products.",
        });
        return;
    }

    try {
        const itemsOfProduct = serializedItems.filter(item => item.productId === productId);
        if (itemsOfProduct.some(item => item.status === 'sold')) {
            toast({
                variant: "destructive",
                title: "Cannot Delete Product",
                description: "This product has associated sales records and cannot be deleted.",
            });
            return;
        }

        const batch = writeBatch(db);

        // Delete the product itself
        const productRef = doc(db, "users", user.uid, "products", productId);
        batch.delete(productRef);

        // Delete all associated serialized items
        const serializedItemsCollectionRef = collection(db, "users", user.uid, "serializedItems");
        const q = query(serializedItemsCollectionRef, where("productId", "==", productId));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        toast({
            title: "Product Deleted",
            description: "The product and all its stock have been removed.",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while trying to delete the product.",
        });
    }
  };

  const handleFormSubmit = async (data: Omit<Product, "id" | "createdAt"> & { quantity: number }) => {
    
    try {
      // Logic for adding a new product
      const newProductData: Omit<Product, "id"> = {
          name: data.name,
          description: data.description,
          price: data.price,
          createdAt: new Date().toISOString()
      };

      // We add the product and get the Firestore-generated ID back.
      const productDocRef = await addProduct(newProductData);
      const newProductId = productDocRef.id;

      const newItems: Omit<SerializedProductItem, "id" | "createdAt">[] = [];
      const productCode = data.name.slice(0, 3).toUpperCase();

      for (let i = 0; i < data.quantity; i++) {
          const uniquePart = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const serialNumber = `${productCode}-${uniquePart}-${i}`;
          newItems.push({
              productId: newProductId,
              serialNumber: serialNumber,
              status: 'in_stock',
          });
      }
      if (newItems.length > 0) {
        await addItems(newItems);
      }

      toast({
          title: "Product Added",
          description: `${data.quantity} item(s) have been added to your inventory.`,
      });
    } catch (error) {
         console.error("Error submitting product:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "An unexpected error occurred while saving the product.",
        });
    } finally {
        setIsDialogOpen(false);
    }
  };

  const productsWithStock = products.map(product => ({
      ...product,
      quantity: serializedItems.filter(item => item.productId === product.id && item.status === 'in_stock').length
  }));

  const isLoading = productsLoading || itemsLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
         {!isLoading && products.length === 0 && (
          <Alert className="mb-4 bg-primary/10 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Welcome to Stockpile Scan!</AlertTitle>
            <AlertDescription>
              Get started by adding your first product. Click the "Add Product" button to open the form. You can even scan a barcode to pre-fill the details!
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-end mb-4">
            <Button onClick={handleAddProduct}>
            <PlusCircle className="mr-2" />
            Add Product
            </Button>
        </div>
        <ProductsTable
          products={productsWithStock}
          onAdd={handleAddProduct}
          onDelete={handleDeleteProduct}
        />
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline">
                Add New Product
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
