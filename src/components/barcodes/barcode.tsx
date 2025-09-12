
"use client";

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { QrCodeData } from '@/lib/types';


interface BarcodeDisplayProps {
    item: Omit<QrCodeData, 'id' | 'createdAt'>;
}

export function BarcodeDisplay({ item }: BarcodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { serialNumber } = item;

  useEffect(() => {
    const qrData = JSON.stringify(item);
    QRCode.toDataURL(qrData, { 
      errorCorrectionLevel: 'H', 
      type: 'image/png',
      quality: 0.9,
      margin: 2,
      scale: 8, // Generate a larger image
    })
        .then(url => {
            setQrCodeUrl(url);
        })
        .catch(err => {
            console.error("QR Code generation failed", err);
        });
  }, [item]);

  return (
    <div className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid aspect-square">
        {qrCodeUrl ? (
            <>
                <img 
                  src={qrCodeUrl} 
                  alt={`QR code for ${serialNumber}`} 
                  className="w-full h-full object-contain"
                />
                <p className="text-xs mt-1 font-mono">{serialNumber}</p>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
