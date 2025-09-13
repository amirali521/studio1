
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrowserQRCodeReader } from '@zxing/library';
import type { Product, SerializedProductItem, QrCodeData } from "@/lib/types";
import { User } from "firebase/auth";
import { X, Zap, ZapOff, CheckCircle2, XCircle, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (items: (Omit<Product, 'id'> & { serialNumber: string })[]) => void;
  products: Product[];
  serializedItems: SerializedProductItem[];
  user: User | null;
}

export default function CameraScannerDialog({ isOpen, onClose, onScan, products, serializedItems, user }: CameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedItems, setScannedItems] = useState<(Omit<Product, 'id'> & { serialNumber: string })[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closing
      codeReader.current.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsFlashOn(false);
      setScannedItems([]);
      return;
    }

    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Check for flash capability
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          if (capabilities.torch) {
            setHasFlash(true);
          }

          codeReader.current.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result) {
              handleDecode(result.getText());
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
  
  const toggleFlash = async () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn }],
        });
        setIsFlashOn(!isFlashOn);
      } catch (err) {
        console.error('Failed to toggle flash:', err);
      }
    }
  };

  const handleDecode = (text: string) => {
    let scannedData: QrCodeData;
    try {
        scannedData = JSON.parse(text);
    } catch (e) {
        setLastScanResult({ success: false, message: "Invalid QR format." });
        return;
    }
    
    if (!scannedData.serialNumber || !scannedData.uid || !scannedData.productName) {
         setLastScanResult({ success: false, message: "Invalid QR data." });
         return;
    }
    
    // Prevent multiple scans of the same code
    if (scannedItems.some(item => item.serialNumber === scannedData.serialNumber)) {
        return;
    }

    if (user && scannedData.uid !== user.uid) {
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
    
    const { id, ...productData } = product;

    const fullScannedItem = {
        ...productData,
        serialNumber: itemInStock.serialNumber,
    };

    setScannedItems(prev => [...prev, fullScannedItem]);
    setLastScanResult({ success: true, message: `${product.name} added!` });
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        try {
          const result = await codeReader.current.decodeFromImageUrl(e.target.result as string);
          handleDecode(result.getText());
        } catch (error) {
          setLastScanResult({ success: false, message: 'No QR code found in image.' });
        }
      }
    };
    reader.readAsDataURL(file);
    // Reset file input to allow scanning the same file again
    event.target.value = '';
  };
  
  const handleRemoveItem = (serialNumber: string) => {
      setScannedItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
  }

  const handleDone = () => {
    onScan(scannedItems);
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
      <DialogContent className="max-w-full w-full h-full p-0 m-0 bg-black/80 backdrop-blur-sm border-0">
        <DialogTitle className="sr-only">Camera QR Code Scanner</DialogTitle>
         <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative w-full h-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="relative w-[60vw] max-w-[400px] aspect-square">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                </div>
                <p className="mt-4 text-center">Align QR Code within frame to scan.</p>
                <div className="mt-2 px-4 py-1 bg-black/30 rounded-full">
                    <span className="text-sm font-medium">QR CODE</span>
                </div>
            </div>

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
                <div>
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-white hover:bg-white/10 hover:text-white rounded-full">
                    <ImageIcon className="h-6 w-6" />
                  </Button>
                </div>
                <div>
                  {hasFlash && (
                    <Button variant="ghost" size="icon" onClick={toggleFlash} className="text-white hover:bg-white/10 hover:text-white rounded-full">
                      {isFlashOn ? <ZapOff className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                    </Button>
                  )}
                   <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white rounded-full">
                    <X className="h-6 w-6" />
                  </Button>
                </div>
            </div>
            
             {/* Bottom Sheet for Scanned Items */}
             <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md rounded-t-2xl p-4 max-h-[40vh] flex flex-col">
                <h3 className="font-bold text-lg text-center mb-2">Scanned Items ({scannedItems.length})</h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                     {scannedItems.length > 0 ? scannedItems.map(item => (
                        <div key={item.serialNumber} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                            <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.serialNumber}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.serialNumber)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Scan an item to begin.</p>
                    )}
                </div>
                <Button onClick={handleDone} disabled={scannedItems.length === 0} className="mt-4">
                    Done Scanning
                </Button>
            </div>
            
            {/* Feedback Overlay */}
            {lastScanResult && (
                 <div className={cn("absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300", 
                    lastScanResult.success ? 'bg-green-500/80' : 'bg-red-500/80'
                 )}>
                    {lastScanResult.success ? <CheckCircle2 className="h-16 w-16 text-white" /> : <XCircle className="h-16 w-16 text-white" />}
                    <p className="mt-4 text-lg font-bold text-white text-center">{lastScanResult.message}</p>
                </div>
            )}
             {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <Alert variant="destructive" className="m-4">
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>Please enable camera permissions in your browser settings to use the scanner.</AlertDescription>
                  </Alert>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
