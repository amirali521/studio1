
"use-client";

import { useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface SimpleQrCodeData {
    serialNumber: string;
    uid: string;
}

interface BarcodeDisplayProps {
    item: SimpleQrCodeData;
    size?: number;
    productName?: string;
}

export function BarcodeDisplay({ item, size = 150, productName }: BarcodeDisplayProps) {
  const { serialNumber } = item;
  const svgRef = useRef<HTMLDivElement>(null);

  const qrCodeSvg = useMemo(() => {
    const qrData = JSON.stringify(item);
    let svgString = '';
    QRCode.toString(qrData, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
    }, (err, string) => {
      if (err) {
          console.error("QR Code SVG generation failed", err);
          return;
      };
      svgString = string;
    });
    return svgString;
  }, [item]);
  
  const handleDownload = () => {
    if (svgRef.current?.firstChild) {
      const svgEl = svgRef.current.firstChild as SVGElement;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${productName || 'qrcode'}-${serialNumber}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  return (
    <div 
      className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid relative group"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
        {qrCodeSvg ? (
            <>
                <div 
                  ref={svgRef}
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
                />
                <p className="text-xs mt-1 font-mono">{serialNumber}</p>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                    onClick={handleDownload}
                >
                    <Download className="w-4 h-4"/>
                </Button>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
