
"use-client";

import { useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface SimpleQrCodeData {
    serialNumber: string;
    uid: string;
}

export type DownloadFormat = 'svg' | 'png' | 'jpg';

interface BarcodeDisplayProps {
    item: SimpleQrCodeData;
    size?: number;
    productName?: string;
    downloadFormat?: DownloadFormat;
}

export function BarcodeDisplay({ item, size = 150, productName, downloadFormat = 'svg' }: BarcodeDisplayProps) {
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
    const filename = `${productName || 'qrcode'}-${serialNumber}`;

    if (downloadFormat === 'svg') {
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${filename}.svg`);
        URL.revokeObjectURL(url);
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, size, size);
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
      className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid"
      style={{ width: `${size}px` }}
    >
        {qrCodeSvg ? (
            <>
                <div 
                  ref={svgContainerRef}
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
