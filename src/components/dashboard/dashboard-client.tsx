
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
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

export default function DashboardClient() {
  const [products, setProducts] = useLocalStorage<Product[]>("products", []);
  const [serializedItems, setSerializedItems] = useLocalStorage<SerializedProductItem[]>("serializedItems", []);
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

  const handleDeleteProduct = (productId: string) => {
    const itemsOfProduct = serializedItems.filter(item => item.productId === productId);
    if (itemsOfProduct.some(item => item.status === 'sold')) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Product",
        description: "This product has been sold and cannot be deleted.",
      });
      return;
    }

    setProducts(products.filter((p) => p.id !== productId));
    setSerializedItems(serializedItems.filter(item => item.productId !== productId));

    toast({
      title: "Product Deleted",
      description: "The product and its stock have been removed.",
    });
  };

  const handleFormSubmit = (data: Omit<Product, "id" | "createdAt"> & { quantity: number }) => {
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...data } : p
        )
      );
      toast({
        title: "Product Updated",
        description: "The product details have been saved.",
      });
      // Note: Editing quantity of existing product is complex with serialization.
      // For now, we only allow editing details, not adding/removing stock this way.
    } else {
      const newProductId = uuidv4();
      const newProduct: Product = {
        id: newProductId,
        name: data.name,
        description: data.description,
        price: data.price,
        createdAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);

      const newItems: SerializedProductItem[] = [];
      const productCode = data.name.slice(0, 3).toUpperCase();
      const existingCount = serializedItems.filter(i => i.productId === newProductId).length;

      for (let i = 0; i < data.quantity; i++) {
        const serialNumber = `${productCode}-${Date.now()}-${existingCount + i + 1}`;
        newItems.push({
          id: uuidv4(),
          productId: newProductId,
          serialNumber: serialNumber,
          status: 'in_stock',
          createdAt: new Date().toISOString(),
        });
      }
      setSerializedItems([...serializedItems, ...newItems]);

      toast({
        title: "Product Added",
        description: `${data.quantity} items have been added to your inventory.`,
      });
    }
    setIsDialogOpen(false);
  };

  const productsWithStock = products.map(product => ({
      ...product,
      quantity: serializedItems.filter(item => item.productId === product.id && item.status === 'in_stock').length
  }));


  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
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
