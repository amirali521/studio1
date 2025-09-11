
"use client";

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Product, SerializedProductItem } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BarcodeDisplay } from "./barcode";
import { Switch } from "@/components/ui/switch";

export default function BarcodeClient() {
  const [products] = useLocalStorage<Product[]>("products", []);
  const [serializedItems] = useLocalStorage<SerializedProductItem[]>( "serializedItems", []);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [generateQrCode, setGenerateQrCode] = useState(false);
  const { toast } = useToast();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const itemsToDisplay = useMemo(() => {
    if (!selectedProductId) return [];
    return serializedItems
      .filter((item) => item.productId === selectedProductId && item.status === 'in_stock')
      .filter((item) =>
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [selectedProductId, serializedItems, searchTerm]);

  const handlePrint = () => {
    if (itemsToDisplay.length === 0) {
      toast({
        variant: "destructive",
        title: "No codes to print",
        description: "Please select a product with stock available.",
      });
      return;
    }
    window.print();
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        <div className="w-full sm:w-64">
          <Label htmlFor="product-select">Select Product</Label>
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
          >
            <SelectTrigger id="product-select">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="search-serial">Search Serial Number</Label>
          <Input
            id="search-serial"
            placeholder="Filter by serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedProductId}
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
            <Label htmlFor="code-type-switch">Barcode</Label>
            <Switch
                id="code-type-switch"
                checked={generateQrCode}
                onCheckedChange={setGenerateQrCode}
            />
            <Label htmlFor="code-type-switch">QR Code</Label>
        </div>
        <div className="self-end">
            <Button onClick={handlePrint} disabled={itemsToDisplay.length === 0}>
                Print {generateQrCode ? 'QR Codes' : 'Barcodes'}
            </Button>
        </div>
      </div>

      {selectedProductId ? (
        itemsToDisplay.length > 0 && selectedProduct ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {itemsToDisplay.map((item) => (
              <BarcodeDisplay 
                key={item.id} 
                item={{
                  serialNumber: item.serialNumber,
                  productName: selectedProduct.name,
                  price: selectedProduct.price,
                }}
                type={generateQrCode ? 'qrcode' : 'barcode'} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No in-stock items found for this product.</p>
            <p>Try clearing the search or selecting a different product.</p>
          </div>
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Please select a product to see its codes.</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
