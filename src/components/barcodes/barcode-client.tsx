
"use client";

import { useState, useMemo } from "react";
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
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { Loader2, Printer, Download } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from "@/contexts/auth-context";

export default function BarcodeClient() {
  const { user } = useAuth();
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [qrSize, setQrSize] = useState(150);
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

  const handleDownload = () => {
     if (itemsToDisplay.length === 0) {
      toast({
        variant: "destructive",
        title: "No codes to download",
        description: "Please select a product with stock available.",
      });
      return;
    }
    
    const input = document.getElementById('qr-code-grid');
    if (input) {
      html2canvas(input, {
        useCORS: true,
        scale: 2, // Higher scale for better quality
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${selectedProduct?.name || 'qrcodes'}-download.pdf`);
      });
    }
  };

  const loading = productsLoading || itemsLoading || !user;

  if (loading) {
    return (
        <main className="flex-1 p-4 sm:p-6 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
    );
  }

  if (products.length === 0) {
      return (
          <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
              <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">No Products Available</h2>
                  <p className="text-muted-foreground mb-4">You need to add products to your inventory before you can generate QR codes.</p>
                  <Button asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
              </div>
          </main>
      )
  }

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
        <div className="w-full sm:w-64">
           <Label htmlFor="size-slider">QR Code Size</Label>
           <Slider
            id="size-slider"
            min={50}
            max={300}
            step={10}
            value={[qrSize]}
            onValueChange={(value) => setQrSize(value[0])}
            disabled={itemsToDisplay.length === 0}
          />
        </div>
        <div className="flex gap-2 self-end">
             <Button variant="outline" onClick={handleDownload} disabled={itemsToDisplay.length === 0}>
                <Download className="mr-2"/>
                Download as PDF
            </Button>
            <Button onClick={handlePrint} disabled={itemsToDisplay.length === 0}>
                <Printer className="mr-2"/>
                Print QR Codes
            </Button>
        </div>
      </div>

      {selectedProductId ? (
        itemsToDisplay.length > 0 && selectedProduct && user ? (
           <div id="qr-code-grid" className="flex flex-wrap gap-4 justify-center">
            {itemsToDisplay.map((item) => (
              <BarcodeDisplay 
                key={item.id} 
                item={{
                  serialNumber: item.serialNumber,
                  uid: user.uid,
                }}
                size={qrSize}
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
          <p>Please select a product to see its QR codes.</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-code-grid, #qr-code-grid * {
            visibility: visible;
          }
          #qr-code-grid {
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
