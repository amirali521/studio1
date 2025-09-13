
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
      className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid"
      style={{ width: `${size}px` }}
    >
        {qrCodeSvg ? (
            <>
                <div 
                  ref={svgRef}
                  style={{ width: `${size*0.8}px`, height: `${size*0.8}px` }}
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
                />
                <div className="flex items-center justify-between w-full mt-2">
                    <p className="text-xs font-mono truncate">{serialNumber}</p>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 shrink-0 print:hidden"
                        onClick={handleDownload}
                    >
                        <Download className="w-4 h-4"/>
                    </Button>
                </div>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
