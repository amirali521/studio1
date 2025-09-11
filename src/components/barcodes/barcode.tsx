"use client";

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
    serialNumber: string;
}

export function Barcode({ serialNumber }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current) {
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
    }
  }, [serialNumber]);

  return (
    <div className="p-2 border rounded-lg flex flex-col items-center break-inside-avoid">
      <svg ref={svgRef}></svg>
    </div>
  );
}
