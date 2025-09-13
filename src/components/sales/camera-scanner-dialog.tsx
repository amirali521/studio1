
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Scan, Trash2 } from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import type { Product, SerializedProductItem, QrCodeData } from "@/lib/types";
import { User } from "firebase/auth";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (items: QrCodeData[]) => void;
  products: Product[];
  serializedItems: SerializedProductItem[];
  user: User | null;
}

export default function CameraScannerDialog({ isOpen, onClose, onScan, products, serializedItems, user }: CameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannedItems, setScannedItems] = useState<QrCodeData[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    if (!isOpen) {
      // Stop scanning and release camera when dialog is closed
      codeReader.current.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          codeReader.current.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result) {
              handleDecode(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
                // This will catch more persistent errors, but we ignore NotFoundException as it's expected
            }
          });
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setHasCameraPermission(false);
      }
    };

    startScanning();

    return () => {
      codeReader.current.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleDecode = (text: string) => {
    // To prevent multiple scans of the same code in quick succession
    if (scannedItems.some(item => item.serialNumber === JSON.parse(text)?.serialNumber)) {
        return;
    }
    
    let scannedData: Partial<QrCodeData> = {};
    try {
        scannedData = JSON.parse(text);
    } catch (e) {
        setLastScanResult({ success: false, message: "Invalid QR format." });
        return;
    }

    if (scannedData.uid && user && scannedData.uid !== user.uid) {
        setLastScanResult({ success: false, message: "Item belongs to another user." });
        return;
    }

    const itemInStock = serializedItems.find(i => i.serialNumber === scannedData.serialNumber && i.status === 'in_stock');
    if (!itemInStock) {
        setLastScanResult({ success: false, message: "Item not in stock or already scanned." });
        return;
    }
    
    const product = products.find(p => p.id === itemInStock.productId);
    if (!product) {
        setLastScanResult({ success: false, message: "Base product not found." });
        return;
    }
    
    const fullScannedItem : QrCodeData = {
        ...product,
        serialNumber: itemInStock.serialNumber,
        productName: product.name,
        uid: user?.uid || ''
    };

    setScannedItems(prev => [...prev, fullScannedItem]);
    setLastScanResult({ success: true, message: `${product.name} added!` });
  };
  
  const handleRemoveItem = (serialNumber: string) => {
      setScannedItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
  }

  const handleDone = () => {
    onScan(scannedItems);
    setScannedItems([]);
    onClose();
  };

  useEffect(() => {
    if(lastScanResult) {
        const timer = setTimeout(() => setLastScanResult(null), 1500);
        return () => clearTimeout(timer);
    }
  }, [lastScanResult]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Scan Products</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} className="w-full h-full" autoPlay muted playsInline />
          {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <Alert variant="destructive" className="m-4">
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>Please enable camera permissions in your browser settings to use the scanner.</AlertDescription>
                  </Alert>
              </div>
          )}
          {lastScanResult && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${lastScanResult.success ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                {lastScanResult.success ? <CheckCircle2 className="h-16 w-16 text-white" /> : <XCircle className="h-16 w-16 text-white" />}
                <p className="mt-4 text-lg font-bold text-white text-center">{lastScanResult.message}</p>
            </div>
          )}
           <div className="absolute top-2 left-2 right-2 flex justify-center">
             <div className="relative w-3/4 h-24 border-4 border-dashed border-white/50 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
             </div>
           </div>
        </div>
        <div className="p-6 pt-0 space-y-4">
            <h3 className="font-medium">Scanned Items ({scannedItems.length})</h3>
            <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2">
                {scannedItems.length > 0 ? scannedItems.map(item => (
                    <div key={item.serialNumber} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                        <div>
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.serialNumber}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.serialNumber)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No items scanned yet.</p>
                )}
            </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDone} disabled={scannedItems.length === 0}>
            Done Scanning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

