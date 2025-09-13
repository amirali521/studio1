
"use client";

import { useState, useMemo } from "react";
import * as ReactDOM from "react-dom/client";
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
import { Loader2, Printer, Download, Check } from "lucide-react";
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
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownload = async () => {
     if (itemsToDisplay.length === 0 || !user) {
      toast({
        variant: "destructive",
        title: "No codes to download",
        description: "Please select a product with stock available.",
      });
      return;
    }
    
    setIsDownloading(true);

    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'absolute';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.top = '-9999px';
    document.body.appendChild(offscreenContainer);

    const root = ReactDOM.createRoot(offscreenContainer);
    
    const A4_WIDTH_PX = 794;
    const PADDING = 20;
    const CODES_PER_ROW = Math.floor((A4_WIDTH_PX - (PADDING * 2)) / qrSize);

    root.render(
      <div 
          id="pdf-content" 
          className="flex flex-wrap gap-4 p-5 bg-white"
          style={{ width: `${A4_WIDTH_PX}px` }}
      >
        {itemsToDisplay.map((item) => (
            <BarcodeDisplay 
                key={item.id} 
                item={{ serialNumber: item.serialNumber, uid: user.uid }}
                size={qrSize}
            />
        ))}
      </div>
    );

    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdfContent = document.getElementById('pdf-content');

    if (pdfContent) {
      try {
        const canvas = await html2canvas(pdfContent, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let imgHeight = pdfWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(`${selectedProduct?.name || 'qrcodes'}-download.pdf`);
        toast({
          title: "Download Complete",
          description: "Your QR codes have been saved as a PDF.",
          action: (
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <Check size={16} />
              </div>
          )
        })
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ variant: "destructive", title: "Download Failed", description: "Could not generate the PDF file."});
      }
    }
    
    // Cleanup
    root.unmount();
    document.body.removeChild(offscreenContainer);
    setIsDownloading(false);
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
             <Button variant="outline" onClick={handleDownload} disabled={itemsToDisplay.length === 0 || isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>}
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
