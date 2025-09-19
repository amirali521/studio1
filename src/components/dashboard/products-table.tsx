
"use client";

import { useState, useMemo } from "react";
import { Trash2, Edit, ArrowUp, ArrowDown, Wand2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumberCompact } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/contexts/currency-context";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type ProductWithStock = Product & { quantity: number };
type SortKey = keyof ProductWithStock | null;

interface ProductsTableProps {
  products: ProductWithStock[];
  onDelete: (productId: string) => void;
  onEdit: (product: Product) => void;
}

export default function ProductsTable({
  products,
  onDelete,
  onEdit,
}: ProductsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { currency } = useCurrency();

  const handleSort = (key: keyof ProductWithStock) => {
    if (sortKey === key) {
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else {
        setSortKey(null); // Return to default sort
        setSortOrder("desc");
      }
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedProducts = useMemo(() => {
    const sortableProducts = [...products];
    if (sortKey) {
        sortableProducts.sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    } else {
       sortableProducts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sortableProducts;
  }, [products, sortKey, sortOrder]);


  const renderSortArrow = (key: keyof ProductWithStock) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };
  
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= 10);
  const bestSellingProducts = [...products].sort((a,b) => b.price - a.price).slice(0, 3);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">Inventory</CardTitle>
          <Popover>
              <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                      <Wand2 className="mr-2 h-4 w-4" />
                      AI Insights
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                  <div className="grid gap-4">
                      <div className="space-y-2">
                          <h4 className="font-medium leading-none">Inventory Insights</h4>
                          <p className="text-sm text-muted-foreground">
                              Quick insights based on your current inventory.
                          </p>
                      </div>
                      <div className="grid gap-2">
                          <div className="rounded-lg border bg-background p-4">
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
                           <div className="rounded-lg border bg-background p-4">
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
                      </div>
                  </div>
              </PopoverContent>
          </Popover>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name {renderSortArrow("name")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center">
                      In Stock {renderSortArrow("quantity")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      Price {renderSortArrow("price")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{formatCurrency(product.price, currency)}</TableCell>
                    <TableCell className="text-right space-x-1">
                       <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Product</span>
                        </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Product</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete the product "{product.name}" and any remaining stock. Sold items will remain in your sales history. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => onDelete(product.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed py-12 text-center">
            <h3 className="text-xl font-semibold">No Products Found</h3>
            <p className="text-muted-foreground">
              You haven't added any products yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
