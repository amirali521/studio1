
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
import { PlusCircle, Trash2, Camera, Wand2, Loader2 } from "lucide-react";
import { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ProductScanDialog from "./product-scan-dialog";
import { suggestProductName } from "@/ai/flows/suggest-product-name";
import type { AutofillData } from './autofill-dialog';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  barcode: z.string().optional(),
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
  initialData?: (Product | AutofillData) | null;
  isEditing?: boolean;
}

export default function ProductForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}: ProductFormProps) {
  const { toast } = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSuggestingName, setIsSuggestingName] = useState(false);

  const getTransformedData = (data: Product | AutofillData | null) => {
    if (!data) return {
        name: "",
        barcode: "",
        description: "",
        purchasePrice: 0,
        price: 0,
        quantity: 1,
        discount: 0,
        tax: 0,
        customFields: [],
    };

    if ('createdAt' in data) { // It's a Product
         return {
            ...data,
            barcode: "",
            customFields: data.customFields 
            ? Object.entries(data.customFields).map(([key, value]) => ({ key, value })) 
            : []
        };
    } else { // It's AutofillData
        return {
          ...data,
          barcode: "",
          discount: 0,
          tax: 0,
          customFields: [],
        };
    }
  }

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: getTransformedData(initialData)
  });
  
  useEffect(() => {
    form.reset(getTransformedData(initialData));
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  const handleScan = (scannedData: string) => {
    form.setValue("barcode", scannedData);
    toast({ title: "Barcode Scanned", description: "You can now ask the AI to suggest a name." });
    setIsScannerOpen(false);
  };
  
  const handleFormSubmit = (data: ProductFormData) => {
    const {barcode, ...restData} = data;
    const customFieldsObject = restData.customFields?.reduce((acc, field) => {
        if(field.key) acc[field.key] = field.value;
        return acc;
    }, {} as Record<string, string>);
    
    onSubmit({ ...restData, customFields: customFieldsObject});
  }

  const handleSuggestName = async () => {
    const barcode = form.getValues("barcode");
    if (!barcode) {
        toast({
            variant: "destructive",
            title: "No Barcode",
            description: "Please scan a barcode first to suggest a name."
        });
        return;
    }
    setIsSuggestingName(true);
    try {
        const result = await suggestProductName({ barcode });
        form.setValue("name", result.productName);
        toast({
            title: "Name Suggested!",
            description: "The AI has suggested a product name for you."
        });
    } catch(e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "Could not suggest a name at this time."
        });
    } finally {
        setIsSuggestingName(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {!isEditing && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                 <div className="flex gap-2">
                    <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel>Barcode</FormLabel>
                            <FormControl>
                            <Input {...field} placeholder="Scan a barcode..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="button" variant="outline" size="icon" className="self-end" onClick={() => setIsScannerOpen(true)}>
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>
                 <Button type="button" className="w-full" onClick={handleSuggestName} disabled={isSuggestingName}>
                    {isSuggestingName ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2" />}
                    Suggest Name with AI
                </Button>
            </div>
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

