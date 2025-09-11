
"use client";

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface BarcodeItem {
  serialNumber: string;
  productName: string;
  price: number;
  description: string;
  customFields?: Record<string, string>;
}
interface BarcodeDisplayProps {
    item: BarcodeItem;
}

export function BarcodeDisplay({ item }: BarcodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { serialNumber } = item;

  useEffect(() => {
    const qrData = JSON.stringify(item);
    QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H', width: 128 })
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
                <img src={qrCodeUrl} alt={`QR code for ${serialNumber}`} />
                <p className="text-xs mt-1 font-mono">{serialNumber}</p>
            </>
        ) : <p>Generating QR...</p>}
    </div>
  );
}
