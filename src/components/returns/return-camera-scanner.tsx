
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrowserQRCodeReader, NotFoundException } from '@zxing/library';
import { X, Zap, ZapOff, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnCameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ReturnCameraScannerDialog({ isOpen, onClose, onScan }: ReturnCameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const isScanning = useRef(true);

  useEffect(() => {
    if (!isOpen) {
      codeReader.current.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsFlashOn(false);
      isScanning.current = true;
      return;
    }

    const startScanning = async () => {
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
              isScanning.current = false; // Stop further scans
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
    setLastScanResult({ success: true, message: "Code Scanned! Processing..." });
    setTimeout(() => {
        onScan(text);
        onClose();
        setLastScanResult(null);
    }, 1000); // Give user time to see feedback
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full w-full h-full p-0 m-0 bg-black/80 backdrop-blur-sm border-0">
        <DialogTitle className="sr-only">Camera QR Code Scanner for Returns</DialogTitle>
        <div className="relative w-full h-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="relative w-[60vw] max-w-[400px] aspect-square">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-400/80 rounded-full animate-scan"></div>
                </div>
                <p className="mt-4 text-center">Scan a single item for return.</p>
                <div className="mt-2 px-4 py-1 bg-black/30 rounded-full">
                    <span className="text-sm font-medium">QR CODE</span>
                </div>
            </div>

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
                <div></div>
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
         <style jsx global>{`
            @keyframes scan {
                0% { transform: translateY(0); }
                100% { transform: translateY(calc(60vw - 4px)); }
            }
            @media (min-width: 680px) { /* approx 400px scan box width */
                 @keyframes scan {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(calc(400px - 4px)); }
                }
            }
            .animate-scan {
                animation: scan 2s linear infinite alternate;
            }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
