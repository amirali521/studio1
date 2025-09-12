
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoOff, Loader2, Camera, CheckCircle2, XCircle } from "lucide-react";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => boolean; // Return true for success, false for failure
}

type ScanStatus = "idle" | "success" | "failure";

export function CameraScannerDialog({
  isOpen,
  onClose,
  onScan,
}: CameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    async function setupCamera() {
      if (isOpen) {
        setHasCameraPermission(null);
        setError(null);
        setScanStatus("idle");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true"); // Required for iOS
            await videoRef.current.play();
            setHasCameraPermission(true);
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setHasCameraPermission(false);
          setError(
            "Camera permission was denied. Please enable it in your browser settings."
          );
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description:
              "Please enable camera permissions to use this feature.",
          });
        }
      } else {
        cleanup();
      }
    }
    setupCamera();

    return () => {
      cleanup();
    };
  }, [isOpen, cleanup, toast]);

  const showScanStatus = (status: ScanStatus) => {
    setScanStatus(status);
    setTimeout(() => {
      setScanStatus("idle");
    }, 1200); // Display status for 1.2 seconds
  };

  const handleCaptureAndScan = useCallback(() => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
    ) {
      return;
    }
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        const success = onScan(code.data);
        showScanStatus(success ? "success" : "failure");
      } else {
        showScanStatus("failure");
         toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "No QR code could be read from the image. Please try again.",
        });
      }
    }
    
    // Use a short timeout to allow the user to see the button press state
    setTimeout(() => setIsCapturing(false), 200);

  }, [onScan, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 !rounded-none">
        <DialogHeader className="sr-only">
          <DialogTitle>QR Code Scanner</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {hasCameraPermission === null && (
            <div className="text-white flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Starting camera...</p>
            </div>
          )}

          {hasCamerapermission === false && (
            <div className="p-8 text-center text-white">
              <VideoOff className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold">Camera Access Required</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
          )}

          {hasCameraPermission && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}

          {/* Viewfinder & Status Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={cn(
                "w-3/4 max-w-sm aspect-square border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300",
                scanStatus === "success" && "border-green-500",
                scanStatus === "failure" && "border-destructive"
              )}
            />
            <div
              className={cn(
                "absolute text-white transition-opacity duration-300 ease-in-out",
                scanStatus !== "idle" ? "opacity-100" : "opacity-0"
              )}
            >
              {scanStatus === "success" && (
                <CheckCircle2 className="h-24 w-24 text-green-500" />
              )}
              {scanStatus === "failure" && (
                <div className="flex flex-col items-center gap-2">
                    <XCircle className="h-24 w-24 text-destructive" />
                    <span className="font-bold text-lg bg-black/50 px-3 py-1 rounded-md">Scan Failed, Try Again</span>
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4">
            <Button
              className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/30 hover:bg-white/50 disabled:opacity-50"
              onClick={handleCaptureAndScan}
              disabled={isCapturing || !hasCameraPermission}
              aria-label="Take Photo and Scan"
            >
                {isCapturing ? <Loader2 className="h-8 w-8 animate-spin text-black"/> : <Camera className="h-8 w-8 text-white" />}
            </Button>
            <Button
              className="w-full h-12 text-lg"
              onClick={onClose}
              variant="secondary"
            >
              Done Scanning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
