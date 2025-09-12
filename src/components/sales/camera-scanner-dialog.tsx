
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoOff, Loader2 } from "lucide-react";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const SCAN_COOLDOWN_MS = 1500; // 1.5 seconds cooldown after a successful scan

export function CameraScannerDialog({
  isOpen,
  onClose,
  onScan,
}: CameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameId = useRef<number>();
  const lastScanTime = useRef<number>(0);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastScanTime.current < SCAN_COOLDOWN_MS) {
      animationFrameId.current = requestAnimationFrame(tick);
      return; // Still in cooldown period
    }

    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
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
            lastScanTime.current = now; // Start cooldown
            onScan(code.data);
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [onScan]);


  useEffect(() => {
    async function setupCamera() {
      if (isOpen) {
        setHasCameraPermission(null);
        setError(null);
        lastScanTime.current = 0;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true"); // Required for iOS
            await videoRef.current.play();
            setHasCameraPermission(true);
            animationFrameId.current = requestAnimationFrame(tick);
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setHasCameraPermission(false);
          setError("Camera permission was denied. Please enable it in your browser settings.");
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions to use this feature.",
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
  }, [isOpen, cleanup, toast, tick]);

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

          {hasCameraPermission === false && (
            <div className="p-8 text-center text-white">
                <VideoOff className="h-16 w-16 mx-auto mb-4 text-destructive"/>
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

          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 max-w-sm aspect-square border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
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
