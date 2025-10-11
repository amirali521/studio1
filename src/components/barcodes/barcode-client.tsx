
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
import { BarcodeDisplay, type DownloadFormat } from "./barcode";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { Loader2, Printer, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/auth-context";
import jsPDF from "jspdf";
import QRCode from 'qrcode';

export default function BarcodeClient() {
  const { user } = useAuth();
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [qrSize, setQrSize] = useState(150);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('svg');

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
  
  const handleDownloadAll = async () => {
    if (itemsToDisplay.length === 0) {
      toast({
        variant: "destructive",
        title: "No codes to download",
        description: "Please select a product with stock available.",
      });
      return;
    }
    
    setIsDownloading(true);

    const downloadButtons = document.querySelectorAll<HTMLButtonElement>('[data-download-button="true"]');
    for (const btn of Array.from(downloadButtons)) {
        btn.click();
        await new Promise(resolve => setTimeout(resolve, 100)); // Stagger downloads
    }

    toast({
        title: "Downloads Started",
        description: `${itemsToDisplay.length} QR codes are being downloaded as ${downloadFormat.toUpperCase()} files.`,
    });
    
    setIsDownloading(false);
  };
  
  const handleDownloadPdf = async () => {
    if (itemsToDisplay.length === 0 || !selectedProduct || !user) {
        toast({
            variant: "destructive",
            title: "No codes for PDF",
            description: "Please select a product with stock available.",
        });
        return;
    }
    setIsGeneratingPdf(true);

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const itemWidth = 40;
        const itemHeight = 50; // Increased height for text
        const qrCodeSize = 35; // Size of QR code image in mm
        
        const itemsPerRow = Math.floor((pageWidth - margin * 2) / itemWidth);
        const itemsPerCol = Math.floor((pageHeight - margin * 2) / itemHeight);

        let x = margin;
        let y = margin;
        let pageItemCount = 0;

        for (const item of itemsToDisplay) {
            if (pageItemCount >= itemsPerRow * itemsPerCol) {
                doc.addPage();
                x = margin;
                y = margin;
                pageItemCount = 0;
            }

            const qrData = JSON.stringify({ serialNumber: item.serialNumber, uid: user.uid });
            const qrCodeDataURL = await QRCode.toDataURL(qrData, { 
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 1,
                width: 200, // Higher resolution for clarity
            });

            // Center content within the allocated item box
            const centerX = x + itemWidth / 2;

            doc.setFontSize(8);
            doc.text(selectedProduct.name, centerX, y + 5, { align: 'center', maxWidth: itemWidth - 2 });

            doc.addImage(qrCodeDataURL, 'PNG', centerX - qrCodeSize / 2, y + 7, qrCodeSize, qrCodeSize);

            doc.setFontSize(7);
            doc.setFont('courier');
            doc.text(item.serialNumber, centerX, y + itemHeight - 5, { align: 'center' });

            x += itemWidth;
            if (x + itemWidth > pageWidth - margin) {
                x = margin;
                y += itemHeight;
            }
            pageItemCount++;
        }

        doc.save(`${selectedProduct.name}_QR_Codes.pdf`);
        toast({
            title: "PDF Generated",
            description: "Your PDF with all QR codes has been downloaded.",
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "An unexpected error occurred while creating the PDF.",
        });
    } finally {
        setIsGeneratingPdf(false);
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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-between items-end print:hidden">
        <div className="lg:col-span-1 w-full">
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
        <div className="lg:col-span-1 w-full">
          <Label htmlFor="search-serial">Search Serial Number</Label>
          <Input
            id="search-serial"
            placeholder="Filter by serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedProductId}
          />
        </div>
        <div className="lg:col-span-1 w-full">
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
        
        <div className="flex flex-col gap-2 self-end w-full lg:col-span-1">
             <Label htmlFor="format-select">Actions</Label>
            <div className="flex gap-2">
                <Select value={downloadFormat} onValueChange={(val) => setDownloadFormat(val as DownloadFormat)}>
                    <SelectTrigger id="format-select" className="w-2/3">
                        <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                    </SelectContent>
                </Select>
                <Button className="w-1/3" variant="outline" onClick={handleDownloadAll} disabled={itemsToDisplay.length === 0 || isDownloading}>
                    {isDownloading ? <Loader2 className="animate-spin"/> : <Download />}
                </Button>
            </div>
            <div className="flex gap-2">
                 <Button className="w-1/2" onClick={handleDownloadPdf} disabled={itemsToDisplay.length === 0 || isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="animate-spin"/> : <FileText />}
                    PDF
                </Button>
                <Button className="w-1/2" onClick={handlePrint} disabled={itemsToDisplay.length === 0}>
                    <Printer />
                    Print
                </Button>
            </div>
        </div>
      </div>

      {selectedProductId ? (
        itemsToDisplay.length > 0 && selectedProduct && user ? (
           <div id="qr-code-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {itemsToDisplay.map((item) => (
              <BarcodeDisplay 
                key={item.id} 
                item={{
                  serialNumber: item.serialNumber,
                  uid: user.uid,
                }}
                productName={selectedProduct.name}
                size={qrSize}
                downloadFormat={downloadFormat}
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
