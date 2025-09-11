"use client";

import { useState, useRef } from "react";
import { ScanLine, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanProductAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScanProductInformationOutput } from "@/ai/flows/scan-product-information";

interface BarcodeScannerProps {
  onScan: (data: ScanProductInformationOutput) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await scanProductAction(base64);

      setIsLoading(false);
      if (result.success && result.data) {
        onScan(result.data);
        toast({
          title: "Scan Successful",
          description: "Product information has been populated.",
        });
      } else {
        const errorMessage = result.error || "Failed to scan image.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: errorMessage,
        });
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      const errorMessage = "Failed to read file.";
      setError(errorMessage);
       toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
    };
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan Barcode/QR Code to Prefill
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
