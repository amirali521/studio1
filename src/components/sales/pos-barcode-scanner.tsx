"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, AlertCircle, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";

interface PosBarcodeScannerProps {
  onScan: (data: string) => boolean; // Return true for success, false for failure
}

export default function PosBarcodeScanner({ onScan }: PosBarcodeScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target?.result as string;

      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            setIsLoading(false);
            return;
        }
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            setIsLoading(false);
            return;
        }

        canvas.height = image.height;
        canvas.width = image.width;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            const success = onScan(code.data);
            if (!success) {
              // The onScan function handles its own failure toasts.
            }
          } else {
            toast({
              variant: "destructive",
              title: "Scan Failed",
              description: "No valid QR code was found in the image. Please ensure the code is clear and fully visible.",
            });
          }
        } catch (error) {
            console.error("Error decoding QR code:", error);
            toast({
              variant: "destructive",
              title: "Scan Error",
              description: "Could not process the image. The file might be corrupted or in an unsupported format.",
            });
        } finally {
           setIsLoading(false);
           // Reset file input to allow scanning the same file again
           if (event.target) {
               event.target.value = '';
           }
        }
      };

      image.onerror = () => {
         toast({
            variant: "destructive",
            title: "Image Load Error",
            description: "Could not load the selected image file.",
          });
         setIsLoading(false);
         if (event.target) {
            event.target.value = '';
         }
      }
    };
    
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "Failed to read the selected file.",
      });
      if (event.target) {
        event.target.value = '';
      }
    };
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      <canvas ref={canvasRef} className="hidden" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        <span className="sr-only">Scan with camera</span>
      </Button>
    </>
  );
}
