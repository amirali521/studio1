
"use client";

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeDisplayProps {
    serialNumber: string;
    type: 'barcode' | 'qrcode';
}

export function BarcodeDisplay({ serialNumber, type }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (type === 'barcode' && svgRef.current) {
      try {
        JsBarcode(svgRef.current, serialNumber, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    } else if (type === 'qrcode') {
        QRCode.toDataURL(serialNumber, { errorCorrectionLevel: 'H', width: 128 })
            .then(url => {
                setQrCodeUrl(url);
            })
            .catch(err => {
                console.error("QR Code generation failed", err);
            });
    }
  }, [serialNumber, type]);

  return (
    <div className="p-2 border rounded-lg flex flex-col items-center justify-center break-inside-avoid aspect-square">
        {type === 'barcode' ? (
             <svg ref={svgRef}></svg>
        ) : (
            qrCodeUrl ? (
                <>
                    <img src={qrCodeUrl} alt={`QR code for ${serialNumber}`} />
                    <p className="text-xs mt-1 font-mono">{serialNumber}</p>
                </>
            ) : <p>Generating QR...</p>
        )}
    </div>
  );
}
