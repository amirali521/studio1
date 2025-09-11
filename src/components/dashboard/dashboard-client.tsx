
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
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";


export default function DashboardClient() {
  const { data: products, loading: productsLoading, addItem: addProduct, updateItem: updateProduct, deleteItem: deleteProduct } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading, addItems, deleteItemsByProduct } = useFirestoreCollection<SerializedProductItem>("serializedItems");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const itemsOfProduct = serializedItems.filter(item => item.productId === productId);
    if (itemsOfProduct.some(item => item.status === 'sold')) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Product",
        description: "This product has been sold and cannot be deleted.",
      });
      return;
    }

    try {
        await deleteProduct(productId);
        await deleteItemsByProduct(productId);
        toast({
            title: "Product Deleted",
            description: "The product and its stock have been removed.",
        });
    } catch(error) {
        console.error("Error deleting product:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete product.",
        });
    }

  };

  const handleFormSubmit = async (data: Omit<Product, "id" | "createdAt"> & { quantity: number }) => {
    try {
        if (editingProduct) {
            await updateProduct(editingProduct.id, data);
            toast({
                title: "Product Updated",
                description: "The product details have been saved.",
            });
            // Note: Editing quantity of existing product is complex with serialization.
            // For now, we only allow editing details, not adding/removing stock this way.
        } else {
            const newProductId = uuidv4(); // We generate a client-side ID to link items
            const newProduct: Omit<Product, "id"> = {
                name: data.name,
                description: data.description,
                price: data.price,
                createdAt: new Date().toISOString(),
                // Use the client-side generated ID in a different field
                // Firestore will generate its own document ID
            };

            const productDocRef = await addProduct({ ...newProduct, id: newProductId});
            
            const newItems: Omit<SerializedProductItem, "id" | "createdAt">[] = [];
            const productCode = data.name.slice(0, 3).toUpperCase();
            
            for (let i = 0; i < data.quantity; i++) {
                const serialNumber = `${productCode}-${Date.now()}-${i + 1}`;
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
                description: `${data.quantity} items have been added to your inventory.`,
            });
        }
    } catch (error) {
         console.error("Error submitting product:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save product.",
        });
    } finally {
        setIsDialogOpen(false);
    }
  };

  const productsWithStock = products.map(product => ({
      ...product,
      quantity: serializedItems.filter(item => item.productId === product.id && item.status === 'in_stock').length
  }));

  if (productsLoading || itemsLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
         {!productsLoading && !itemsLoading && products.length === 0 && (
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
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingProduct(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
