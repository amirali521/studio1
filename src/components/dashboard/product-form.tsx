
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import type { Product } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BarcodeScanner from "@/components/dashboard/barcode-scanner";
import { ScanProductInformationOutput } from "@/ai/flows/scan-product-information";
import { Label } from "../ui/label";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity must be a non-negative number."),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: (Product & { quantity?: number }) | null;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 1, // Default to 1 for new products
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        quantity: product.quantity || 0, // Quantity here is for display, not for editing
      });
    } else {
        form.reset({
            name: "",
            description: "",
            price: 0,
            quantity: 1,
        });
    }
  }, [product, form]);

  const handleScan = (scannedData: ScanProductInformationOutput) => {
    form.setValue("name", scannedData.productName);
    form.setValue("description", scannedData.productDescription);
    form.setValue("price", scannedData.productPrice);
  };

  const isEditing = !!product;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEditing && <BarcodeScanner onScan={handleScan} />}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Organic Apples" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Freshly picked, crisp and juicy."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>{isEditing ? "Current Stock" : "Quantity to Add"}</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="1" 
                {...form.register("quantity")} 
                disabled={isEditing}
              />
            </FormControl>
             {isEditing && (
                <p className="text-xs text-muted-foreground pt-1">
                    Stock quantity can't be edited here.
                </p>
            )}
            <FormMessage>{form.formState.errors.quantity?.message}</FormMessage>
          </FormItem>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {product ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
