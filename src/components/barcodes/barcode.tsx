
"use client";

import { useMemo } from 'react';
import QRCode from 'qrcode';
import type { QrCodeData } from '@/lib/types';


interface BarcodeDisplayProps {
    item: Omit<QrCodeData, 'id' | 'createdAt'>;
    size?: number;
}

export function BarcodeDisplay({ item, size = 150 }: BarcodeDisplayProps) {
  const { serialNumber } = item;

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


  return (
    <div 
      className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid aspect-square"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
        {qrCodeSvg ? (
            <>
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
                />
                <p className="text-xs mt-1 font-mono">{serialNumber}</p>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
