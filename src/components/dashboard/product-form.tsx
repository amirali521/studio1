
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
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
import { PlusCircle, Trash2, Camera } from "lucide-react";
import { Product, SerializedProductItem, QrCodeData } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { useToast } from "@/hooks/use-toast";
import ProductScanDialog from "./product-scan-dialog";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  description: z.string().min(1, "Description is required."),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be non-negative."),
  price: z.coerce.number().min(0, "Selling price must be non-negative."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .optional(),
  discount: z.coerce.number().min(0, "Discount must be non-negative.").optional(),
  tax: z.coerce.number().min(0, "Tax must be non-negative.").optional(),
  customFields: z.array(z.object({
    key: z.string().min(1, "Field name is required."),
    value: z.string().min(1, "Field value is required."),
  })).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Product;
  isEditing?: boolean;
}

export default function ProductForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: products } = useFirestoreCollection<Product>("products");
  const { data: serializedItems } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const transformedInitialData = initialData ? {
    ...initialData,
    customFields: initialData.customFields 
      ? Object.entries(initialData.customFields).map(([key, value]) => ({ key, value })) 
      : []
  } : {
      name: "",
      description: "",
      purchasePrice: 0,
      price: 0,
      quantity: 1,
      discount: 0,
      tax: 0,
      customFields: [],
  };
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: transformedInitialData
  });
  
  useEffect(() => {
    if (initialData) {
       const transformedData = {
        ...initialData,
        customFields: initialData.customFields 
          ? Object.entries(initialData.customFields).map(([key, value]) => ({ key, value })) 
          : []
      };
      form.reset(transformedData);
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  const handleScan = (scannedData: QrCodeData) => {
    if (!scannedData.serialNumber) {
        toast({ variant: "destructive", title: "Scan Error", description: "Invalid QR code." });
        return;
    }
    
    if (user && scannedData.uid !== user.uid) {
        toast({ variant: "destructive", title: "Scan Error", description: "This item belongs to another user." });
        return;
    }
    
    const scannedItem = serializedItems.find(item => item.serialNumber === scannedData.serialNumber);
    if (!scannedItem) {
        toast({ variant: "destructive", title: "Scan Error", description: "Item not found in inventory." });
        return;
    }

    const productToPrefill = products.find(p => p.id === scannedItem.productId);
    if (!productToPrefill) {
        toast({ variant: "destructive", title: "Scan Error", description: "Could not find the associated product." });
        return;
    }

    const transformedData = {
        ...productToPrefill,
        quantity: 1, // Default quantity to 1 for the new entry
        customFields: productToPrefill.customFields
          ? Object.entries(productToPrefill.customFields).map(([key, value]) => ({ key, value }))
          : [],
    };
    form.reset(transformedData);

    toast({ title: "Product Prefilled", description: `Form filled with data from ${productToPrefill.name}.` });
    setIsScannerOpen(false);
  };
  
  const handleFormSubmit = (data: ProductFormData) => {
    const customFieldsObject = data.customFields?.reduce((acc, field) => {
        if(field.key) acc[field.key] = field.value;
        return acc;
    }, {} as Record<string, string>);
    
    onSubmit({ ...data, customFields: customFieldsObject});
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {!isEditing && (
             <Button type="button" variant="outline" className="w-full" onClick={() => setIsScannerOpen(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Scan Existing Product to Prefill
            </Button>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Organic Coffee Beans" />
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
                    {...field}
                    placeholder="e.g., 12oz bag of single-origin dark roast"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="e.g., 5.50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="e.g., 12.99" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                      <Input 
                          type="number" 
                          step="1" 
                          {...field}
                          disabled={isEditing}
                          placeholder="e.g., 50"
                      />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ''} placeholder="e.g., 10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ''} placeholder="e.g., 8.25" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
              {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                      <FormField
                          control={form.control}
                          name={`customFields.${index}.key`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Field Name" className="w-full sm:w-1/3"/>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name={`customFields.${index}.value`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Field Value" className="w-full sm:w-2/3"/>
                          )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="text-destructive"/>
                      </Button>
                  </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", value: "" })}>
                  <PlusCircle className="mr-2"/> Add Custom Field
              </Button>
          </div>


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Form>
       <ProductScanDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
