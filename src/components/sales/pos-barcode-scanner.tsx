
"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";

interface PosBarcodeScannerProps {
  onScan: (data: string) => boolean; // Return true for success, false for failure
}

export default function PosBarcodeScanner({ onScan }: PosBarcodeScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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

      image.onload = async () => {
        const codeReader = new BrowserQRCodeReader();
        try {
          const result = await codeReader.decodeFromImageElement(image);
          const success = onScan(result.getText());
          if (!success) {
            // The onScan function handles its own failure toasts.
          }
        } catch (error) {
          console.error("Error decoding QR code:", error);
          if (error instanceof NotFoundException) {
             toast({
              variant: "destructive",
              title: "Scan Failed",
              description:
                "No valid QR code was found in the image. Please ensure the code is clear and fully visible.",
            });
          } else {
             toast({
              variant: "destructive",
              title: "Scan Error",
              description:
                "Could not process the image. The file might be corrupted or in an unsupported format.",
            });
          }
        } finally {
          setIsLoading(false);
          // Reset file input to allow scanning the same file again
          if (event.target) {
            event.target.value = "";
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
          event.target.value = "";
        }
      };
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "Failed to read the selected file.",
      });
      if (event.target) {
        event.target.value = "";
      }
    };
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Camera
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Gallery
        </Button>
      </div>
    </>
  );
}
