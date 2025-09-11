"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useEffect } from "react";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  quantity: z
    .coerce
    .number()
    .int()
    .positive("Quantity must be a positive number."),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Add at least one product."),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  products: Product[];
  onSubmit: (data: SaleFormData["items"]) => void;
  onCancel: () => void;
}

export default function SaleForm({
  products,
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");

  const total = watchItems.reduce((acc, currentItem) => {
    const product = products.find((p) => p.id === currentItem.productId);
    if (product) {
      return acc + product.price * (currentItem.quantity || 0);
    }
    return acc;
  }, 0);

  const handleSubmit = (data: SaleFormData) => {
    onSubmit(data.items);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_auto_auto] gap-2 items-start"
            >
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.quantity === 0}>
                            {p.name} (In stock: {p.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-20"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => append({ productId: "", quantity: 1 })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Another Item
        </Button>

        <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit">Record Sale</Button>
            </div>
        </div>
      </form>
    </Form>
  );
}
