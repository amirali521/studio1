
"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2, AlertCircle, Wand2 } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Product, SerializedProductItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import ProductsTable from "@/components/dashboard/products-table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { db } from "@/lib/firebase";
import { writeBatch, collection, query, where, getDocs, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import ResponsiveProductDialog from "./responsive-product-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { AutofillData } from "./autofill-dialog";


export default function DashboardClient({ openAutofillDialog }: { openAutofillDialog: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const { currency } = useCurrency();
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
  const [autofillData, setLocalAutofillData] = useState<AutofillData | null>(null);

  useEffect(() => {
    if (autofillData) {
      setIsAddDialogOpen(true);
    }
  }, [autofillData]);
  
  useEffect(() => {
    if (!isAddDialogOpen) {
      setLocalAutofillData(null);
    }
  }, [isAddDialogOpen]);

  const { toast } = useToast();

  const handleAddProduct = () => {
    setLocalAutofillData(null);
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
        const q = query(serializedItemsCollectionRef, where("productId", "==", productId));
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
  
  const lowStockProducts = productsWithStock.filter(p => p.quantity > 0 && p.quantity <= 10);
  const bestSellingProducts = productsWithStock.sort((a,b) => b.price - a.price).slice(0, 3);


  return (
    <>
      <div className="space-y-4">
         {products.length === 0 && (
          <Alert className="mb-4 bg-primary/10 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Welcome to Stockpile Scan!</AlertTitle>
            <AlertDescription>
              Get started by adding your first product. Click the "Add Product" or "Auto-fill with AI" button to open the form.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="text-primary"/> AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Low Stock Alert</h3>
                    <p className="text-sm text-muted-foreground mb-2">These items are running low (10 or fewer in stock).</p>
                    {lowStockProducts.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                            {lowStockProducts.map(p => (
                                <li key={p.id} className="flex justify-between">
                                    <span>{p.name}</span>
                                    <span className="font-bold text-destructive">{p.quantity} left</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">All products have sufficient stock.</p>}
                </div>
                 <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Top Value Products</h3>
                    <p className="text-sm text-muted-foreground mb-2">Your most valuable items currently in stock.</p>
                     {bestSellingProducts.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                            {bestSellingProducts.map(p => (
                                <li key={p.id} className="flex justify-between">
                                    <span>{p.name}</span>
                                    <span className="font-bold text-primary">{formatCurrency(p.price, currency)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No products in inventory.</p>}
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                 <Button variant="outline" onClick={openAutofillDialog}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Auto-fill with AI
                </Button>
            </CardFooter>
        </Card>

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
          initialData={autofillData}
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
