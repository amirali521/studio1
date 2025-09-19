
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BrowserQRCodeReader } from '@zxing/library';
import { X, Zap, ZapOff, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ProductScanDialog({ isOpen, onClose, onScan }: ProductScanDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const isScanning = useRef(true);

  useEffect(() => {
    import('@zxing/library').then(({ BrowserQRCodeReader }) => {
      codeReader.current = new BrowserQRCodeReader();
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      codeReader.current?.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsFlashOn(false);
      isScanning.current = true;
      return;
    }

    const startScanning = async () => {
      if (!codeReader.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          if (capabilities.torch) {
            setHasFlash(true);
          }

          codeReader.current.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result && isScanning.current) {
              isScanning.current = false; 
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
      codeReader.current?.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      isScanning.current = true;
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
    setLastScanResult({ success: true, message: "Code Scanned! Prefilling..." });
    setTimeout(() => {
        onScan(text);
        onClose();
        setLastScanResult(null);
    }, 1000);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !codeReader.current) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        try {
          const result = await codeReader.current!.decodeFromImageUrl(e.target.result as string);
          handleDecode(result.getText());
        } catch (error) {
           setLastScanResult({ success: false, message: 'No QR code found in image.' });
            setTimeout(() => {
                setLastScanResult(null);
                isScanning.current = true;
            }, 1500);
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full w-full h-full p-0 m-0 bg-black/80 backdrop-blur-sm border-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Camera QR Code Scanner for Prefilling</DialogTitle>
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
                <div className="relative w-[80vw] max-w-[500px] h-[20vh] max-h-[200px]">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                </div>
                <p className="mt-4 text-center">Scan a product barcode.</p>
                <div className="mt-2 px-4 py-1 bg-black/30 rounded-full">
                    <span className="text-sm font-medium">BARCODE</span>
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

    