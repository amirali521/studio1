"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductsTable from "@/components/dashboard/products-table";
import ProductForm from "@/components/dashboard/product-form";
import AppHeader from "@/components/layout/app-header";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

export default function DashboardClient() {
  const [products, setProducts] = useLocalStorage<Product[]>("products", []);
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
    setProducts(products.filter((p) => p.id !== productId));
    toast({
      title: "Product Deleted",
      description: "The product has been removed from your inventory.",
    });
  };

  const handleFormSubmit = (data: Omit<Product, "id" | "createdAt">) => {
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
    } else {
      const newProduct: Product = {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
      toast({
        title: "Product Added",
        description: "The new product has been added to your inventory.",
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <AppHeader title="Dashboard">
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2" />
          Add Product
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 sm:p-6">
        <ProductsTable
          products={products}
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
