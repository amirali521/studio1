
"use-client";

import { useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { QrCodeData } from '@/lib/types';


export type DownloadFormat = 'svg' | 'png' | 'jpg';

interface BarcodeDisplayProps {
    item: QrCodeData;
    productName: string;
    size?: number;
    downloadFormat?: DownloadFormat;
}

export function BarcodeDisplay({ item, productName, size = 150, downloadFormat = 'svg' }: BarcodeDisplayProps) {
  const { serialNumber } = item;
  const svgContainerRef = useRef<HTMLDivElement>(null);

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
    if (!svgContainerRef.current?.firstChild) return;

    const svgEl = svgContainerRef.current.firstChild as SVGElement;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const filename = `${serialNumber}`;

    if (downloadFormat === 'svg') {
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${filename}.svg`);
        URL.revokeObjectURL(url);
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const tempSize = 256; // Render at a fixed higher resolution for better quality
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = tempSize;
            canvas.height = tempSize;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, tempSize, tempSize);
            const dataUrl = canvas.toDataURL(`image/${downloadFormat}`);
            triggerDownload(dataUrl, `${filename}.${downloadFormat}`);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
  };

  const triggerDownload = (href: string, filename: string) => {
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  return (
    <div 
      data-barcode-display
      className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid bg-white" // Added bg-white for html2canvas
      style={{ width: `${size}px` }}
    >
        {qrCodeSvg ? (
            <>
                <div className="text-center text-xs font-bold truncate w-full">{productName}</div>
                <div 
                  ref={svgContainerRef}
                  style={{ width: `${size*0.7}px`, height: `${size*0.7}px` }}
                  className="w-full h-full my-1"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
                />
                <div className="flex items-center justify-between w-full">
                    <p className="text-xs font-mono truncate">{serialNumber}</p>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 shrink-0 print:hidden"
                        onClick={handleDownload}
                        data-download-button="true"
                    >
                        <Download className="w-4 h-4"/>
                    </Button>
                </div>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
