
"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Product, SerializedProductItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import ProductsTable from "@/components/dashboard/products-table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { writeBatch, collection, query, where, getDocs, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import ResponsiveProductDialog from "./responsive-product-dialog";


export default function DashboardClient() {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    data: products, 
    loading: productsLoading, 
    addItem: addProduct,
    updateItem: updateProduct,
   } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading, addItems } = useFirestoreCollection<SerializedProductItem>("serializedItems");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  const handleAddProduct = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
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
        const batch = writeBatch(db);

        const productRef = doc(db, "users", user.uid, "products", productId);
        
        const serializedItemsCollectionRef = collection(db, "users", user.uid, "serializedItems");
        const q = query(serializedItemsCollectionRef, where("productId", "==", productId), where("status", "==", "in_stock"));
        const querySnapshot = await getDocs(q);

        batch.delete(productRef);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        toast({
            title: "Product Removed",
            description: "The product and its remaining stock have been removed from inventory.",
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while trying to remove the product from inventory.",
        });
    }
  };

  const handleAddFormSubmit = async (data: Omit<Product, "id" | "createdAt"> & { quantity: number }) => {
    
    try {
      const newProductData: Omit<Product, "id"> = {
          name: data.name,
          description: data.description,
          price: data.price,
          purchasePrice: data.purchasePrice,
          discount: data.discount,
          tax: data.tax,
          customFields: data.customFields,
          createdAt: new Date().toISOString()
      };

      const productDocRef = await addProduct(newProductData);
      const newProductId = productDocRef.id;

      const newItems: Omit<SerializedProductItem, "id" | "createdAt">[] = [];
      const productCode = data.name.slice(0, 3).toLowerCase();

      for (let i = 0; i < data.quantity; i++) {
          const uniquePart = uuidv4().split('-')[0]; // Use a portion of a UUID for uniqueness
          const serialNumber = `${productCode}${uniquePart}${i+1}`;
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
      setIsAddDialogOpen(false);
    } catch (error) {
         console.error("Error submitting product:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "An unexpected error occurred while saving the product.",
        });
    }
  };

  const handleEditFormSubmit = async (data: Omit<Product, "id" | "createdAt">) => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, data);
      toast({
        title: "Product Updated",
        description: `${data.name} has been successfully updated.`,
      });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch(error) {
       console.error("Error updating product:", error);
        toast({
            variant: "destructive",
            title: "Update Error",
            description: "An unexpected error occurred while saving the product.",
        });
    }
  }

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
      <div className="flex-1 p-1 sm:p-2">
         {products.length === 0 && (
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
          onDelete={handleDeleteProduct}
          onEdit={handleEditProduct}
        />
        <ResponsiveProductDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleAddFormSubmit}
        />

        <ResponsiveProductDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditDialogOpen(isOpen);
            if (!isOpen) setEditingProduct(null);
          }}
          onSubmit={handleEditFormSubmit}
          isEditing={true}
          initialData={editingProduct}
        />
      </div>
    </>
  );
}
